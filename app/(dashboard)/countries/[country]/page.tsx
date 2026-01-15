'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMovieFilter } from '@/hooks/useMovieFilter'
import { MovieCard } from '@/components/movies/MovieCard'

export default function CountryDetailPage() {
  const params = useParams()
  const country = decodeURIComponent(params.country as string)
  const { movies, loading } = useMovieFilter()

  const filteredMovies = useMemo(() => {
    return movies.filter(m => {
      const countries = m.custom_production_countries || m.tmdb_production_countries || []
      return countries.includes(country)
    })
  }, [movies, country])

  if (loading) {
    return <div className="text-center py-8 text-slate-600">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/countries">
          <Button variant="outline">← 一覧に戻る</Button>
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-slate-600" />
          <h1 className="text-2xl font-bold text-slate-900">
            {country}の映画
          </h1>
        </div>
        <p className="text-slate-600 mt-1">{filteredMovies.length}本</p>
      </div>

      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-500 py-8">
          この国の映画はありません
        </p>
      )}
    </div>
  )
}
