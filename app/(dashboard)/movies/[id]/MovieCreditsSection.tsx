'use client'

import { useEffect, useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { EditablePersonList } from '@/components/movies/EditablePersonList'
import { createClient } from '@/lib/supabase/client'
import { useMovies } from '@/hooks/useMovies'

interface PersonData {
  id: string
  personId: string
  displayName: string
  tmdbPersonId: number | null
  castOrder?: number
}

interface MoviePersonWithPerson {
  id: string
  role: string
  cast_order: number | null
  person: {
    id: string
    display_name: string
    tmdb_person_id: number | null
  }
}

interface MovieCreditsSectionProps {
  movieId: string
  tmdbMovieId: number | null
}

export function MovieCreditsSection({ movieId, tmdbMovieId }: MovieCreditsSectionProps) {
  const { fetchAndSaveCredits } = useMovies()
  const fetchAndSaveCreditsRef = useRef(fetchAndSaveCredits)
  fetchAndSaveCreditsRef.current = fetchAndSaveCredits
  const initializedRef = useRef(false)

  const [directors, setDirectors] = useState<PersonData[]>([])
  const [writers, setWriters] = useState<PersonData[]>([])
  const [cast, setCast] = useState<PersonData[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchingCredits, setFetchingCredits] = useState(false)
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'done' | 'empty' | 'error'>('idle')

  // 初回ロード
  useEffect(() => {
    // 二重実行防止
    if (initializedRef.current) return
    initializedRef.current = true

    const supabase = createClient()

    const fetchCredits = async () => {
      const { data: moviePersons, error } = await supabase
        .from('movie_persons')
        .select(`
          id,
          role,
          cast_order,
          person:persons(
            id,
            display_name,
            tmdb_person_id
          )
        `)
        .eq('movie_id', movieId)

      if (error) {
        console.error('Failed to fetch movie persons:', error)
        setLoading(false)
        return 0
      }

      const typedMoviePersons = moviePersons as MoviePersonWithPerson[]

      const directorsData = typedMoviePersons
        ?.filter((mp) => mp.role === 'director')
        .map((mp) => ({
          id: mp.id,
          personId: mp.person.id,
          displayName: mp.person.display_name,
          tmdbPersonId: mp.person.tmdb_person_id,
        })) || []

      const writersData = typedMoviePersons
        ?.filter((mp) => mp.role === 'writer')
        .map((mp) => ({
          id: mp.id,
          personId: mp.person.id,
          displayName: mp.person.display_name,
          tmdbPersonId: mp.person.tmdb_person_id,
        })) || []

      const castData = typedMoviePersons
        ?.filter((mp) => mp.role === 'cast')
        .sort((a, b) => (a.cast_order || 999) - (b.cast_order || 999))
        .map((mp) => ({
          id: mp.id,
          personId: mp.person.id,
          displayName: mp.person.display_name,
          tmdbPersonId: mp.person.tmdb_person_id,
          castOrder: mp.cast_order ?? undefined,
        })) || []

      setDirectors(directorsData)
      setWriters(writersData)
      setCast(castData)
      setLoading(false)

      return moviePersons?.length || 0
    }

    const init = async () => {
      const count = await fetchCredits()

      // クレジット情報がなく、TMDB IDがある場合は自動取得
      if (count === 0 && tmdbMovieId) {
        setFetchingCredits(true)
        try {
          const result = await fetchAndSaveCreditsRef.current(movieId, tmdbMovieId)
          if (result === true) {
            setFetchStatus('done')
            // 保存後に再取得
            await fetchCredits()
          } else if (result === false) {
            setFetchStatus('empty')
          }
        } catch {
          setFetchStatus('error')
        } finally {
          setFetchingCredits(false)
        }
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, tmdbMovieId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {fetchingCredits && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>スタッフ・キャスト情報を取得中...</span>
        </div>
      )}

      {fetchStatus === 'empty' && (
        <div className="text-sm text-slate-500">
          TMDBにスタッフ・キャスト情報がありませんでした
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex gap-3">
          <span className="text-slate-500 w-12 shrink-0">監督</span>
          <div className="flex-1">
            <EditablePersonList
              persons={directors}
              movieId={movieId}
              role="director"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <span className="text-slate-500 w-12 shrink-0">脚本</span>
          <div className="flex-1">
            <EditablePersonList
              persons={writers}
              movieId={movieId}
              role="writer"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <span className="text-slate-500 w-12 shrink-0">出演</span>
          <div className="flex-1">
            <EditablePersonList
              persons={cast}
              movieId={movieId}
              role="cast"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
