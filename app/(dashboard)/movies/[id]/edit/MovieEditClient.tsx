'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { movieSchema, type MovieFormData } from '@/lib/validations/movie'
import type { Movie } from '@/types/movie'

interface MovieEditClientProps {
  movie: Movie
}

export function MovieEditClient({ movie }: MovieEditClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MovieFormData>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      custom_title: movie.custom_title || movie.tmdb_title || '',
      custom_poster_url: movie.custom_poster_url || '',
      custom_release_date: movie.custom_release_date || movie.tmdb_release_date || '',
      custom_production_countries: movie.custom_production_countries || movie.tmdb_production_countries || [],
    },
  })

  const onSubmit = async (data: MovieFormData) => {
    try {
      const updateData = {
        custom_title: data.custom_title || null,
        custom_poster_url: data.custom_poster_url || null,
        custom_release_date: data.custom_release_date || null,
        custom_production_countries: data.custom_production_countries || null,
      }
      const query = supabase.from('movies')
      // @ts-expect-error - Supabase type inference issue with update
      const { error } = await query.update(updateData).eq('id', movie.id) as { error: PostgrestError | null }

      if (error) {
        throw error
      }

      router.push(`/movies/${movie.id}`)
    } catch (error) {
      console.error('映画情報の更新に失敗しました:', error)
      alert('映画情報の更新に失敗しました')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">映画情報を編集</h1>
        <p className="text-slate-600 mt-2">
          TMDB から取得した情報を上書きできます
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>TMDB 情報（参考）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-semibold">タイトル: </span>
            {movie.tmdb_title || '不明'}
          </div>
          <div>
            <span className="font-semibold">公開日: </span>
            {movie.tmdb_release_date || '不明'}
          </div>
          <div>
            <span className="font-semibold">制作国: </span>
            {movie.tmdb_production_countries?.join(', ') || '不明'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>カスタム情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom_title">タイトル</Label>
              <Input
                id="custom_title"
                {...register('custom_title')}
                placeholder="カスタムタイトル（空欄の場合はTMDB情報を使用）"
                disabled={isSubmitting}
              />
              {errors.custom_title && (
                <p className="text-sm text-red-600">{errors.custom_title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_poster_url">ポスター画像URL</Label>
              <Input
                id="custom_poster_url"
                {...register('custom_poster_url')}
                placeholder="https://example.com/poster.jpg"
                disabled={isSubmitting}
              />
              {errors.custom_poster_url && (
                <p className="text-sm text-red-600">
                  {errors.custom_poster_url.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_release_date">公開日</Label>
              <Input
                id="custom_release_date"
                type="date"
                {...register('custom_release_date')}
                disabled={isSubmitting}
              />
              {errors.custom_release_date && (
                <p className="text-sm text-red-600">
                  {errors.custom_release_date.message}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? '更新中...' : '更新'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
