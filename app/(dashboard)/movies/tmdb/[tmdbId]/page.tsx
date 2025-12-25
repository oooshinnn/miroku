'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMovies } from '@/hooks/useMovies'
import type { TMDBMovieDetails, TMDBCredits } from '@/lib/tmdb/types'

interface TMDBPreviewPageProps {
  params: Promise<{ tmdbId: string }>
}

interface PersonInfo {
  id: number
  name: string
  profile_path: string | null
}

export default function TMDBPreviewPage({ params }: TMDBPreviewPageProps) {
  const router = useRouter()
  const { addMovieQuick, getTmdbIdToMovieIdMap } = useMovies()
  const [tmdbId, setTmdbId] = useState<number | null>(null)
  const [movieDetails, setMovieDetails] = useState<TMDBMovieDetails | null>(null)
  const [credits, setCredits] = useState<TMDBCredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500'

  // 追加済みかどうか確認
  const tmdbIdToMovieIdMap = getTmdbIdToMovieIdMap()
  const existingMovieId = tmdbId ? tmdbIdToMovieIdMap.get(tmdbId) : null
  const isAdded = !!existingMovieId

  useEffect(() => {
    const fetchData = async () => {
      const resolvedParams = await params
      const id = parseInt(resolvedParams.tmdbId, 10)
      setTmdbId(id)

      try {
        const response = await fetch(`/api/tmdb/movie/${id}`)
        if (!response.ok) {
          throw new Error('映画情報の取得に失敗しました')
        }
        const data = await response.json()
        setMovieDetails(data.details)
        setCredits(data.credits)
      } catch (err) {
        setError(err instanceof Error ? err.message : '映画情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params])

  const handleAddMovie = async () => {
    if (!movieDetails || !tmdbId) return

    setAdding(true)
    setError(null)

    try {
      // movieDetailsとcreditsを一緒に渡して、クレジット情報も同時に保存
      const newMovie = await addMovieQuick(movieDetails, {
        details: movieDetails,
        credits: credits || undefined,
      })
      router.push(`/movies/${newMovie.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '映画の追加に失敗しました')
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-slate-500">読み込み中...</div>
      </div>
    )
  }

  if (error && !movieDetails) {
    return (
      <div className="space-y-4">
        <Link href="/movies/search">
          <Button variant="outline">← 検索に戻る</Button>
        </Link>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!movieDetails) {
    return null
  }

  const posterUrl = movieDetails.poster_path
    ? `${IMAGE_BASE_URL}${movieDetails.poster_path}`
    : null

  const releaseYear = movieDetails.release_date
    ? new Date(movieDetails.release_date).getFullYear()
    : null

  const productionCountries = movieDetails.production_countries?.map((c) => c.name) || []

  // クレジット情報を整理
  const directors: PersonInfo[] = credits?.crew
    ?.filter((c) => c.job === 'Director')
    .map((c) => ({ id: c.id, name: c.name, profile_path: c.profile_path })) || []

  const writers: PersonInfo[] = credits?.crew
    ?.filter((c) => c.job === 'Screenplay' || c.job === 'Writer')
    .map((c) => ({ id: c.id, name: c.name, profile_path: c.profile_path })) || []

  const castMembers: PersonInfo[] = credits?.cast?.slice(0, 6).map((c) => ({
    id: c.id,
    name: c.name,
    profile_path: c.profile_path,
  })) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/movies/search">
          <Button variant="outline">← 検索に戻る</Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ポスター画像 */}
        <div className="md:col-span-1">
          <Card className="overflow-hidden">
            <div className="relative aspect-[2/3] bg-slate-200">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={movieDetails.title}
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
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              {movieDetails.title}
            </h1>
            <div className="flex gap-4 text-slate-600 mb-4">
              {releaseYear && <span>{releaseYear}</span>}
              {productionCountries.length > 0 && (
                <span>{productionCountries.join(', ')}</span>
              )}
            </div>
            {movieDetails.overview && (
              <p className="text-slate-600 text-sm leading-relaxed">
                {movieDetails.overview}
              </p>
            )}
          </div>

          {/* 追加/登録済みエリア */}
          <Card className="border-2 border-dashed">
            <CardContent className="py-6">
              {isAdded ? (
                <div className="text-center space-y-4">
                  <p className="text-slate-600">この映画は登録済みです</p>
                  <div className="flex justify-center gap-4">
                    <Link href={`/movies/${existingMovieId}`}>
                      <Button>映画の詳細を見る</Button>
                    </Link>
                    <Link href={`/watch-logs/new?movieId=${existingMovieId}`}>
                      <Button variant="outline">視聴ログを追加</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-slate-600">この映画はまだ追加されていません</p>
                  <Button onClick={handleAddMovie} disabled={adding} size="lg">
                    {adding ? '追加中...' : 'この映画を追加する'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* スタッフ・キャスト */}
          <div className="space-y-4">
            {directors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">監督</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {directors.map((d) => (
                      <span
                        key={d.id}
                        className="px-3 py-1 bg-slate-100 rounded-full text-sm"
                      >
                        {d.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {writers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">脚本</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {writers.map((w) => (
                      <span
                        key={w.id}
                        className="px-3 py-1 bg-slate-100 rounded-full text-sm"
                      >
                        {w.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {castMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">キャスト</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {castMembers.map((c) => (
                      <span
                        key={c.id}
                        className="px-3 py-1 bg-slate-100 rounded-full text-sm"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
