import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MovieDetailClient } from './MovieDetailClient'
import { MovieActions } from './MovieActions'
import { MovieCreditsSection } from './MovieCreditsSection'
import { MovieOverview } from './MovieOverview'
import { MovieTagSelector } from '@/components/movies/MovieTagSelector'

interface MovieDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 映画情報を取得（スタッフ・キャスト情報はクライアントコンポーネントで取得）
  const { data: movie, error } = (await supabase
    .from('movies')
    .select('*')
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

  // MovieActions用のデータ（比較用）- クライアントで取得するため空で初期化
  const currentDataForRefresh = {
    title: movie.tmdb_title,
    releaseDate: movie.tmdb_release_date,
    productionCountries: movie.tmdb_production_countries || [],
    posterPath: movie.tmdb_poster_path,
    directors: [],
    writers: [],
    cast: [],
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

          {/* あらすじ */}
          <MovieOverview tmdbMovieId={movie.tmdb_movie_id} />

          {/* スタッフ・キャスト（クライアントコンポーネント） */}
          <MovieCreditsSection
            movieId={id}
            tmdbMovieId={movie.tmdb_movie_id}
          />
        </div>
      </div>

      {/* 視聴ログセクション */}
      <MovieDetailClient movieId={id} />
    </div>
  )
}
