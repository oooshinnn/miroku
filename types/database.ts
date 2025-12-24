export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      movies: {
        Row: {
          id: string
          user_id: string
          tmdb_movie_id: number | null
          tmdb_title: string | null
          tmdb_poster_path: string | null
          tmdb_release_date: string | null
          tmdb_production_countries: string[] | null
          custom_title: string | null
          custom_poster_url: string | null
          custom_release_date: string | null
          custom_production_countries: string[] | null
          watch_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tmdb_movie_id?: number | null
          tmdb_title?: string | null
          tmdb_poster_path?: string | null
          tmdb_release_date?: string | null
          tmdb_production_countries?: string[] | null
          custom_title?: string | null
          custom_poster_url?: string | null
          custom_release_date?: string | null
          custom_production_countries?: string[] | null
          watch_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tmdb_movie_id?: number | null
          tmdb_title?: string | null
          tmdb_poster_path?: string | null
          tmdb_release_date?: string | null
          tmdb_production_countries?: string[] | null
          custom_title?: string | null
          custom_poster_url?: string | null
          custom_release_date?: string | null
          custom_production_countries?: string[] | null
          watch_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      persons: {
        Row: {
          id: string
          user_id: string
          tmdb_person_id: number | null
          display_name: string
          merged_into_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tmdb_person_id?: number | null
          display_name: string
          merged_into_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tmdb_person_id?: number | null
          display_name?: string
          merged_into_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      movie_persons: {
        Row: {
          id: string
          movie_id: string
          person_id: string
          role: 'director' | 'writer' | 'cast'
          cast_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          movie_id: string
          person_id: string
          role: 'director' | 'writer' | 'cast'
          cast_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          movie_id?: string
          person_id?: string
          role?: 'director' | 'writer' | 'cast'
          cast_order?: number | null
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      movie_tags: {
        Row: {
          id: string
          movie_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          movie_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          movie_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      watch_logs: {
        Row: {
          id: string
          user_id: string
          movie_id: string
          watched_at: string
          watch_method: 'theater' | 'tv' | 'streaming' | 'bluray_dvd' | 'other'
          score: 'bad' | 'neutral' | 'good' | null
          memo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          movie_id: string
          watched_at: string
          watch_method: 'theater' | 'tv' | 'streaming' | 'bluray_dvd' | 'other'
          score?: 'bad' | 'neutral' | 'good' | null
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          movie_id?: string
          watched_at?: string
          watch_method?: 'theater' | 'tv' | 'streaming' | 'bluray_dvd' | 'other'
          score?: 'bad' | 'neutral' | 'good' | null
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
