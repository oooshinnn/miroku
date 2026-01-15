'use client'

import Link from 'next/link'
import { Calendar, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MonthlyData {
  month: string
  count: number
}

interface MonthlyWatchChartProps {
  data: MonthlyData[]
}

export function MonthlyWatchChart({ data }: MonthlyWatchChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>月別視聴本数</CardTitle>
          <CardDescription>各月に視聴した映画の本数</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 text-center py-8">データがありません</p>
        </CardContent>
      </Card>
    )
  }

  // 最新5ヶ月のデータを取得（逆順で）
  const recentMonths = [...data].reverse().slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>月別視聴本数</CardTitle>
            <CardDescription>各月に視聴した映画の本数（重複除外）</CardDescription>
          </div>
          <Link
            href="/browse/months"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            すべて見る
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="視聴本数" />
          </BarChart>
        </ResponsiveContainer>

        {/* 最新月別リンク */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          {recentMonths.map(({ month, count }) => {
            // "2024/01" -> "2024-01"
            const monthKey = month.replace('/', '-')
            return (
              <Link
                key={month}
                href={`/browse/months/${monthKey}`}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Calendar className="h-4 w-4 text-blue-500 mb-1" />
                <span className="text-xs text-slate-600">{month}</span>
                <span className="text-sm font-medium">{count}本</span>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
