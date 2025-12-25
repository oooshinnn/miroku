'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MovieOverviewProps {
  tmdbMovieId: number | null
}

export function MovieOverview({ tmdbMovieId }: MovieOverviewProps) {
  const [overview, setOverview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState(false)

  const handleToggle = async () => {
    if (isOpen) {
      setIsOpen(false)
      return
    }

    // 既に取得済みの場合は開くだけ
    if (overview) {
      setIsOpen(true)
      return
    }

    // API から取得
    setLoading(true)
    setError(false)
    try {
      const response = await fetch(`/api/tmdb/movie/${tmdbMovieId}`)
      if (!response.ok) {
        setError(true)
        return
      }

      const { details } = await response.json()
      if (details?.overview) {
        setOverview(details.overview)
        setIsOpen(true)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // TMDB ID がない場合は表示しない
  if (!tmdbMovieId) return null

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={loading}
        className="text-slate-600 hover:text-slate-900 px-0"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            読み込み中...
          </>
        ) : isOpen ? (
          <>
            <ChevronUp className="h-4 w-4 mr-1" />
            あらすじを閉じる
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-1" />
            あらすじを表示
          </>
        )}
      </Button>

      {error && !overview && (
        <p className="text-sm text-slate-500">あらすじを取得できませんでした</p>
      )}

      {isOpen && overview && (
        <p className="text-slate-600 text-sm leading-relaxed">{overview}</p>
      )}
    </div>
  )
}
