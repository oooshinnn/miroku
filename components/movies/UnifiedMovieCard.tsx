'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check, Plus, Loader2 } from 'lucide-react'
import type { TMDBMovie } from '@/lib/tmdb/types'

interface UnifiedMovieCardProps {
  movie: TMDBMovie
  registeredMovieId?: string
  isAdding?: boolean
  onAdd?: (movie: TMDBMovie) => void
}

export function UnifiedMovieCard({ movie, registeredMovieId, isAdding, onAdd }: UnifiedMovieCardProps) {
  const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500'
  const posterPath = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null
  const isRegistered = !!registeredMovieId

  const handleClick = (e: React.MouseEvent) => {
    if (!isRegistered && onAdd && !isAdding) {
      e.preventDefault()
      onAdd(movie)
    }
  }

  const content = (
    <>
      {/* ポスター画像（2:3比率） */}
      <div className="relative aspect-[2/3] bg-slate-200 rounded-t-lg overflow-hidden">
        {posterPath ? (
          <Image
            src={posterPath}
            alt={movie.title}
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
          {movie.title}
        </h3>
      </div>

      {/* メタ情報 + ステータス */}
      <div className="px-2 pb-2 pt-1 space-y-1">
        <p className="text-xs text-slate-500">
          {movie.release_date ? new Date(movie.release_date).getFullYear() : '年不明'}
        </p>
        {/* ステータスバッジ */}
        {isAdding ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
            <Loader2 className="h-3 w-3 animate-spin" />
            追加中...
          </span>
        ) : isRegistered ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
            <Check className="h-3 w-3" />
            登録済み
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
            <Plus className="h-3 w-3" />
            クリックで追加
          </span>
        )}
      </div>
    </>
  )

  if (isRegistered) {
    return (
      <Link
        href={`/movies/${registeredMovieId}`}
        className="group grid grid-rows-subgrid row-span-3 gap-0"
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isAdding}
      className="group grid grid-rows-subgrid row-span-3 gap-0 text-left w-full cursor-pointer disabled:cursor-wait"
    >
      {content}
    </button>
  )
}
