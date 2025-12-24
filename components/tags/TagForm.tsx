'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tagSchema, type TagFormData } from '@/lib/validations/tag'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TagFormProps {
  defaultValues?: Partial<TagFormData>
  onSubmit: (data: TagFormData) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#64748b', // slate
]

export function TagForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = '作成',
}: TagFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: defaultValues || { color: DEFAULT_COLORS[0] },
  })

  const selectedColor = watch('color')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">タグ名 *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="例: アクション"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>色</Label>
        <div className="flex gap-2 flex-wrap">
          {DEFAULT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-8 h-8 rounded-full border-2 ${
                selectedColor === color
                  ? 'border-slate-900 scale-110'
                  : 'border-slate-300'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setValue('color', color)}
              disabled={isSubmitting}
            />
          ))}
        </div>
        <Input
          type="text"
          {...register('color')}
          placeholder="#000000"
          disabled={isSubmitting}
          className="mt-2"
        />
        {errors.color && (
          <p className="text-sm text-red-600">{errors.color.message}</p>
        )}
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
