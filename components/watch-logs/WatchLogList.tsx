'use client'

import { WatchLogCard } from './WatchLogCard'
import type { WatchLogWithMovie } from '@/types/watch-log'

interface WatchLogListProps {
  watchLogs: WatchLogWithMovie[]
  onDelete?: (id: string) => void
  showMovie?: boolean
}

export function WatchLogList({ watchLogs, onDelete, showMovie = true }: WatchLogListProps) {
  if (watchLogs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-600">視聴ログがありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {watchLogs.map((watchLog) => (
        <WatchLogCard
          key={watchLog.id}
          watchLog={watchLog}
          onDelete={onDelete}
          showMovie={showMovie}
        />
      ))}
    </div>
  )
}
