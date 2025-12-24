import { z } from 'zod'

export const tagSchema = z.object({
  name: z.string().min(1, 'タグ名を入力してください').max(50, 'タグ名は50文字以内で入力してください'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '正しい色コードを入力してください').optional(),
})

export type TagFormData = z.infer<typeof tagSchema>
