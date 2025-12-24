'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InlineWatchLogForm } from '@/components/watch-logs/InlineWatchLogForm'
import { InlineWatchLogItem } from '@/components/watch-logs/InlineWatchLogItem'
import { WatchCountEditor } from '@/components/movies/WatchCountEditor'
import { useWatchLogs } from '@/hooks/useWatchLogs'
import type { WatchLogFormData } from '@/lib/validations/watch-log'

interface MovieDetailClientProps {
  movieId: string
  initialWatchCount: number
}

export function MovieDetailClient({ movieId, initialWatchCount }: MovieDetailClientProps) {
  const [isAdding, setIsAdding] = useState(false)
  const { watchLogs, loading, addWatchLog, updateWatchLog, deleteWatchLog } = useWatchLogs(movieId)

  const handleAdd = async (data: WatchLogFormData) => {
    await addWatchLog({
      movie_id: data.movie_id,
      watched_at: data.watched_at,
      watch_method: data.watch_method,
      score: data.score || null,
      memo: data.memo || null,
    })
    setIsAdding(false)
  }

  const handleUpdate = async (id: string, data: Partial<WatchLogFormData>) => {
    await updateWatchLog(id, {
      watched_at: data.watched_at,
      watch_method: data.watch_method,
      score: data.score || null,
      memo: data.memo || null,
    })
  }

  const handleDelete = async (id: string) => {
    await deleteWatchLog(id)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <CardTitle>視聴ログ</CardTitle>
            <WatchCountEditor movieId={movieId} initialCount={initialWatchCount} />
          </div>
          <CardDescription>この映画の視聴記録</CardDescription>
        </div>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            追加
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <InlineWatchLogForm
            movieId={movieId}
            onSubmit={handleAdd}
            onCancel={() => setIsAdding(false)}
          />
        )}

        {loading ? (
          <p className="text-slate-600 text-center py-4">読み込み中...</p>
        ) : watchLogs.length === 0 && !isAdding ? (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-4">視聴ログがありません</p>
            <Button variant="outline" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-1" />
              最初の視聴ログを追加
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {watchLogs.map((watchLog) => (
              <InlineWatchLogItem
                key={watchLog.id}
                watchLog={watchLog}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
