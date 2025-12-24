import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MovieDetailClient } from './MovieDetailClient'
import { MovieActions } from './MovieActions'
import { CreditsFetcher } from './CreditsFetcher'
import { MovieTagSelector } from '@/components/movies/MovieTagSelector'
import { EditablePersonList } from '@/components/movies/EditablePersonList'

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
          display_name,
          tmdb_person_id
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

  // 監督、脚本、キャストを分類（ID付き）
  const directors = movie.movie_persons
    ?.filter((mp: any) => mp.role === 'director')
    .map((mp: any) => ({
      id: mp.id,
      personId: mp.person.id,
      displayName: mp.person.display_name,
      tmdbPersonId: mp.person.tmdb_person_id,
    })) || []

  const writers = movie.movie_persons
    ?.filter((mp: any) => mp.role === 'writer')
    .map((mp: any) => ({
      id: mp.id,
      personId: mp.person.id,
      displayName: mp.person.display_name,
      tmdbPersonId: mp.person.tmdb_person_id,
    })) || []

  const cast = movie.movie_persons
    ?.filter((mp: any) => mp.role === 'cast')
    .sort((a: any, b: any) => (a.cast_order || 999) - (b.cast_order || 999))
    .map((mp: any) => ({
      id: mp.id,
      personId: mp.person.id,
      displayName: mp.person.display_name,
      tmdbPersonId: mp.person.tmdb_person_id,
      castOrder: mp.cast_order,
    })) || []

  // クレジット情報がまだ取得されていないか判定
  const hasNoCredits = movie.tmdb_movie_id && (movie.movie_persons?.length || 0) === 0

  // MovieActions用のデータ（比較用）
  const currentDataForRefresh = {
    title: movie.tmdb_title,
    releaseDate: movie.tmdb_release_date,
    productionCountries: movie.tmdb_production_countries || [],
    posterPath: movie.tmdb_poster_path,
    directors: directors.map((d: any) => ({
      id: d.id,
      personId: d.personId,
      name: d.displayName,
      tmdbId: d.tmdbPersonId,
    })),
    writers: writers.map((w: any) => ({
      id: w.id,
      personId: w.personId,
      name: w.displayName,
      tmdbId: w.tmdbPersonId,
    })),
    cast: cast.map((c: any) => ({
      id: c.id,
      personId: c.personId,
      name: c.displayName,
      tmdbId: c.tmdbPersonId,
      order: c.castOrder || 0,
    })),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/movies">
          <Button variant="outline">← 一覧に戻る</Button>
        </Link>
        <MovieActions
          movieId={id}
          tmdbMovieId={movie.tmdb_movie_id}
          currentData={currentDataForRefresh}
        />
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
            <MovieTagSelector movieId={id} />
          </div>

          {/* スタッフ・キャスト */}
          <div className="space-y-4">
            {/* クレジット情報がない場合はバックグラウンドで取得 */}
            {hasNoCredits && (
              <CreditsFetcher movieId={id} tmdbMovieId={movie.tmdb_movie_id} />
            )}

            {directors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">監督</CardTitle>
                </CardHeader>
                <CardContent>
                  <EditablePersonList persons={directors} />
                </CardContent>
              </Card>
            )}

            {writers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">脚本</CardTitle>
                </CardHeader>
                <CardContent>
                  <EditablePersonList persons={writers} />
                </CardContent>
              </Card>
            )}

            {cast.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">キャスト</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 主演（上位3名） */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2">主演</p>
                    <EditablePersonList persons={cast.slice(0, 3)} />
                  </div>
                  {/* その他のキャスト */}
                  {cast.length > 3 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">出演</p>
                      <EditablePersonList persons={cast.slice(3)} maxDisplay={7} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* 視聴ログセクション */}
      <MovieDetailClient movieId={id} initialWatchCount={movie.watch_count} />
    </div>
  )
}
