import type { Database } from './database'
import type { WatchScore } from './watch-log'

export type Movie = Database['public']['Tables']['movies']['Row']
export type MovieInsert = Database['public']['Tables']['movies']['Insert']
export type MovieUpdate = Database['public']['Tables']['movies']['Update']

export type Person = Database['public']['Tables']['persons']['Row']
export type PersonInsert = Database['public']['Tables']['persons']['Insert']

export type MoviePerson = Database['public']['Tables']['movie_persons']['Row']
export type MoviePersonInsert = Database['public']['Tables']['movie_persons']['Insert']

export interface MovieWithDetails extends Movie {
  persons?: {
    person: Person
    role: 'director' | 'writer' | 'cast'
    cast_order: number | null
  }[]
}

export interface MovieWithExtras extends Movie {
  tags: { id: string; name: string; color: string | null }[]
  bestScore: WatchScore | null
  latestWatchedAt: string | null
  personIds: Set<string>
}
