'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { TMDBMovie } from '@/lib/tmdb/types'

interface MovieSearchResultsProps {
  results: TMDBMovie[]
  onSelect: (movie: TMDBMovie) => void
  addingMovieId: number | null
}

export function MovieSearchResults({ results, onSelect, addingMovieId }: MovieSearchResultsProps) {
  const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500'

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-slate-600">
        検索結果がありません
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {results.map((movie) => (
        <Card key={movie.id} className="overflow-hidden">
          <div className="relative h-48 bg-slate-200">
            {movie.poster_path ? (
              <Image
                src={`${IMAGE_BASE_URL}${movie.poster_path}`}
                alt={movie.title}
                fill
                className="object-cover"
                unoptimized
                priority={false}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                画像なし
              </div>
            )}
          </div>
          <CardHeader>
            <CardTitle className="text-lg line-clamp-2">{movie.title}</CardTitle>
            <CardDescription>
              {movie.release_date ? new Date(movie.release_date).getFullYear() : '年不明'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => onSelect(movie)}
              disabled={addingMovieId === movie.id}
              className="w-full"
            >
              {addingMovieId === movie.id ? '追加中...' : '追加'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
