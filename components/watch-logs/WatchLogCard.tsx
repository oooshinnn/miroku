'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  WATCH_METHOD_LABELS,
  WATCH_SCORE_LABELS,
  WATCH_SCORE_COLORS,
  type WatchLogWithMovie,
} from '@/types/watch-log'

interface WatchLogCardProps {
  watchLog: WatchLogWithMovie
  onDelete?: (id: string) => void
  showMovie?: boolean
}

export function WatchLogCard({ watchLog, onDelete, showMovie = true }: WatchLogCardProps) {
  const movieTitle = watchLog.movie?.custom_title || watchLog.movie?.tmdb_title || '不明'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {showMovie && watchLog.movie && (
              <Link
                href={`/movies/${watchLog.movie.id}`}
                className="hover:underline"
              >
                <CardTitle className="text-lg">{movieTitle}</CardTitle>
              </Link>
            )}
            <CardDescription>
              {new Date(watchLog.watched_at).toLocaleDateString('ja-JP')} ·{' '}
              {WATCH_METHOD_LABELS[watchLog.watch_method]}
            </CardDescription>
          </div>
          {watchLog.score && (
            <Badge className={WATCH_SCORE_COLORS[watchLog.score]}>
              {WATCH_SCORE_LABELS[watchLog.score]}
            </Badge>
          )}
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
