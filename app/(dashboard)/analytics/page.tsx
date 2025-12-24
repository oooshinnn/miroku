'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { YearlyWatchChart } from '@/components/analytics/YearlyWatchChart'
import { DirectorChart } from '@/components/analytics/DirectorChart'
import { CastChart } from '@/components/analytics/CastChart'

interface YearlyData {
  year: string
  count: number
}

interface PersonData {
  name: string
  count: number
}

export default function AnalyticsPage() {
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([])
  const [directorData, setDirectorData] = useState<PersonData[]>([])
  const [castData, setCastData] = useState<PersonData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // 年別視聴本数を取得
        const { data: watchLogs } = (await supabase
          .from('watch_logs')
          .select('watched_at, movie_id')
          .eq('user_id', user.id)) as { data: any[] | null }

        if (watchLogs) {
          // 年ごとにユニークな映画IDをカウント
          const yearlyMap = new Map<string, Set<string>>()

          watchLogs.forEach((log) => {
            const year = new Date(log.watched_at).getFullYear().toString()
            if (!yearlyMap.has(year)) {
              yearlyMap.set(year, new Set())
            }
            yearlyMap.get(year)!.add(log.movie_id)
          })

          const yearly = Array.from(yearlyMap.entries())
            .map(([year, movieIds]) => ({
              year,
              count: movieIds.size,
            }))
            .sort((a, b) => a.year.localeCompare(b.year))

          setYearlyData(yearly)
        }

        // 監督・キャスト別視聴作品数を取得
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
          `)) as { data: any[] | null }

        if (moviePersons) {
          // 監督データ
          const directorMap = new Map<string, { name: string; movies: Set<string> }>()
          // キャストデータ
          const castMap = new Map<string, { name: string; movies: Set<string> }>()

          moviePersons.forEach((mp) => {
            // マージされた人物は除外
            if (mp.person.merged_into_id) return

            const name = mp.person.display_name
            const movieId = mp.movie_id

            if (mp.role === 'director') {
              if (!directorMap.has(name)) {
                directorMap.set(name, { name, movies: new Set() })
              }
              directorMap.get(name)!.movies.add(movieId)
            } else if (mp.role === 'cast') {
              if (!castMap.has(name)) {
                castMap.set(name, { name, movies: new Set() })
              }
              castMap.get(name)!.movies.add(movieId)
            }
          })

          const directors = Array.from(directorMap.values())
            .map((d) => ({
              name: d.name,
              count: d.movies.size,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

          const casts = Array.from(castMap.values())
            .map((c) => ({
              name: c.name,
              count: c.movies.size,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

          setDirectorData(directors)
          setCastData(casts)
        }
      } catch (error) {
        console.error('分析データの取得に失敗しました:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

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
        <YearlyWatchChart data={yearlyData} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DirectorChart data={directorData} />
          <CastChart data={castData} />
        </div>
      </div>
    </div>
  )
}
