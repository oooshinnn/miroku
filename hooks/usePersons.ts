'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Person } from '@/types/movie'

export interface PersonWithStats extends Person {
  movie_count: number
  roles: ('director' | 'writer' | 'cast')[]
}

interface PersonsData {
  persons: Person[]
  moviePersons: { person_id: string; movie_id: string; role: string }[]
}

const PERSONS_CACHE_KEY = 'persons-with-stats'

const fetchPersonsData = async (): Promise<PersonsData> => {
  const supabase = createClient()

  // 基本的な人物リストを取得
  const { data: personsData, error } = (await supabase
    .from('persons')
    .select('*')
    .is('merged_into_id', null)
    .order('display_name', { ascending: true })) as { data: Person[] | null; error: PostgrestError | null }

  if (error) throw error

  // 統計情報用のmovie_personsを取得
  const { data: moviePersons } = (await supabase
    .from('movie_persons')
    .select('person_id, movie_id, role')) as { data: { person_id: string; movie_id: string; role: string }[] | null }

  return {
    persons: personsData || [],
    moviePersons: moviePersons || [],
  }
}

export function usePersons() {
  const supabase = createClient()

  const { data, isLoading: loading, mutate } = useSWR<PersonsData>(
    PERSONS_CACHE_KEY,
    fetchPersonsData,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  )

  const persons = data?.persons || []

  // 統計情報をクライアント側で計算
  const personsWithStats = useMemo(() => {
    if (!data) return []

    const { persons, moviePersons } = data

    const statsMap = new Map<
      string,
      { movies: Set<string>; roles: Set<string> }
    >()

    moviePersons.forEach((mp) => {
      if (!statsMap.has(mp.person_id)) {
        statsMap.set(mp.person_id, {
          movies: new Set(),
          roles: new Set(),
        })
      }
      statsMap.get(mp.person_id)!.movies.add(mp.movie_id)
      statsMap.get(mp.person_id)!.roles.add(mp.role)
    })

    return persons.map((person) => {
      const stats = statsMap.get(person.id)
      return {
        ...person,
        movie_count: stats?.movies.size || 0,
        roles: stats ? (Array.from(stats.roles) as ('director' | 'writer' | 'cast')[]) : [],
      }
    })
  }, [data])

  const updatePerson = async (id: string, displayName: string) => {
    const query = supabase.from('persons')
    // @ts-expect-error - Supabase type inference issue with update
    const result = await query.update({ display_name: displayName }).eq('id', id)
    const { error } = result as { error: PostgrestError | null }

    if (error) {
      throw error
    }

    await mutate()
  }

  const mergePersons = async (sourceId: string, targetId: string) => {
    // ソースとターゲットのmovie_personsを取得
    const { data: sourceLinks } = await supabase
      .from('movie_persons')
      .select('id, movie_id, role')
      .eq('person_id', sourceId) as { data: { id: string; movie_id: string; role: string }[] | null }

    const { data: targetLinks } = await supabase
      .from('movie_persons')
      .select('id, movie_id, role')
      .eq('person_id', targetId) as { data: { id: string; movie_id: string; role: string }[] | null }

    if (sourceLinks && targetLinks) {
      // ターゲットに既に存在する (movie_id, role) の組み合わせを特定
      const targetSet = new Set(
        targetLinks.map((t) => `${t.movie_id}_${t.role}`)
      )

      // 重複するソース側のレコードを削除
      const duplicateIds = sourceLinks
        .filter((s) => targetSet.has(`${s.movie_id}_${s.role}`))
        .map((s) => s.id)

      if (duplicateIds.length > 0) {
        await supabase
          .from('movie_persons')
          .delete()
          .in('id', duplicateIds)
      }
    }

    // 残りのmovie_personsのperson_idを更新
    const mpQuery = supabase.from('movie_persons')
    // @ts-expect-error - Supabase type inference issue with update
    const mpResult = await mpQuery.update({ person_id: targetId }).eq('person_id', sourceId)
    const { error: updateError } = mpResult as { error: PostgrestError | null }

    if (updateError) {
      throw updateError
    }

    // ソースのpersonをマージ済みとしてマーク
    const pQuery = supabase.from('persons')
    // @ts-expect-error - Supabase type inference issue with update
    const pResult = await pQuery.update({ merged_into_id: targetId }).eq('id', sourceId)
    const { error: mergeError } = pResult as { error: PostgrestError | null }

    if (mergeError) {
      throw mergeError
    }

    await mutate()
  }

  const unmergePersons = async (personId: string) => {
    // マージ状態を解除
    const query = supabase.from('persons')
    // @ts-expect-error - Supabase type inference issue with update
    const result = await query.update({ merged_into_id: null }).eq('id', personId)
    const { error } = result as { error: PostgrestError | null }

    if (error) {
      throw error
    }

    await mutate()
  }

  const getMergedPersons = async (targetId: string): Promise<Person[]> => {
    const { data, error } = (await supabase
      .from('persons')
      .select('*')
      .eq('merged_into_id', targetId)) as { data: Person[] | null; error: PostgrestError | null }

    if (error) {
      console.error('Failed to get merged persons:', error)
      return []
    }

    return data || []
  }

  const deleteUnusedPersons = async (): Promise<number> => {
    // 作品が0の人物（movie_personsに存在しない）を削除
    const unusedPersons = personsWithStats.filter((p) => p.movie_count === 0)

    if (unusedPersons.length === 0) {
      return 0
    }

    const unusedIds = unusedPersons.map((p) => p.id)

    const { error } = await supabase
      .from('persons')
      .delete()
      .in('id', unusedIds)

    if (error) {
      throw error
    }

    await mutate()
    return unusedIds.length
  }

  return {
    persons,
    personsWithStats,
    loading,
    updatePerson,
    mergePersons,
    unmergePersons,
    getMergedPersons,
    deleteUnusedPersons,
    refetch: () => mutate(),
  }
}
