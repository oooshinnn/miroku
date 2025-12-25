import { z } from 'zod'

export const watchLogSchema = z.object({
  movie_id: z.string().uuid(),
  watched_at: z.string().min(1, '視聴日を入力してください'),
  watch_method: z.enum(['theater', 'tv', 'streaming', 'bluray_dvd', 'other']),
  score: z.enum(['bad', 'neutral', 'good']).optional(),
  memo: z.string().optional(),
})

export type WatchLogFormData = z.infer<typeof watchLogSchema>
