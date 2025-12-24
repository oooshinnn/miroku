'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MovieList } from '@/components/movies/MovieList'
import { MovieFilter } from '@/components/movies/MovieFilter'
import { useMovieFilter } from '@/hooks/useMovieFilter'
import { usePersons } from '@/hooks/usePersons'

export default function MoviesPage() {
  const { movies, loading, filters, updateFilters, resetFilters, hasActiveFilters } =
    useMovieFilter()
  const { persons } = usePersons()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">映画一覧</h1>
        <Button asChild>
          <Link href="/movies/search">映画を追加</Link>
        </Button>
      </div>

      <MovieFilter
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        persons={persons}
      />

      {loading ? (
        <div className="text-center py-8 text-slate-600">読み込み中...</div>
      ) : movies.length === 0 ? (
        <div className="text-center py-8 text-slate-600">
          {hasActiveFilters
            ? '条件に一致する映画が見つかりません'
            : '映画がまだ登録されていません'}
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-600">{movies.length} 件の映画</p>
          <MovieList movies={movies} />
        </>
      )}
    </div>
  )
}
