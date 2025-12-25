'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { watchLogSchema, type WatchLogFormData } from '@/lib/validations/watch-log'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WATCH_METHOD_LABELS, WATCH_SCORE_LABELS } from '@/types/watch-log'

interface InlineWatchLogFormProps {
  movieId: string
  defaultValues?: Partial<WatchLogFormData>
  onSubmit: (data: WatchLogFormData) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

export function InlineWatchLogForm({
  movieId,
  defaultValues,
  onSubmit,
  onCancel,
  isEdit = false,
}: InlineWatchLogFormProps) {
  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WatchLogFormData>({
    resolver: zodResolver(watchLogSchema),
    defaultValues: {
      movie_id: movieId,
      watched_at: today,
      watch_method: 'streaming',
      ...defaultValues,
    },
  })

  const watchMethod = watch('watch_method')
  const score = watch('score')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-slate-900">
          {isEdit ? '視聴ログを編集' : '視聴ログを追加'}
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-slate-200 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <input type="hidden" {...register('movie_id')} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="watched_at" className="text-sm">視聴日</Label>
          <Input
            id="watched_at"
            type="date"
            {...register('watched_at')}
            disabled={isSubmitting}
            className="h-9"
          />
          {errors.watched_at && (
            <p className="text-xs text-red-600">{errors.watched_at.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="watch_method" className="text-sm">視聴方法</Label>
          <Select
            value={watchMethod}
            onValueChange={(value) => setValue('watch_method', value as any)}
            disabled={isSubmitting}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="選択" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(WATCH_METHOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.watch_method && (
            <p className="text-xs text-red-600">{errors.watch_method.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-sm">スコア</Label>
        <div className="flex gap-2">
          {Object.entries(WATCH_SCORE_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue('score', score === value ? undefined : value as any)}
              disabled={isSubmitting}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                score === value
                  ? value === 'pickup'
                    ? 'bg-purple-500 text-white'
                    : value === 'good'
                    ? 'bg-green-500 text-white'
                    : value === 'neutral'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="memo" className="text-sm">感想メモ</Label>
        <Textarea
          id="memo"
          {...register('memo')}
          placeholder="感想をメモ（任意）"
          rows={2}
          disabled={isSubmitting}
          className="resize-none"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} size="sm">
          {isSubmitting ? '保存中...' : isEdit ? '更新' : '追加'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
      </div>
    </form>
  )
}
