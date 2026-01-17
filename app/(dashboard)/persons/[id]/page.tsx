import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EditablePersonName } from './EditablePersonName'
import type { Person } from '@/types/movie'

interface MovieInfo {
  id: string
  tmdb_title: string | null
  custom_title: string | null
  tmdb_poster_path: string | null
  custom_poster_url: string | null
  tmdb_release_date: string | null
  custom_release_date: string | null
}

interface MoviePersonWithMovie {
  role: string
  cast_order: number | null
  movie: MovieInfo
}

interface PersonDetailPageProps {
  params: Promise<{ id: string }>
}

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500'

const roleLabels: Record<string, string> = {
  director: '監督',
  writer: '脚本',
  cast: 'キャスト',
}

export default async function PersonDetailPage({ params }: PersonDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 人物情報を取得
  const { data: person, error } = await supabase
    .from('persons')
    .select('*')
    .eq('id', id)
    .single() as { data: Person | null; error: PostgrestError | null }

  if (error || !person) {
    notFound()
  }

  // 関連する映画を取得
  const { data: moviePersons } = await supabase
    .from('movie_persons')
    .select(`
      role,
      cast_order,
      movie:movies(
        id,
        tmdb_title,
        custom_title,
        tmdb_poster_path,
        custom_poster_url,
        tmdb_release_date,
        custom_release_date
      )
    `)
    .eq('person_id', id)
    .order('cast_order', { ascending: true })

  // 映画をロール別に分類
  const moviesByRole: Record<string, MovieInfo[]> = {
    director: [],
    writer: [],
    cast: [],
  }

  const typedMoviePersons = moviePersons as MoviePersonWithMovie[] | null

  if (typedMoviePersons) {
    for (const mp of typedMoviePersons) {
      if (mp.movie && mp.role) {
        moviesByRole[mp.role]?.push(mp.movie)
      }
    }
  }

  const totalMovies = new Set(
    typedMoviePersons?.map((mp) => mp.movie?.id).filter(Boolean) || []
  ).size

  return (
    <div className="space-y-6">
      <div>
        <Link href="/persons">
          <Button variant="outline">← 一覧に戻る</Button>
        </Link>
      </div>

      {/* 人物情報 */}
      <div className="flex items-center gap-4">
        <div className="relative w-32 h-32 rounded-[30%] overflow-hidden bg-slate-200 flex-shrink-0">
          {person.tmdb_profile_path ? (
            <Image
              src={`${IMAGE_BASE_URL}${person.tmdb_profile_path}`}
              alt={person.display_name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <User className="h-8 w-8" />
            </div>
          )}
        </div>
        <div>
          <EditablePersonName personId={person.id} initialName={person.display_name} />
          <p className="text-slate-600 mt-1">{totalMovies} 作品</p>
        </div>
      </div>

      {/* 関連作品 */}
      {(['director', 'writer', 'cast'] as const).map((role) => {
        const movies = moviesByRole[role]
        if (movies.length === 0) return null

        return (
          <div key={role} className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">
              {roleLabels[role]}として ({movies.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movies.map((movie) => {
                const title = movie.custom_title || movie.tmdb_title || '不明'
                const posterPath = movie.custom_poster_url ||
                  (movie.tmdb_poster_path ? `${IMAGE_BASE_URL}${movie.tmdb_poster_path}` : null)
                const releaseDate = movie.custom_release_date || movie.tmdb_release_date

                return (
                  <Link
                    key={movie.id}
                    href={`/movies/${movie.id}`}
                    className="group space-y-2"
                  >
                    <div className="relative aspect-[2/3] bg-slate-200 rounded-lg overflow-hidden group-hover:ring-2 group-hover:ring-slate-400 transition-all">
                      {posterPath ? (
                        <Image
                          src={posterPath}
                          alt={title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                          画像なし
                        </div>
                      )}
                    </div>
                    <div className="px-1">
                      <h3 className="font-medium text-slate-900 line-clamp-2 text-sm leading-tight group-hover:text-blue-600 transition-colors">
                        {title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {releaseDate ? new Date(releaseDate).getFullYear() : '年不明'}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}

      {totalMovies === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-slate-600">
            関連する作品がありません
          </CardContent>
        </Card>
      )}
    </div>
  )
}
