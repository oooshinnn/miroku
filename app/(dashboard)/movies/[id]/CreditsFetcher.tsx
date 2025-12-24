'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useMovies } from '@/hooks/useMovies'

interface CreditsFetcherProps {
  movieId: string
  tmdbMovieId: number
}

export function CreditsFetcher({ movieId, tmdbMovieId }: CreditsFetcherProps) {
  const router = useRouter()
  const { fetchAndSaveCredits } = useMovies()
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')

  useEffect(() => {
    const fetch = async () => {
      try {
        await fetchAndSaveCredits(movieId, tmdbMovieId)
        setStatus('done')
        // クレジット取得完了後にページを更新
        router.refresh()
      } catch {
        setStatus('error')
      }
    }
    fetch()
  }, [movieId, tmdbMovieId, fetchAndSaveCredits, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>スタッフ・キャスト情報を取得中...</span>
      </div>
    )
  }

  return null
}
