'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { StarRating } from '@/components/ui/star-rating'
import { WATCH_METHOD_LABELS } from '@/types/watch-log'
import type { WatchScore, WatchMethod } from '@/types/watch-log'

interface WatchLogFormProps {
  defaultValues?: Partial<WatchLogFormData>
  onSubmit: (data: WatchLogFormData) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export function WatchLogForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = '登録',
}: WatchLogFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WatchLogFormData>({
    resolver: zodResolver(watchLogSchema),
    defaultValues,
  })

  const watchMethod = watch('watch_method')
  const score = watch('score')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('movie_id')} />

      <div className="space-y-2">
        <Label htmlFor="watched_at">視聴日 *</Label>
        <Input
          id="watched_at"
          type="date"
          {...register('watched_at')}
          disabled={isSubmitting}
        />
        {errors.watched_at && (
          <p className="text-sm text-red-600">{errors.watched_at.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="watch_method">視聴方法 *</Label>
        <Select
          value={watchMethod}
          onValueChange={(value) => setValue('watch_method', value as WatchMethod)}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="視聴方法を選択" />
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
          <p className="text-sm text-red-600">{errors.watch_method.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>評価（任意）</Label>
        <StarRating
          value={score as WatchScore | undefined}
          onChange={(value) => setValue('score', value)}
          size="lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="memo">感想メモ</Label>
        <Textarea
          id="memo"
          {...register('memo')}
          placeholder="映画の感想をメモ（任意）"
          rows={4}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? '処理中...' : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
        )}
      </div>
    </form>
  )
}
