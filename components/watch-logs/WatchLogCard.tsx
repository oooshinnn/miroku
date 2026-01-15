'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Film } from 'lucide-react'
import { StarRating } from '@/components/ui/star-rating'
import {
  WATCH_METHOD_LABELS,
  type WatchLogWithMovie,
} from '@/types/watch-log'
import type { WatchScore } from '@/types/watch-log'

interface WatchLogCardProps {
  watchLog: WatchLogWithMovie
  onDelete?: (id: string) => void
  showMovie?: boolean
}

export function WatchLogCard({ watchLog, onDelete, showMovie = true }: WatchLogCardProps) {
  const movieTitle = watchLog.movie?.custom_title || watchLog.movie?.tmdb_title || '不明'
  const posterPath = watchLog.movie?.tmdb_poster_path

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          {showMovie && watchLog.movie && (
            <Link href={`/movies/${watchLog.movie.id}`} className="shrink-0">
              {posterPath ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w92${posterPath}`}
                  alt={movieTitle}
                  width={46}
                  height={69}
                  className="rounded object-cover"
                />
              ) : (
                <div className="w-[46px] h-[69px] bg-slate-200 rounded flex items-center justify-center">
                  <Film className="h-5 w-5 text-slate-400" />
                </div>
              )}
            </Link>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {showMovie && watchLog.movie && (
                  <Link
                    href={`/movies/${watchLog.movie.id}`}
                    className="hover:underline"
                  >
                    <CardTitle className="text-lg truncate">{movieTitle}</CardTitle>
                  </Link>
                )}
                <CardDescription>
                  {new Date(watchLog.watched_at).toLocaleDateString('ja-JP')} ·{' '}
                  {WATCH_METHOD_LABELS[watchLog.watch_method]}
                </CardDescription>
              </div>
              {watchLog.score && (
                <StarRating value={watchLog.score as WatchScore} readonly size="sm" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      {watchLog.memo && (
        <CardContent>
          <p className="text-slate-700 whitespace-pre-wrap">{watchLog.memo}</p>
        </CardContent>
      )}
      <CardContent className="flex gap-2">
        <Link href={`/watch-logs/${watchLog.id}/edit`}>
          <Button variant="outline" size="sm">
            編集
          </Button>
        </Link>
        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('この視聴ログを削除しますか？')) {
                onDelete(watchLog.id)
              }
            }}
          >
            削除
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
