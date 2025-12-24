'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { WatchLogForm } from '@/components/watch-logs/WatchLogForm'
import { useWatchLogs } from '@/hooks/useWatchLogs'
import { useMovies } from '@/hooks/useMovies'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { WatchLogFormData } from '@/lib/validations/watch-log'

export default function NewWatchLogPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const movieIdParam = searchParams.get('movie_id')

  const { addWatchLog } = useWatchLogs()
  const { movies, loading: moviesLoading } = useMovies()
  const [selectedMovieId, setSelectedMovieId] = useState<string>(movieIdParam || '')

  useEffect(() => {
    if (movieIdParam) {
      setSelectedMovieId(movieIdParam)
    }
  }, [movieIdParam])

  const handleSubmit = async (data: WatchLogFormData) => {
    try {
      await addWatchLog({
        ...data,
        movie_id: selectedMovieId,
      })
      router.push('/watch-logs')
    } catch (error) {
      console.error('視聴ログの追加に失敗しました:', error)
      alert('視聴ログの追加に失敗しました')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (moviesLoading) {
    return <div className="text-center py-8">読み込み中...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">視聴ログを追加</h1>
        <p className="text-slate-600 mt-2">映画の視聴記録を追加します</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>映画を選択</CardTitle>
          <CardDescription>視聴ログを追加する映画を選択してください</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="movie">映画 *</Label>
            <Select value={selectedMovieId} onValueChange={setSelectedMovieId}>
              <SelectTrigger>
                <SelectValue placeholder="映画を選択" />
              </SelectTrigger>
              <SelectContent>
                {movies.map((movie) => (
                  <SelectItem key={movie.id} value={movie.id}>
                    {movie.custom_title || movie.tmdb_title || '不明'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedMovieId && (
        <Card>
          <CardHeader>
            <CardTitle>視聴情報</CardTitle>
          </CardHeader>
          <CardContent>
            <WatchLogForm
              defaultValues={{
                movie_id: selectedMovieId,
                watched_at: new Date().toISOString().split('T')[0],
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              submitLabel="追加"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
