'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { MonthlyWatchChart } from '@/components/analytics/MonthlyWatchChart'
import { DirectorChart } from '@/components/analytics/DirectorChart'
import { CastChart } from '@/components/analytics/CastChart'
import { CountryChart } from '@/components/analytics/CountryChart'
import { TagChart } from '@/components/analytics/TagChart'
import { ScoreChart } from '@/components/analytics/ScoreChart'
import type { WatchScore } from '@/types/watch-log'

interface AnalyticsData {
  watchLogs: { watched_at: string; movie_id: string; score: number | null }[]
  moviePersons: {
    person_id: string
    movie_id: string
    role: string
    person: { id: string; display_name: string; merged_into_id: string | null }
  }[]
  movies: {
    id: string
    tmdb_production_countries: string[] | null
    custom_production_countries: string[] | null
  }[]
  movieTags: {
    movie_id: string
    tag: { id: string; name: string }
  }[]
}

const ANALYTICS_CACHE_KEY = 'analytics-data'

const fetchAnalyticsData = async (): Promise<AnalyticsData> => {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // 視聴ログを取得
  const { data: watchLogs } = (await supabase
    .from('watch_logs')
    .select('watched_at, movie_id, score')
    .eq('user_id', user.id)) as { data: { watched_at: string; movie_id: string; score: number | null }[] | null }

  // 監督・キャスト情報を取得
  const { data: moviePersons } = (await supabase
    .from('movie_persons')
    .select(`
      person_id,
      movie_id,
      role,
      person:persons(
        id,
        display_name,
        merged_into_id
      )
    `)) as { data: AnalyticsData['moviePersons'] | null }

  // 映画情報を取得（製作国用）
  const { data: movies } = (await supabase
    .from('movies')
    .select('id, tmdb_production_countries, custom_production_countries')
    .eq('user_id', user.id)) as { data: { id: string; tmdb_production_countries: string[] | null; custom_production_countries: string[] | null }[] | null }

  // タグ情報を取得
  const { data: movieTags } = (await supabase
    .from('movie_tags')
    .select(`
      movie_id,
      tag:tags(id, name)
    `)) as { data: AnalyticsData['movieTags'] | null }

  return {
    watchLogs: watchLogs || [],
    moviePersons: moviePersons || [],
    movies: movies || [],
    movieTags: movieTags || [],
  }
}

export default function AnalyticsPage() {
  const { data, isLoading: loading } = useSWR<AnalyticsData>(
    ANALYTICS_CACHE_KEY,
    fetchAnalyticsData,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  )

  // 月別データを計算
  const monthlyData = useMemo(() => {
    if (!data?.watchLogs) return []

    const monthlyMap = new Map<string, Set<string>>()

    data.watchLogs.forEach((log) => {
      const date = new Date(log.watched_at)
      const month = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, new Set())
      }
      monthlyMap.get(month)!.add(log.movie_id)
    })

    return Array.from(monthlyMap.entries())
      .map(([month, movieIds]) => ({
        month,
        count: movieIds.size,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [data])

  // 監督データを計算
  const directorData = useMemo(() => {
    if (!data?.moviePersons) return []

    const directorMap = new Map<string, { id: string; name: string; movies: Set<string> }>()

    data.moviePersons.forEach((mp) => {
      if (mp.person.merged_into_id) return
      if (mp.role !== 'director') return

      const personId = mp.person.id
      const name = mp.person.display_name
      if (!directorMap.has(personId)) {
        directorMap.set(personId, { id: personId, name, movies: new Set() })
      }
      directorMap.get(personId)!.movies.add(mp.movie_id)
    })

    return Array.from(directorMap.values())
      .map((d) => ({
        id: d.id,
        name: d.name,
        count: d.movies.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [data])

  // キャストデータを計算
  const castData = useMemo(() => {
    if (!data?.moviePersons) return []

    const castMap = new Map<string, { id: string; name: string; movies: Set<string> }>()

    data.moviePersons.forEach((mp) => {
      if (mp.person.merged_into_id) return
      if (mp.role !== 'cast') return

      const personId = mp.person.id
      const name = mp.person.display_name
      if (!castMap.has(personId)) {
        castMap.set(personId, { id: personId, name, movies: new Set() })
      }
      castMap.get(personId)!.movies.add(mp.movie_id)
    })

    return Array.from(castMap.values())
      .map((c) => ({
        id: c.id,
        name: c.name,
        count: c.movies.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [data])

  // 製作国データを計算
  const countryData = useMemo(() => {
    if (!data?.movies) return []

    const countryMap = new Map<string, number>()

    data.movies.forEach((movie) => {
      const countries = movie.custom_production_countries || movie.tmdb_production_countries || []
      countries.forEach((country) => {
        countryMap.set(country, (countryMap.get(country) || 0) + 1)
      })
    })

    return Array.from(countryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [data])

  // タグデータを計算
  const tagData = useMemo(() => {
    if (!data?.movieTags) return []

    const tagMap = new Map<string, { id: string; name: string; movies: Set<string> }>()

    data.movieTags.forEach((mt) => {
      if (!mt.tag) return
      const tagId = mt.tag.id
      const tagName = mt.tag.name
      if (!tagMap.has(tagId)) {
        tagMap.set(tagId, { id: tagId, name: tagName, movies: new Set() })
      }
      tagMap.get(tagId)!.movies.add(mt.movie_id)
    })

    return Array.from(tagMap.values())
      .map((t) => ({
        id: t.id,
        name: t.name,
        count: t.movies.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [data])

  // スコアデータを計算
  const scoreData = useMemo(() => {
    if (!data?.watchLogs) return []

    // 映画ごとの最高スコアを計算
    const movieBestScores = new Map<string, number>()
    data.watchLogs.forEach((log) => {
      if (log.score) {
        const current = movieBestScores.get(log.movie_id)
        if (!current || log.score > current) {
          movieBestScores.set(log.movie_id, log.score)
        }
      }
    })

    // スコアごとの映画数を集計
    const scoreMap = new Map<number, number>()
    movieBestScores.forEach((score) => {
      scoreMap.set(score, (scoreMap.get(score) || 0) + 1)
    })

    return Array.from(scoreMap.entries())
      .map(([score, count]) => ({
        score: score as WatchScore,
        count,
      }))
      .sort((a, b) => a.score - b.score)
  }, [data])

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">視聴分析</h1>
        <p className="text-slate-600 mt-2">
          あなたの映画視聴傾向を可視化します
        </p>
      </div>

      <div className="space-y-6">
        <MonthlyWatchChart data={monthlyData} />
        <ScoreChart data={scoreData} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CountryChart data={countryData} />
          <TagChart data={tagData} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DirectorChart data={directorData} />
          <CastChart data={castData} />
        </div>
      </div>
    </div>
  )
}
