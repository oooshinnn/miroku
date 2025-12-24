'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface WatchCountEditorProps {
  movieId: string
  initialCount: number
}

export function WatchCountEditor({ movieId, initialCount }: WatchCountEditorProps) {
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const updateCount = async (newCount: number) => {
    if (newCount < 0) return

    setLoading(true)
    try {
      const query = supabase.from('movies')
      // @ts-expect-error - Supabase type inference issue with update
      const result: any = await query.update({ watch_count: newCount }).eq('id', movieId)
      const { error } = result as { error: any }

      if (error) {
        throw error
      }

      setCount(newCount)
    } catch (error) {
      console.error('視聴回数の更新に失敗しました:', error)
      alert('視聴回数の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDecrement = () => {
    if (count > 0) {
      updateCount(count - 1)
    }
  }

  const handleIncrement = () => {
    updateCount(count + 1)
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600">視聴回数:</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleDecrement}
          disabled={loading || count === 0}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center font-medium text-lg">{count}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleIncrement}
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <span className="text-sm text-slate-500">回</span>
    </div>
  )
}
