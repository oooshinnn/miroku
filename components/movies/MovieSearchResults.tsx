'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check } from 'lucide-react'
import type { TMDBMovie } from '@/lib/tmdb/types'

interface MovieSearchResultsProps {
  results: TMDBMovie[]
  tmdbIdToMovieIdMap: Map<number, string>
}

export function MovieSearchResults({ results, tmdbIdToMovieIdMap }: MovieSearchResultsProps) {
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

        // 追加済みなら既存の詳細ページへ、未追加ならTMDBプレビューページへ
        const href = isAdded
          ? `/movies/${existingMovieId}`
          : `/movies/tmdb/${movie.id}`

        return (
          <Link
            key={movie.id}
            href={href}
            className="block space-y-2 group"
          >
            <div className="relative aspect-[2/3] bg-slate-200 rounded-lg overflow-hidden group-hover:ring-2 group-hover:ring-slate-400 transition-all">
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
              {isAdded && (
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
            <div className="px-1">
              <h3 className="font-medium text-slate-900 line-clamp-2 text-sm leading-tight group-hover:text-slate-700">
                {movie.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {movie.release_date ? new Date(movie.release_date).getFullYear() : '年不明'}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
