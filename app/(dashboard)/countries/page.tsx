'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Globe, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useMovieFilter } from '@/hooks/useMovieFilter'
import { MovieCard } from '@/components/movies/MovieCard'

interface CountryData {
  country: string
  count: number
}

export default function CountriesBrowsePage() {
  const { movies, loading } = useMovieFilter()

  // 国別に映画をグループ化
  const moviesByCountry = useMemo(() => {
    const grouped = new Map<string, typeof movies>()

    for (const movie of movies) {
      const countries = movie.custom_production_countries || movie.tmdb_production_countries || []
      for (const country of countries) {
        if (!grouped.has(country)) {
          grouped.set(country, [])
        }
        grouped.get(country)!.push(movie)
      }
    }

    return grouped
  }, [movies])

  // 統計情報（映画数の多い順）
  const stats = useMemo(() => {
    return Array.from(moviesByCountry.entries())
      .map(([country, countryMovies]) => ({
        country,
        count: countryMovies.length,
      }))
      .sort((a, b) => b.count - a.count)
  }, [moviesByCountry])

  if (loading) {
    return <div className="text-center py-8 text-slate-600">読み込み中...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">制作国別</h1>
        <p className="text-slate-600 mt-1">制作国ごとの映画一覧</p>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {stats.slice(0, 12).map(({ country, count }) => (
          <Link key={country} href={`/countries/${encodeURIComponent(country)}`}>
            <Card className="hover:border-slate-400 transition-colors cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-center justify-center gap-2 text-slate-600 mb-2">
                  <Globe className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-center truncate">{country}</p>
                <p className="text-2xl font-bold text-center mt-1">{count}</p>
                <p className="text-sm text-slate-500 text-center">本</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 国別セクション */}
      {stats.slice(0, 10).map(({ country }) => {
        const countryMovies = moviesByCountry.get(country)
        if (!countryMovies || countryMovies.length === 0) return null

        return (
          <section key={country} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-slate-600" />
                <span className="text-lg font-semibold text-slate-900">
                  {country}
                </span>
                <span className="text-slate-500">
                  {countryMovies.length}本
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {countryMovies.slice(0, 12).map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {countryMovies.length > 12 && (
              <Link
                href={`/countries/${encodeURIComponent(country)}`}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                すべて表示 ({countryMovies.length}本)
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </section>
        )
      })}

      {stats.length === 0 && (
        <p className="text-center text-slate-500 py-8">
          制作国情報のある映画がありません
        </p>
      )}
    </div>
  )
}
