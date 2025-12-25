'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WatchLog, WatchLogInsert, WatchLogUpdate, WatchLogWithMovie, WatchScore } from '@/types/watch-log'

interface UseWatchLogsOptions {
  movieId?: string
  scoreFilter?: WatchScore | null
}

export function useWatchLogs(options: UseWatchLogsOptions = {}) {
  const { movieId, scoreFilter } = options
  const [watchLogs, setWatchLogs] = useState<WatchLogWithMovie[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchWatchLogs = useCallback(async () => {
    setLoading(true)

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

    if (!error && data) {
      setWatchLogs(data)
    }
    setLoading(false)
  }, [movieId, scoreFilter])

  useEffect(() => {
    fetchWatchLogs()
  }, [fetchWatchLogs])

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

    await fetchWatchLogs()
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

    await fetchWatchLogs()
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

    await fetchWatchLogs()
  }

  return {
    watchLogs,
    loading,
    addWatchLog,
    updateWatchLog,
    deleteWatchLog,
    refetch: fetchWatchLogs,
  }
}
