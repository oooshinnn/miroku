'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Movie } from '@/types/movie'

interface MovieCardProps {
  movie: Movie
}

export function MovieCard({ movie }: MovieCardProps) {
  const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500'
  const title = movie.custom_title || movie.tmdb_title || '不明'
  const posterPath = movie.custom_poster_url || (movie.tmdb_poster_path ? `${IMAGE_BASE_URL}${movie.tmdb_poster_path}` : null)
  const releaseDate = movie.custom_release_date || movie.tmdb_release_date

  return (
    <Link
      href={`/movies/${movie.id}`}
      className="group grid grid-rows-subgrid row-span-3 gap-0"
    >
      {/* ポスター画像（2:3比率） */}
      <div className="relative aspect-[2/3] bg-slate-200 rounded-t-lg overflow-hidden">
        {posterPath ? (
          <Image
            src={posterPath}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            unoptimized
            priority={false}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            画像なし
          </div>
        )}
      </div>

      {/* タイトル */}
      <div className="px-2 pt-2">
        <h3 className="font-medium text-slate-900 line-clamp-2 text-sm leading-tight group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
      </div>

      {/* メタ情報 */}
      <div className="px-2 pb-2 pt-1">
        <p className="text-xs text-slate-500">
          {releaseDate ? new Date(releaseDate).getFullYear() : '年不明'}
          {movie.watch_count > 0 && ` • ${movie.watch_count}回`}
        </p>
      </div>
    </Link>
  )
}
