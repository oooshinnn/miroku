'use client'

import { useState } from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineWatchLogForm } from './InlineWatchLogForm'
import { StarRating } from '@/components/ui/star-rating'
import {
  WATCH_METHOD_LABELS,
  type WatchLogWithMovie,
  type WatchMethod,
  type WatchScore,
} from '@/types/watch-log'
import type { WatchLogFormData } from '@/lib/validations/watch-log'

interface InlineWatchLogItemProps {
  watchLog: WatchLogWithMovie
  onUpdate: (id: string, data: Partial<WatchLogFormData>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function InlineWatchLogItem({ watchLog, onUpdate, onDelete }: InlineWatchLogItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleUpdate = async (data: WatchLogFormData) => {
    await onUpdate(watchLog.id, {
      watched_at: data.watched_at,
      watch_method: data.watch_method,
      score: data.score,
      memo: data.memo,
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('この視聴ログを削除しますか？')) return

    setIsDeleting(true)
    try {
      await onDelete(watchLog.id)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <InlineWatchLogForm
        movieId={watchLog.movie_id}
        defaultValues={{
          movie_id: watchLog.movie_id,
          watched_at: watchLog.watched_at,
          watch_method: watchLog.watch_method as WatchMethod,
          score: watchLog.score as WatchScore | undefined,
          memo: watchLog.memo || '',
        }}
        onSubmit={handleUpdate}
        onCancel={() => setIsEditing(false)}
        isEdit
      />
    )
  }

  return (
    <div className="flex items-start gap-4 py-3 px-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-900">
            {new Date(watchLog.watched_at).toLocaleDateString('ja-JP')}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600 text-sm">
            {WATCH_METHOD_LABELS[watchLog.watch_method]}
          </span>
          {watchLog.score && (
            <StarRating value={watchLog.score as WatchScore} readonly size="sm" />
          )}
        </div>
        {watchLog.memo && (
          <p className="text-slate-600 text-sm mt-1 line-clamp-2 text-pretty">{watchLog.memo}</p>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsEditing(true)}
          aria-label="視聴ログを編集"
        >
          <Edit2 className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label="視聴ログを削除"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
