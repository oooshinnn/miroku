'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TMDBMovie } from '@/lib/tmdb/types'

interface MovieSearchResultsProps {
  results: TMDBMovie[]
  onSelect: (movie: TMDBMovie) => void
  addingMovieId: number | null
  tmdbIdToMovieIdMap: Map<number, string>
}

export function MovieSearchResults({ results, onSelect, addingMovieId, tmdbIdToMovieIdMap }: MovieSearchResultsProps) {
  const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500'

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-slate-600">
        検索結果がありません
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {results.map((movie) => {
        const existingMovieId = tmdbIdToMovieIdMap.get(movie.id)
        const isAdded = !!existingMovieId

        return (
          <div key={movie.id} className="space-y-2">
            <div className="relative aspect-[2/3] bg-slate-200 rounded-lg overflow-hidden">
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
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  画像なし
                </div>
              )}
            </div>
            <div className="px-1">
              <h3 className="font-medium text-slate-900 line-clamp-2 text-sm leading-tight">
                {movie.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {movie.release_date ? new Date(movie.release_date).getFullYear() : '年不明'}
              </p>
            </div>
            {isAdded ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                asChild
              >
                <Link href={`/movies/${existingMovieId}`}>
                  <Check className="h-4 w-4 mr-1" />
                  登録済み
                </Link>
              </Button>
            ) : (
              <Button
                onClick={() => onSelect(movie)}
                disabled={addingMovieId === movie.id}
                size="sm"
                className="w-full"
              >
                {addingMovieId === movie.id ? '追加中...' : '追加'}
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
