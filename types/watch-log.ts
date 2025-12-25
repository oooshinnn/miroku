import type { Database } from './database'

export type WatchLog = Database['public']['Tables']['watch_logs']['Row']
export type WatchLogInsert = Database['public']['Tables']['watch_logs']['Insert']
export type WatchLogUpdate = Database['public']['Tables']['watch_logs']['Update']

export type WatchMethod = 'theater' | 'tv' | 'streaming' | 'bluray_dvd' | 'other'
export type WatchScore = 'bad' | 'neutral' | 'good'

export interface WatchLogWithMovie extends WatchLog {
  movie?: {
    id: string
    tmdb_title: string | null
    custom_title: string | null
    tmdb_poster_path: string | null
  }
}

export const WATCH_METHOD_LABELS: Record<WatchMethod, string> = {
  theater: '映画館',
  tv: 'テレビ',
  streaming: '配信',
  bluray_dvd: 'Blu-ray / DVD',
  other: 'その他',
}

export const WATCH_SCORE_LABELS: Record<WatchScore, string> = {
  bad: 'Bad',
  neutral: 'Neutral',
  good: 'Good',
}

export const WATCH_SCORE_COLORS: Record<WatchScore, string> = {
  bad: 'bg-red-100 text-red-800',
  neutral: 'bg-yellow-100 text-yellow-800',
  good: 'bg-green-100 text-green-800',
}
