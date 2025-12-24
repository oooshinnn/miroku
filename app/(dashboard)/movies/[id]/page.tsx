import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MovieDetailClient } from './MovieDetailClient'
import { MovieTagSelector } from '@/components/movies/MovieTagSelector'
import { WatchCountEditor } from '@/components/movies/WatchCountEditor'

interface MovieDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 映画情報を取得
  const { data: movie, error } = (await supabase
    .from('movies')
    .select(`
      *,
      movie_persons(
        id,
        role,
        cast_order,
        person:persons(
          id,
          display_name
        )
      )
    `)
    .eq('id', id)
    .single()) as { data: any; error: any }

  if (error || !movie) {
    notFound()
  }

  const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500'
  const title = movie.custom_title || movie.tmdb_title || '不明'
  const posterPath = movie.custom_poster_url || (movie.tmdb_poster_path ? `${IMAGE_BASE_URL}${movie.tmdb_poster_path}` : null)
  const releaseDate = movie.custom_release_date || movie.tmdb_release_date
  const productionCountries = movie.custom_production_countries || movie.tmdb_production_countries || []

  // 監督、脚本、キャストを分類
  const directors = movie.movie_persons
    ?.filter((mp: any) => mp.role === 'director')
    .map((mp: any) => mp.person.display_name) || []

  const writers = movie.movie_persons
    ?.filter((mp: any) => mp.role === 'writer')
    .map((mp: any) => mp.person.display_name) || []

  const cast = movie.movie_persons
    ?.filter((mp: any) => mp.role === 'cast')
    .sort((a: any, b: any) => (a.cast_order || 999) - (b.cast_order || 999))
    .map((mp: any) => mp.person.display_name) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/movies">
          <Button variant="outline">← 一覧に戻る</Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/movies/${id}/edit`}>
            <Button variant="outline">編集</Button>
          </Link>
          <Link href={`/watch-logs/new?movie_id=${id}`}>
            <Button>視聴ログを追加</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ポスター画像 */}
        <div className="md:col-span-1">
          <Card className="overflow-hidden">
            <div className="relative aspect-[2/3] bg-slate-200">
              {posterPath ? (
                <Image
                  src={posterPath}
                  alt={title}
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  画像なし
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 映画情報 */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{title}</h1>
            <div className="flex gap-4 text-slate-600 mb-4">
              {releaseDate && (
                <span>{new Date(releaseDate).getFullYear()}</span>
              )}
              {productionCountries.length > 0 && (
                <span>{productionCountries.join(', ')}</span>
              )}
            </div>
            <div className="space-y-3">
              <WatchCountEditor movieId={id} initialCount={movie.watch_count} />
              <MovieTagSelector movieId={id} />
            </div>
          </div>

          {/* スタッフ・キャスト */}
          <div className="space-y-4">
            {directors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">監督</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700">{directors.join(', ')}</p>
                </CardContent>
              </Card>
            )}

            {writers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">脚本</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700">{writers.join(', ')}</p>
                </CardContent>
              </Card>
            )}

            {cast.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">キャスト</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700">{cast.slice(0, 10).join(', ')}</p>
                  {cast.length > 10 && (
                    <p className="text-slate-500 text-sm mt-2">
                      他 {cast.length - 10} 名
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* 視聴ログセクション */}
      <MovieDetailClient movieId={id} />
    </div>
  )
}
