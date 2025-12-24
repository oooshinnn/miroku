'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MonthlyWatchChart } from '@/components/analytics/MonthlyWatchChart'
import { DirectorChart } from '@/components/analytics/DirectorChart'
import { CastChart } from '@/components/analytics/CastChart'

interface MonthlyData {
  month: string
  count: number
}

interface PersonData {
  name: string
  count: number
}

export default function AnalyticsPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
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

        // 月別視聴本数を取得
        const { data: watchLogs } = (await supabase
          .from('watch_logs')
          .select('watched_at, movie_id')
          .eq('user_id', user.id)) as { data: any[] | null }

        if (watchLogs) {
          // 月ごとにユニークな映画IDをカウント
          const monthlyMap = new Map<string, Set<string>>()

          watchLogs.forEach((log) => {
            const date = new Date(log.watched_at)
            const month = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`
            if (!monthlyMap.has(month)) {
              monthlyMap.set(month, new Set())
            }
            monthlyMap.get(month)!.add(log.movie_id)
          })

          const monthly = Array.from(monthlyMap.entries())
            .map(([month, movieIds]) => ({
              month,
              count: movieIds.size,
            }))
            .sort((a, b) => a.month.localeCompare(b.month))

          setMonthlyData(monthly)
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
        <MonthlyWatchChart data={monthlyData} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DirectorChart data={directorData} />
          <CastChart data={castData} />
        </div>
      </div>
    </div>
  )
}
