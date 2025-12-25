'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Person } from '@/types/movie'

export interface PersonWithStats extends Person {
  movie_count: number
  roles: ('director' | 'writer' | 'cast')[]
}

export function usePersons() {
  const [persons, setPersons] = useState<Person[]>([])
  const [personsWithStats, setPersonsWithStats] = useState<PersonWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchPersons = async () => {
    setLoading(true)

    try {
      // 基本的な人物リストを取得
      const { data: personsData, error } = (await supabase
        .from('persons')
        .select('*')
        .is('merged_into_id', null)
        .order('display_name', { ascending: true })) as { data: Person[] | null; error: any }

      if (error) {
        console.error('Failed to fetch persons:', error)
        setPersons([])
        setPersonsWithStats([])
        setLoading(false)
        return
      }

      setPersons(personsData || [])

      // 統計情報付きで取得
      const { data: moviePersons } = (await supabase
        .from('movie_persons')
        .select('person_id, movie_id, role')) as { data: { person_id: string; movie_id: string; role: string }[] | null }

      if (moviePersons && personsData) {
        const statsMap = new Map<
          string,
          { movies: Set<string>; roles: Set<string> }
        >()

        moviePersons.forEach((mp: any) => {
          if (!statsMap.has(mp.person_id)) {
            statsMap.set(mp.person_id, {
              movies: new Set(),
              roles: new Set(),
            })
          }
          statsMap.get(mp.person_id)!.movies.add(mp.movie_id)
          statsMap.get(mp.person_id)!.roles.add(mp.role)
        })

        const withStats: PersonWithStats[] = personsData.map((person) => {
          const stats = statsMap.get(person.id)
          return {
            ...person,
            movie_count: stats?.movies.size || 0,
            roles: stats ? (Array.from(stats.roles) as any) : [],
          }
        })

        setPersonsWithStats(withStats)
      }
    } catch (error) {
      console.error('Failed to fetch persons:', error)
      setPersons([])
      setPersonsWithStats([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPersons()
  }, [])

  const updatePerson = async (id: string, displayName: string) => {
    const query = supabase.from('persons')
    // @ts-expect-error - Supabase type inference issue with update
    const result: any = await query.update({ display_name: displayName }).eq('id', id)
    const { error } = result as { error: any }

    if (error) {
      throw error
    }

    await fetchPersons()
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
    const mpResult: any = await mpQuery.update({ person_id: targetId }).eq('person_id', sourceId)
    const { error: updateError } = mpResult as { error: any }

    if (updateError) {
      throw updateError
    }

    // ソースのpersonをマージ済みとしてマーク
    const pQuery = supabase.from('persons')
    // @ts-expect-error - Supabase type inference issue with update
    const pResult: any = await pQuery.update({ merged_into_id: targetId }).eq('id', sourceId)
    const { error: mergeError } = pResult as { error: any }

    if (mergeError) {
      throw mergeError
    }

    await fetchPersons()
  }

  const unmergePersons = async (personId: string) => {
    // マージ状態を解除
    const query = supabase.from('persons')
    // @ts-expect-error - Supabase type inference issue with update
    const result: any = await query.update({ merged_into_id: null }).eq('id', personId)
    const { error } = result as { error: any }

    if (error) {
      throw error
    }

    await fetchPersons()
  }

  const getMergedPersons = async (targetId: string): Promise<Person[]> => {
    const { data, error } = (await supabase
      .from('persons')
      .select('*')
      .eq('merged_into_id', targetId)) as { data: Person[] | null; error: any }

    if (error) {
      console.error('Failed to get merged persons:', error)
      return []
    }

    return data || []
  }

  return {
    persons,
    personsWithStats,
    loading,
    updatePerson,
    mergePersons,
    unmergePersons,
    getMergedPersons,
    refetch: fetchPersons,
  }
}
