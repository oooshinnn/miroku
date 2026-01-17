'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Movie, MovieWithExtras } from '@/types/movie'
import type { WatchScore } from '@/types/watch-log'

export type SortBy = 'watched_at' | 'release_date' | 'created_at'

export interface MovieFilters {
  title: string
  tagIds: string[]
  personId: string | null
  yearFrom: number | null
  yearTo: number | null
  sortBy: SortBy
}

const defaultFilters: MovieFilters = {
  title: '',
  tagIds: [],
  personId: null,
  yearFrom: null,
  yearTo: null,
  sortBy: 'watched_at',
}

// SWR キャッシュキー
const MOVIES_WITH_EXTRAS_KEY = 'movies-with-extras'

// 全映画（タグ・評価・視聴日含む）を取得
const fetchAllMoviesWithExtras = async (): Promise<MovieWithExtras[]> => {
  const supabase = createClient()

  // 全映画を取得
  const { data: allMovies, error } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false }) as { data: Movie[] | null; error: PostgrestError | null }

  if (error || !allMovies) {
    throw error || new Error('Failed to fetch movies')
  }

  const movieIds = allMovies.map(m => m.id)
  if (movieIds.length === 0) {
    return []
  }

  // タグを取得
  const { data: movieTagsData } = await supabase
    .from('movie_tags')
    .select(`
      movie_id,
      tag:tags(id, name, color)
    `)
    .in('movie_id', movieIds)

  // 映画ごとのタグをマップ化
  interface MovieTagRow {
    movie_id: string
    tag: { id: string; name: string; color: string | null } | null
  }
  const movieTagsMap = new Map<string, { id: string; name: string; color: string | null }[]>()
  if (movieTagsData) {
    for (const mt of movieTagsData as MovieTagRow[]) {
      if (mt.tag) {
        const tags = movieTagsMap.get(mt.movie_id) || []
        tags.push(mt.tag)
        movieTagsMap.set(mt.movie_id, tags)
      }
    }
  }

  // 視聴ログを取得（評価と視聴日）
  const { data: watchLogsData } = await supabase
    .from('watch_logs')
    .select('movie_id, score, watched_at')
    .in('movie_id', movieIds)
    .order('watched_at', { ascending: false })

  // 映画ごとの最高評価と最新視聴日をマップ化
  interface WatchLogRow {
    movie_id: string
    score: WatchScore | null
    watched_at: string
  }
  const bestScoreMap = new Map<string, WatchScore>()
  const latestWatchedMap = new Map<string, string>()
  if (watchLogsData) {
    for (const log of watchLogsData as WatchLogRow[]) {
      // 最新視聴日（最初に見つかったものが最新）
      if (!latestWatchedMap.has(log.movie_id)) {
        latestWatchedMap.set(log.movie_id, log.watched_at)
      }
      // 最高評価（数値の大きい方が良い評価）
      if (log.score) {
        const currentBest = bestScoreMap.get(log.movie_id)
        if (!currentBest || log.score > currentBest) {
          bestScoreMap.set(log.movie_id, log.score)
        }
      }
    }
  }

  // 人物情報を取得
  const { data: moviePersonsData } = await supabase
    .from('movie_persons')
    .select('movie_id, person_id')
    .in('movie_id', movieIds)

  // 映画ごとの人物IDをマップ化
  interface MoviePersonRow {
    movie_id: string
    person_id: string
  }
  const moviePersonsMap = new Map<string, Set<string>>()
  if (moviePersonsData) {
    for (const mp of moviePersonsData as MoviePersonRow[]) {
      const personIds = moviePersonsMap.get(mp.movie_id) || new Set()
      personIds.add(mp.person_id)
      moviePersonsMap.set(mp.movie_id, personIds)
    }
  }

  // 映画にタグ・評価・視聴日・人物を付与
  return allMovies.map(movie => ({
    ...movie,
    tags: movieTagsMap.get(movie.id) || [],
    bestScore: bestScoreMap.get(movie.id) || null,
    latestWatchedAt: latestWatchedMap.get(movie.id) || null,
    personIds: moviePersonsMap.get(movie.id) || new Set<string>(),
  })) as MovieWithExtras[]
}

export function useMovieFilter() {
  const [filters, setFilters] = useState<MovieFilters>(defaultFilters)

  // SWR で全映画を取得（キャッシュあり）
  const { data: allMovies = [], isLoading: loading, mutate } = useSWR<MovieWithExtras[]>(
    MOVIES_WITH_EXTRAS_KEY,
    fetchAllMoviesWithExtras,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  )

  // クライアント側でフィルタリング・ソート
  const movies = useMemo(() => {
    let result: MovieWithExtras[] = [...allMovies]

    // Title filter
    if (filters.title.trim()) {
      const searchTerm = filters.title.trim().toLowerCase()
      result = result.filter(m => {
        const title = (m.custom_title || m.tmdb_title || '').toLowerCase()
        return title.includes(searchTerm)
      })
    }

    // Year filter
    if (filters.yearFrom !== null) {
      result = result.filter(m => {
        const date = m.custom_release_date || m.tmdb_release_date
        if (!date) return false
        const year = new Date(date).getFullYear()
        return year >= filters.yearFrom!
      })
    }
    if (filters.yearTo !== null) {
      result = result.filter(m => {
        const date = m.custom_release_date || m.tmdb_release_date
        if (!date) return false
        const year = new Date(date).getFullYear()
        return year <= filters.yearTo!
      })
    }

    // Tag filter
    if (filters.tagIds.length > 0) {
      result = result.filter(m => {
        const movieTagIds = (m.tags || []).map((t: { id: string }) => t.id)
        return filters.tagIds.some(tagId => movieTagIds.includes(tagId))
      })
    }

    // Person filter
    if (filters.personId) {
      const personId = filters.personId
      result = result.filter(m => {
        return m.personIds?.has(personId)
      })
    }

    // Sort
    if (filters.sortBy === 'watched_at') {
      result.sort((a, b) => {
        const aDate = a.latestWatchedAt
        const bDate = b.latestWatchedAt
        if (!aDate && !bDate) return 0
        if (!aDate) return 1
        if (!bDate) return -1
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
    } else if (filters.sortBy === 'release_date') {
      result.sort((a, b) => {
        const aDate = a.custom_release_date || a.tmdb_release_date
        const bDate = b.custom_release_date || b.tmdb_release_date
        if (!aDate && !bDate) return 0
        if (!aDate) return 1
        if (!bDate) return -1
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
    }
    // 'created_at' は既にソート済み

    return result
  }, [allMovies, filters])

  const updateFilters = (newFilters: Partial<MovieFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
  }

  const hasActiveFilters = useMemo(() => {
    return (
      filters.title.trim() !== '' ||
      filters.tagIds.length > 0 ||
      filters.personId !== null ||
      filters.yearFrom !== null ||
      filters.yearTo !== null
    )
  }, [filters])

  return {
    movies,
    loading,
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    refetch: () => mutate(),
  }
}
