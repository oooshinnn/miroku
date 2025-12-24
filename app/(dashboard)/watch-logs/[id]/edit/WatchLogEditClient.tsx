'use client'

import { useRouter } from 'next/navigation'
import { WatchLogForm } from '@/components/watch-logs/WatchLogForm'
import { useWatchLogs } from '@/hooks/useWatchLogs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { WatchLogFormData } from '@/lib/validations/watch-log'
import type { WatchLog } from '@/types/watch-log'

interface WatchLogEditClientProps {
  watchLog: WatchLog
}

export function WatchLogEditClient({ watchLog }: WatchLogEditClientProps) {
  const router = useRouter()
  const { updateWatchLog } = useWatchLogs()

  const handleSubmit = async (data: WatchLogFormData) => {
    try {
      await updateWatchLog(watchLog.id, data)
      router.push('/watch-logs')
    } catch (error) {
      console.error('視聴ログの更新に失敗しました:', error)
      alert('視聴ログの更新に失敗しました')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">視聴ログを編集</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>視聴情報</CardTitle>
        </CardHeader>
        <CardContent>
          <WatchLogForm
            defaultValues={{
              movie_id: watchLog.movie_id,
              watched_at: watchLog.watched_at,
              watch_method: watchLog.watch_method,
              score: watchLog.score || undefined,
              memo: watchLog.memo || undefined,
            }}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="更新"
          />
        </CardContent>
      </Card>
    </div>
  )
}
