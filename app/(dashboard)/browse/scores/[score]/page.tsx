'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Star, ArrowLeft } from 'lucide-react'
import { useMovieFilter } from '@/hooks/useMovieFilter'
import { MovieCard } from '@/components/movies/MovieCard'
import type { WatchScore } from '@/types/watch-log'

export default function ScoreDetailPage() {
  const params = useParams()
  const score = Number(params.score) as WatchScore
  const { movies, loading } = useMovieFilter()

  const filteredMovies = useMemo(() => {
    return movies.filter(m => m.bestScore === score)
  }, [movies, score])

  if (loading) {
    return <div className="text-center py-8 text-slate-600">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/browse/scores"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 text-yellow-500">
              {Array.from({ length: score }).map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-current" />
              ))}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              の映画
            </h1>
          </div>
          <p className="text-slate-600 mt-1">{filteredMovies.length}本</p>
        </div>
      </div>

      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-500 py-8">
          この評価の映画はありません
        </p>
      )}
    </div>
  )
}
