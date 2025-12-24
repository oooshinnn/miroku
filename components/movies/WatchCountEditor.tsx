'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => count > 0 && updateCount(count - 1)}
        disabled={loading || count === 0}
        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-5 text-center font-medium">{count}</span>
      <button
        onClick={() => updateCount(count + 1)}
        disabled={loading}
        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
      >
        <Plus className="h-3 w-3" />
      </button>
      <span className="text-slate-500 ml-0.5">回</span>
    </div>
  )
}
