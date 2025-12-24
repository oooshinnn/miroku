'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tag, TagInsert, TagUpdate } from '@/types/tag'

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchTags = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (!error && data) {
      setTags(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTags()
  }, [])

  const addTag = async (tag: Omit<TagInsert, 'user_id'>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('ユーザーがログインしていません')
    }

    const { data, error } = (await supabase
      .from('tags')
      .insert({
        ...tag,
        user_id: user.id,
      } as any)
      .select()
      .single()) as { data: Tag | null; error: any }

    if (error) {
      throw error
    }

    await fetchTags()
    return data
  }

  const updateTag = async (id: string, updates: Omit<TagUpdate, 'user_id'>) => {
    const query = supabase.from('tags')
    // @ts-expect-error - Supabase type inference issue with update
    const result: any = await query.update(updates as any).eq('id', id).select().single()
    const { data, error } = result as { data: Tag | null; error: any }

    if (error) {
      throw error
    }

    await fetchTags()
    return data
  }

  const deleteTag = async (id: string) => {
    const { error } = await supabase.from('tags').delete().eq('id', id)

    if (error) {
      throw error
    }

    await fetchTags()
  }

  return {
    tags,
    loading,
    addTag,
    updateTag,
    deleteTag,
    refetch: fetchTags,
  }
}
