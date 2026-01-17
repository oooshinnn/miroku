'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check } from 'lucide-react'
import type { TMDBMovie } from '@/lib/tmdb/types'

interface UnifiedMovieCardProps {
  movie: TMDBMovie
  registeredMovieId?: string
}

export function UnifiedMovieCard({ movie, registeredMovieId }: UnifiedMovieCardProps) {
  const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500'
  const posterPath = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null
  const isRegistered = !!registeredMovieId

  // 登録済みなら詳細ページ、未登録ならTMDBプレビューページへ
  const href = isRegistered
    ? `/movies/${registeredMovieId}`
    : `/movies/tmdb/${movie.id}`

  return (
    <Link
      href={href}
      className="group grid grid-rows-subgrid row-span-3 gap-0"
    >
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
        <h3 className="font-medium text-slate-900 line-clamp-2 text-sm leading-tight text-balance group-hover:text-blue-600 transition-colors">
          {movie.title}
        </h3>
      </div>

      {/* メタ情報 + ステータス */}
      <div className="px-2 pb-2 pt-1 space-y-1">
        <p className="text-xs text-slate-500">
          {movie.release_date ? new Date(movie.release_date).getFullYear() : '年不明'}
        </p>
        {/* ステータスバッジ */}
        {isRegistered && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
            <Check className="h-3 w-3" />
            登録済み
          </span>
        )}
      </div>
    </Link>
  )
}
