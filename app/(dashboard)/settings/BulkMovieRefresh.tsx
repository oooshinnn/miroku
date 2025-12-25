'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RefreshCw } from 'lucide-react'
import type { Movie, Person, PersonInsert } from '@/types/movie'
import type { TMDBMovieDetails, TMDBCredits } from '@/lib/tmdb/types'

interface RefreshProgress {
  current: number
  total: number
  currentMovie: string
  status: 'idle' | 'running' | 'completed' | 'error'
  errors: string[]
}

export function BulkMovieRefresh() {
  const [progress, setProgress] = useState<RefreshProgress>({
    current: 0,
    total: 0,
    currentMovie: '',
    status: 'idle',
    errors: [],
  })
  const supabase = createClient()

  const refreshAllMovies = async () => {
    setProgress({
      current: 0,
      total: 0,
      currentMovie: '映画一覧を取得中...',
      status: 'running',
      errors: [],
    })

    try {
      // ユーザーを取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProgress(prev => ({ ...prev, status: 'error', errors: ['ログインが必要です'] }))
        return
      }

      // TMDB IDがある映画を全て取得
      const { data: movies, error: fetchError } = await supabase
        .from('movies')
        .select('*')
        .not('tmdb_movie_id', 'is', null)
        .order('created_at', { ascending: false })

      if (fetchError || !movies) {
        setProgress(prev => ({ ...prev, status: 'error', errors: ['映画の取得に失敗しました'] }))
        return
      }

      setProgress(prev => ({ ...prev, total: movies.length }))

      const errors: string[] = []

      for (let i = 0; i < movies.length; i++) {
        const movie = movies[i] as Movie
        const movieTitle = movie.custom_title || movie.tmdb_title || '不明'

        setProgress(prev => ({
          ...prev,
          current: i + 1,
          currentMovie: movieTitle,
        }))

        try {
          // TMDB APIから最新データを取得
          const response = await fetch(`/api/tmdb/movie/${movie.tmdb_movie_id}`)
          if (!response.ok) {
            errors.push(`${movieTitle}: TMDB APIエラー`)
            continue
          }

          const { details, credits }: { details: TMDBMovieDetails; credits: TMDBCredits } = await response.json()

          // 映画の基本情報を更新
          // tmdb_overviewはスキーマキャッシュに反映されていないため一時的に除外
          const updateData = {
            tmdb_title: details.title,
            tmdb_poster_path: details.poster_path,
            tmdb_release_date: details.release_date || null,
            tmdb_production_countries: details.production_countries?.map(c => c.name) || null,
          }

          const query = supabase.from('movies')
          // @ts-expect-error - Supabase type inference issue with update
          await query.update(updateData).eq('id', movie.id)

          // 既存のクレジット情報を削除
          await supabase
            .from('movie_persons')
            .delete()
            .eq('movie_id', movie.id)

          // クレジット情報を再登録
          const allDirectors = credits.crew?.filter(c => c.job === 'Director') || []
          const allWriters = (credits.crew?.filter(c => c.job === 'Writer' || c.job === 'Screenplay') || []).slice(0, 5)
          const allCast = (credits.cast || []).slice(0, 5)

          // 監督を保存
          for (const director of allDirectors) {
            const personId = await findOrCreatePerson(user.id, director.id, director.name)
            if (personId) {
              await supabase.from('movie_persons').insert({
                movie_id: movie.id,
                person_id: personId,
                role: 'director',
              } as any)
            }
          }

          // 脚本家を保存
          for (const writer of allWriters) {
            const personId = await findOrCreatePerson(user.id, writer.id, writer.name)
            if (personId) {
              await supabase.from('movie_persons').insert({
                movie_id: movie.id,
                person_id: personId,
                role: 'writer',
              } as any)
            }
          }

          // キャストを保存
          for (const castMember of allCast) {
            const personId = await findOrCreatePerson(user.id, castMember.id, castMember.name)
            if (personId) {
              await supabase.from('movie_persons').insert({
                movie_id: movie.id,
                person_id: personId,
                role: 'cast',
                cast_order: castMember.order,
              } as any)
            }
          }

          // TMDB APIのレート制限対策
          await new Promise(resolve => setTimeout(resolve, 100))

        } catch (err) {
          errors.push(`${movieTitle}: ${err instanceof Error ? err.message : '不明なエラー'}`)
        }
      }

      setProgress(prev => ({
        ...prev,
        status: 'completed',
        currentMovie: '完了',
        errors,
      }))

    } catch (err) {
      setProgress(prev => ({
        ...prev,
        status: 'error',
        errors: [err instanceof Error ? err.message : '不明なエラー'],
      }))
    }
  }

  // 人物を検索または作成
  const findOrCreatePerson = async (
    userId: string,
    tmdbPersonId: number,
    displayName: string
  ): Promise<string | null> => {
    const { data: person } = await supabase
      .from('persons')
      .select('*')
      .eq('user_id', userId)
      .eq('tmdb_person_id', tmdbPersonId)
      .maybeSingle() as { data: Person | null }

    if (person) {
      return person.id
    }

    // tmdb_profile_pathはスキーマキャッシュに反映されていないため除外
    const personData: Omit<PersonInsert, 'tmdb_profile_path'> = {
      user_id: userId,
      tmdb_person_id: tmdbPersonId,
      display_name: displayName,
    }

    const { data: newPerson, error } = await supabase
      .from('persons')
      .insert(personData as any)
      .select()
      .single() as { data: Person | null; error: unknown }

    if (error || !newPerson) {
      return null
    }
    return newPerson.id
  }

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>映画データの一括更新</CardTitle>
        <CardDescription>
          全ての映画の情報をTMDBから再取得して更新します。
          タイトル、ポスター、公開日、製作国、監督・脚本・キャストが更新されます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress.status === 'running' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>{progress.currentMovie}</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <Progress value={progressPercent} />
          </div>
        )}

        {progress.status === 'completed' && (
          <div className="space-y-2">
            <p className="text-sm text-green-600">
              {progress.total} 件の映画を更新しました
              {progress.errors.length > 0 && `（${progress.errors.length} 件のエラー）`}
            </p>
            {progress.errors.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-slate-500">エラー詳細</summary>
                <ul className="mt-2 space-y-1 text-red-600">
                  {progress.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {progress.status === 'error' && (
          <p className="text-sm text-red-600">
            エラーが発生しました: {progress.errors[0]}
          </p>
        )}

        <Button
          onClick={refreshAllMovies}
          disabled={progress.status === 'running'}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${progress.status === 'running' ? 'animate-spin' : ''}`} />
          {progress.status === 'running' ? '更新中...' : '全映画を更新'}
        </Button>
      </CardContent>
    </Card>
  )
}
