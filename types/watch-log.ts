import type { Database } from './database'

export type WatchLog = Database['public']['Tables']['watch_logs']['Row']
export type WatchLogInsert = Database['public']['Tables']['watch_logs']['Insert']
export type WatchLogUpdate = Database['public']['Tables']['watch_logs']['Update']

export type WatchMethod = 'theater' | 'tv' | 'streaming' | 'bluray_dvd' | 'other'
export type WatchScore = 1 | 2 | 3 | 4 | 5

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

export const WATCH_SCORES: WatchScore[] = [1, 2, 3, 4, 5]

export const WATCH_SCORE_LABELS: Record<WatchScore, string> = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
}
