'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WatchLogList } from '@/components/watch-logs/WatchLogList'
import { useWatchLogs } from '@/hooks/useWatchLogs'

interface MovieDetailClientProps {
  movieId: string
}

export function MovieDetailClient({ movieId }: MovieDetailClientProps) {
  const { watchLogs, loading, deleteWatchLog } = useWatchLogs(movieId)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>視聴ログ</CardTitle>
          <CardDescription>この映画の視聴記録</CardDescription>
        </div>
        <Link href={`/watch-logs/new?movie_id=${movieId}`}>
          <Button size="sm">視聴ログを追加</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-slate-600 text-center py-4">読み込み中...</p>
        ) : (
          <WatchLogList
            watchLogs={watchLogs}
            onDelete={deleteWatchLog}
            showMovie={false}
          />
        )}
      </CardContent>
    </Card>
  )
}
