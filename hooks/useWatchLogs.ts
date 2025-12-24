'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WatchLog, WatchLogInsert, WatchLogUpdate, WatchLogWithMovie } from '@/types/watch-log'

export function useWatchLogs(movieId?: string) {
  const [watchLogs, setWatchLogs] = useState<WatchLogWithMovie[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchWatchLogs = async () => {
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

    const { data, error } = await query as { data: WatchLogWithMovie[] | null; error: any }

    if (!error && data) {
      setWatchLogs(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchWatchLogs()
  }, [movieId])

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
