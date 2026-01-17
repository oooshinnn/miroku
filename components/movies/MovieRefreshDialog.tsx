'use client'

import { useState } from 'react'
import { RefreshCw, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import type { PostgrestError } from '@supabase/supabase-js'
import type { TMDBMovieDetails, TMDBCredits } from '@/lib/tmdb/types'

interface MovieUpdateData {
  tmdb_title?: string
  tmdb_release_date?: string | null
  tmdb_production_countries?: string[]
}

interface PersonInsert {
  user_id: string
  tmdb_person_id: number
  display_name: string
}

interface MoviePersonInsert {
  movie_id: string
  person_id: string
  role: 'director' | 'writer' | 'cast'
  cast_order?: number | null
}

interface CurrentData {
  title: string | null
  releaseDate: string | null
  productionCountries: string[]
  posterPath: string | null
  directors: { id: string; personId: string; name: string; tmdbId: number | null }[]
  writers: { id: string; personId: string; name: string; tmdbId: number | null }[]
  cast: { id: string; personId: string; name: string; tmdbId: number | null; order: number }[]
}

interface NewData {
  title: string
  releaseDate: string | null
  productionCountries: string[]
  posterPath: string | null
  directors: { id: number; name: string }[]
  writers: { id: number; name: string }[]
  cast: { id: number; name: string; order: number }[]
}

interface MovieRefreshDialogProps {
  movieId: string
  tmdbMovieId: number | null
  currentData: CurrentData
  onRefreshComplete: () => void
}

type SelectableField = 'title' | 'releaseDate' | 'productionCountries' | 'directors' | 'writers' | 'cast'

export function MovieRefreshDialog({ movieId, tmdbMovieId, currentData, onRefreshComplete }: MovieRefreshDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newData, setNewData] = useState<NewData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFields, setSelectedFields] = useState<Set<SelectableField>>(new Set())
  const supabase = createClient()

  const handleFetch = async () => {
    if (!tmdbMovieId) {
      setError('この映画はTMDB IDがないため再取得できません')
      return
    }

    setLoading(true)
    setError(null)
    setNewData(null)
    setSelectedFields(new Set())

    try {
      const response = await fetch(`/api/tmdb/movie/${tmdbMovieId}`)
      if (!response.ok) throw new Error('データの取得に失敗しました')

      const { details, credits }: { details: TMDBMovieDetails; credits: TMDBCredits } = await response.json()

      const directors = credits.crew
        .filter(c => c.job === 'Director')
        .map(d => ({
          id: d.id,
          name: d.name,
        }))

      const writers = credits.crew
        .filter(c => c.job === 'Writer' || c.job === 'Screenplay')
        .slice(0, 5)
        .map(w => ({
          id: w.id,
          name: w.name,
        }))

      const cast = credits.cast.slice(0, 5).map(c => ({
        id: c.id,
        name: c.name,
        order: c.order,
      }))

      setNewData({
        title: details.title,
        releaseDate: details.release_date || null,
        productionCountries: details.production_countries.map(c => c.name),
        posterPath: details.poster_path,
        directors,
        writers,
        cast,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const toggleField = (field: SelectableField) => {
    const newSet = new Set(selectedFields)
    if (newSet.has(field)) {
      newSet.delete(field)
    } else {
      newSet.add(field)
    }
    setSelectedFields(newSet)
  }

  const handleApply = async () => {
    if (!newData || selectedFields.size === 0) return

    setSaving(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが必要です')

      // 映画の基本情報を更新
      const movieUpdates: MovieUpdateData = {}
      if (selectedFields.has('title')) {
        movieUpdates.tmdb_title = newData.title
      }
      if (selectedFields.has('releaseDate')) {
        movieUpdates.tmdb_release_date = newData.releaseDate
      }
      if (selectedFields.has('productionCountries')) {
        movieUpdates.tmdb_production_countries = newData.productionCountries
      }

      if (Object.keys(movieUpdates).length > 0) {
        const updateQuery = supabase.from('movies')
        // @ts-expect-error - Supabase type inference issue with update
        const updateResult = await updateQuery.update(movieUpdates).eq('id', movieId).select() as { data: unknown[] | null; error: PostgrestError | null }
        const { data: updatedData, error: movieError } = updateResult

        if (movieError) {
          throw new Error(`映画情報の更新に失敗: ${movieError.message}`)
        }

        if (!updatedData || updatedData.length === 0) {
          throw new Error('更新対象が見つかりません（権限エラーの可能性）')
        }
      }

      // 人物情報を更新
      const updatePersons = async (
        role: 'director' | 'writer' | 'cast',
        newPersons: { id: number; name: string; order?: number }[]
      ) => {
        // 既存のmovie_personsを削除
        const { error: deleteError } = await supabase
          .from('movie_persons')
          .delete()
          .eq('movie_id', movieId)
          .eq('role', role)

        if (deleteError) {
          throw new Error(`既存データの削除に失敗: ${deleteError.message}`)
        }

        // 新しい人物を追加
        for (const person of newPersons) {
          // 既存の人物を検索（TMDB IDで）
          const { data: existingPerson, error: findError } = (await supabase
            .from('persons')
            .select('id, display_name')
            .eq('user_id', user.id)
            .eq('tmdb_person_id', person.id)
            .maybeSingle()) as { data: { id: string; display_name: string } | null; error: PostgrestError | null }

          if (findError) {
            continue
          }

          let personId: string

          if (existingPerson) {
            personId = existingPerson.id

            // 表示名を更新（名前が変わった場合）
            if (person.name !== existingPerson.display_name) {
              const personQuery = supabase.from('persons')
              // @ts-expect-error - Supabase type inference issue with update
              await personQuery.update({ display_name: person.name }).eq('id', personId)
            }
          } else {
            const personInsertData: PersonInsert = {
              user_id: user.id,
              tmdb_person_id: person.id,
              display_name: person.name,
            }
            const { data: newPerson, error: insertError } = (await supabase
              .from('persons')
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .insert(personInsertData as any)
              .select('id')
              .single()) as { data: { id: string } | null; error: PostgrestError | null }

            if (insertError || !newPerson) {
              continue
            }
            personId = newPerson.id
          }

          const castOrder = role === 'cast' ? person.order : null
          const moviePersonInsertData: MoviePersonInsert = {
            movie_id: movieId,
            person_id: personId,
            role,
            cast_order: castOrder,
          }
          await supabase
            .from('movie_persons')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(moviePersonInsertData as any)
        }
      }

      if (selectedFields.has('directors')) {
        await updatePersons('director', newData.directors)
      }
      if (selectedFields.has('writers')) {
        await updatePersons('writer', newData.writers)
      }
      if (selectedFields.has('cast')) {
        await updatePersons('cast', newData.cast)
      }

      setOpen(false)
      onRefreshComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = (field: SelectableField): boolean => {
    if (!newData) return false

    switch (field) {
      case 'title':
        return currentData.title !== newData.title
      case 'releaseDate':
        return currentData.releaseDate !== newData.releaseDate
      case 'productionCountries':
        return JSON.stringify(currentData.productionCountries) !== JSON.stringify(newData.productionCountries)
      case 'directors': {
        const currentNames = currentData.directors.map(d => d.name).sort()
        const newNames = newData.directors.map(d => d.name).sort()
        return JSON.stringify(currentNames) !== JSON.stringify(newNames)
      }
      case 'writers': {
        const currentNames = currentData.writers.map(w => w.name).sort()
        const newNames = newData.writers.map(w => w.name).sort()
        return JSON.stringify(currentNames) !== JSON.stringify(newNames)
      }
      case 'cast': {
        const currentNames = currentData.cast.map(c => c.name).sort()
        const newNames = newData.cast.map(c => c.name).sort()
        const isDiff = JSON.stringify(currentNames) !== JSON.stringify(newNames)

        // 順序が違う場合も変更ありとする（cast_orderの更新が必要）
        const orderDiff = JSON.stringify(currentData.cast.map(c => c.name)) !==
                          JSON.stringify(newData.cast.map(c => c.name))

        return isDiff || orderDiff
      }
      default:
        return false
    }
  }

  const ComparisonRow = ({
    label,
    field,
    currentValue,
    newValue,
  }: {
    label: string
    field: SelectableField
    currentValue: string
    newValue: string
  }) => {
    const changed = hasChanges(field)
    return (
      <div className={`py-3 border-b last:border-b-0 ${changed ? 'bg-amber-50' : ''}`}>
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selectedFields.has(field)}
            onCheckedChange={() => toggleField(field)}
            disabled={!changed}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 mb-1">{label}</p>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start text-sm">
              <div className="text-slate-600 break-words">
                <span className="text-xs text-slate-400 block">現在</span>
                {currentValue || <span className="text-slate-400">-</span>}
              </div>
              {changed && <ArrowRight className="h-4 w-4 text-slate-400 mt-4" />}
              <div className={`break-words ${changed ? 'text-blue-600 font-medium' : 'text-slate-600'}`}>
                <span className="text-xs text-slate-400 block">TMDB</span>
                {newValue || <span className="text-slate-400">-</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" />
          データベースから再取得
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>TMDBからデータを再取得</DialogTitle>
          <DialogDescription>
            TMDBから最新データを取得し、現在のデータと比較します。更新したい項目を選択してください。
          </DialogDescription>
        </DialogHeader>

        {!tmdbMovieId ? (
          <div className="py-8 text-center text-slate-500">
            この映画はTMDB IDがないため再取得できません
          </div>
        ) : !newData ? (
          <div className="py-8 text-center">
            <Button onClick={handleFetch} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  取得中...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  データを取得
                </>
              )}
            </Button>
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          </div>
        ) : (
          <div className="space-y-1">
            <ComparisonRow
              label="タイトル"
              field="title"
              currentValue={currentData.title || ''}
              newValue={newData.title}
            />
            <ComparisonRow
              label="公開日"
              field="releaseDate"
              currentValue={currentData.releaseDate || ''}
              newValue={newData.releaseDate || ''}
            />
            <ComparisonRow
              label="製作国"
              field="productionCountries"
              currentValue={currentData.productionCountries.join(', ')}
              newValue={newData.productionCountries.join(', ')}
            />
            <ComparisonRow
              label={`監督 (${currentData.directors.length}名 → ${newData.directors.length}名)`}
              field="directors"
              currentValue={currentData.directors.map(d => d.name).join(', ')}
              newValue={newData.directors.map(d => d.name).join(', ')}
            />
            <ComparisonRow
              label={`脚本 (${currentData.writers.length}名 → ${newData.writers.length}名)`}
              field="writers"
              currentValue={currentData.writers.map(w => w.name).join(', ')}
              newValue={newData.writers.map(w => w.name).join(', ')}
            />
            <ComparisonRow
              label={`キャスト (${currentData.cast.length}名 → ${newData.cast.length}名)`}
              field="cast"
              currentValue={currentData.cast.slice(0, 10).map(c => c.name).join(', ') + (currentData.cast.length > 10 ? ` 他${currentData.cast.length - 10}名` : '')}
              newValue={newData.cast.slice(0, 10).map(c => c.name).join(', ') + (newData.cast.length > 10 ? ` 他${newData.cast.length - 10}名` : '')}
            />

            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          {newData && (
            <Button onClick={handleApply} disabled={saving || selectedFields.size === 0}>
              {saving ? '更新中...' : `選択した${selectedFields.size}項目を更新`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
