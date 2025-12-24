'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WatchLogList } from '@/components/watch-logs/WatchLogList'
import { useWatchLogs } from '@/hooks/useWatchLogs'

export default function WatchLogsPage() {
  const { watchLogs, loading, deleteWatchLog } = useWatchLogs()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">視聴ログ</h1>
        <Button asChild>
          <Link href="/watch-logs/new">視聴ログを追加</Link>
        </Button>
      </div>
      {loading ? (
        <div className="text-center py-8 text-slate-600">読み込み中...</div>
      ) : (
        <WatchLogList
          watchLogs={watchLogs}
          onDelete={deleteWatchLog}
          showMovie={true}
        />
      )}
    </div>
  )
}
