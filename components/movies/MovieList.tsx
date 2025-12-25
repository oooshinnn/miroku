'use client'

import { MovieCard } from './MovieCard'
import type { MovieWithExtras } from '@/types/movie'

interface MovieListProps {
  movies: MovieWithExtras[]
}

export function MovieList({ movies }: MovieListProps) {
  if (movies.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-600">
          まだ映画が登録されていません。右上のボタンから映画を追加してください。
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 grid-rows-[auto_auto_auto]">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  )
}
