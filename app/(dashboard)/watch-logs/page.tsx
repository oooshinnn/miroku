'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WatchLogList } from '@/components/watch-logs/WatchLogList'
import { useWatchLogs } from '@/hooks/useWatchLogs'
import { WATCH_SCORE_LABELS, type WatchScore } from '@/types/watch-log'
import { cn } from '@/lib/utils'

const SCORE_FILTER_OPTIONS: { value: WatchScore | null; label: string }[] = [
  { value: null, label: 'すべて' },
  { value: 'good', label: WATCH_SCORE_LABELS.good },
  { value: 'neutral', label: WATCH_SCORE_LABELS.neutral },
  { value: 'bad', label: WATCH_SCORE_LABELS.bad },
]

export default function WatchLogsPage() {
  const [scoreFilter, setScoreFilter] = useState<WatchScore | null>(null)
  const { watchLogs, loading, deleteWatchLog } = useWatchLogs({ scoreFilter })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">視聴ログ</h1>
        <Button asChild>
          <Link href="/watch-logs/new">視聴ログを追加</Link>
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {SCORE_FILTER_OPTIONS.map((option) => (
          <Button
            key={option.value ?? 'all'}
            variant="outline"
            size="sm"
            onClick={() => setScoreFilter(option.value)}
            className={cn(
              scoreFilter === option.value && 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white'
            )}
          >
            {option.label}
          </Button>
        ))}
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
