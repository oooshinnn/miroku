'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { WatchLog, WatchLogInsert, WatchLogUpdate, WatchLogWithMovie, WatchScore } from '@/types/watch-log'

interface UseWatchLogsOptions {
  movieId?: string
  scoreFilter?: WatchScore | null
}

const createCacheKey = (options: UseWatchLogsOptions) => {
  return ['watch-logs', options.movieId || 'all', options.scoreFilter || 'all']
}

const fetchWatchLogs = async (options: UseWatchLogsOptions): Promise<WatchLogWithMovie[]> => {
  const supabase = createClient()
  const { movieId, scoreFilter } = options

  let query = supabase
    .from('watch_logs')
    .select(`
      *,
      movie:movies(
        id,
        tmdb_title,
        custom_title,
        tmdb_poster_path
      )
    `)
    .order('watched_at', { ascending: false })

  if (movieId) {
    query = query.eq('movie_id', movieId)
  }

  if (scoreFilter) {
    query = query.eq('score', scoreFilter)
  }

  const { data, error } = await query as { data: WatchLogWithMovie[] | null; error: any }

  if (error) throw error
  return data || []
}

export function useWatchLogs(options: UseWatchLogsOptions = {}) {
  const supabase = createClient()

  const { data: watchLogs = [], isLoading: loading, mutate } = useSWR<WatchLogWithMovie[]>(
    createCacheKey(options),
    () => fetchWatchLogs(options),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  )

  const addWatchLog = async (watchLog: Omit<WatchLogInsert, 'user_id'>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('ユーザーがログインしていません')
    }

    const { data, error } = await supabase
      .from('watch_logs')
      .insert({
        ...watchLog,
        user_id: user.id,
      } as any)
      .select()
      .single()

    if (error) {
      throw error
    }

    await mutate()
    return data
  }

  const updateWatchLog = async (id: string, updates: Omit<WatchLogUpdate, 'user_id'>) => {
    const query = supabase.from('watch_logs')
    // @ts-expect-error - Supabase type inference issue with update
    const result: any = await query.update(updates as any).eq('id', id).select().single()
    const { data, error } = result as { data: WatchLog | null; error: any }

    if (error) {
      throw error
    }

    await mutate()
    return data
  }

  const deleteWatchLog = async (id: string) => {
    const { error } = await supabase
      .from('watch_logs')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    await mutate()
  }

  return {
    watchLogs,
    loading,
    addWatchLog,
    updateWatchLog,
    deleteWatchLog,
    refetch: () => mutate(),
  }
}
