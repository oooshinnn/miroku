'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Link href={`/movies/${movie.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative h-48 bg-slate-200">
          {posterPath ? (
            <Image
              src={posterPath}
              alt={title}
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
          <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
          <CardDescription>
            {releaseDate ? new Date(releaseDate).getFullYear() : '年不明'}
            {movie.watch_count > 0 && ` • ${movie.watch_count}回視聴`}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
