'use client'

import useSWR from 'swr'
import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Tag, TagInsert, TagUpdate } from '@/types/tag'

const TAGS_CACHE_KEY = 'tags'

const fetchTags = async (): Promise<Tag[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export function useTags() {
  const supabase = createClient()

  const { data: tags = [], isLoading: loading, mutate } = useSWR<Tag[]>(
    TAGS_CACHE_KEY,
    fetchTags,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  )

  const addTag = async (tag: Omit<TagInsert, 'user_id'>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('ユーザーがログインしていません')
    }

    const tagData: TagInsert = {
      ...tag,
      user_id: user.id,
    }
    const { data, error } = (await supabase
      .from('tags')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
      .insert(tagData as any)
      .select()
      .single()) as { data: Tag | null; error: PostgrestError | null }

    if (error) {
      throw error
    }

    await mutate()
    return data
  }

  const updateTag = async (id: string, updates: Omit<TagUpdate, 'user_id'>) => {
    const query = supabase.from('tags')
    // @ts-expect-error - Supabase type inference issue with update
    const result = await query.update(updates as TagUpdate).eq('id', id).select().single()
    const { data, error } = result as { data: Tag | null; error: PostgrestError | null }

    if (error) {
      throw error
    }

    await mutate()
    return data
  }

  const deleteTag = async (id: string) => {
    const { error } = await supabase.from('tags').delete().eq('id', id)

    if (error) {
      throw error
    }

    await mutate()
  }

  return {
    tags,
    loading,
    addTag,
    updateTag,
    deleteTag,
    refetch: () => mutate(),
  }
}
