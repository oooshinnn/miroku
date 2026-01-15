'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Calendar, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface MonthData {
  month: string // YYYY-MM
  count: number
  label: string // 2024年1月
}

const fetchMonthlyData = async (): Promise<MonthData[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('watch_logs')
    .select('watched_at, movie_id')
    .order('watched_at', { ascending: false }) as { data: { watched_at: string; movie_id: string }[] | null; error: any }

  if (error) throw error

  // 月ごとにユニークな映画数を集計
  const monthMap = new Map<string, Set<string>>()

  for (const log of data || []) {
    const month = log.watched_at.substring(0, 7) // YYYY-MM
    if (!monthMap.has(month)) {
      monthMap.set(month, new Set())
    }
    monthMap.get(month)!.add(log.movie_id)
  }

  // 配列に変換してソート
  return Array.from(monthMap.entries())
    .map(([month, movieIds]) => {
      const [year, m] = month.split('-')
      return {
        month,
        count: movieIds.size,
        label: `${year}年${parseInt(m)}月`,
      }
    })
    .sort((a, b) => b.month.localeCompare(a.month))
}

export default function MonthsBrowsePage() {
  const { data: months = [], isLoading } = useSWR('browse-months', fetchMonthlyData, {
    revalidateOnFocus: false,
  })

  // 年ごとにグループ化
  const monthsByYear = useMemo(() => {
    const grouped = new Map<string, MonthData[]>()

    for (const month of months) {
      const year = month.month.substring(0, 4)
      if (!grouped.has(year)) {
        grouped.set(year, [])
      }
      grouped.get(year)!.push(month)
    }

    return grouped
  }, [months])

  if (isLoading) {
    return <div className="text-center py-8 text-slate-600">読み込み中...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">視聴月別</h1>
        <p className="text-slate-600 mt-1">視聴した月ごとの映画一覧</p>
      </div>

      {Array.from(monthsByYear.entries()).map(([year, yearMonths]) => (
        <section key={year} className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">{year}年</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {yearMonths.map(month => (
              <Link key={month.month} href={`/months/${month.month}`}>
                <Card className="hover:border-slate-400 transition-colors cursor-pointer">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-center gap-2 text-slate-600 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{parseInt(month.month.split('-')[1])}月</span>
                    </div>
                    <p className="text-2xl font-bold text-center">{month.count}</p>
                    <p className="text-sm text-slate-500 text-center">本</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {months.length === 0 && (
        <p className="text-center text-slate-500 py-8">
          視聴ログがありません
        </p>
      )}
    </div>
  )
}
