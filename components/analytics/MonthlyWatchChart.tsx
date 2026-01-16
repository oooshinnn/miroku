'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MonthlyData {
  month: string
  count: number
}

interface MonthlyWatchChartProps {
  data: MonthlyData[]
}

export function MonthlyWatchChart({ data }: MonthlyWatchChartProps) {
  const router = useRouter()

  const handleClick = (month: string) => {
    // "2024/01" -> "2024-01"
    const monthKey = month.replace('/', '-')
    router.push(`/months/${monthKey}`)
  }

  const renderXAxisTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => (
    <text
      x={x}
      y={y + 12}
      textAnchor="middle"
      fill="#334155"
      fontSize={12}
      style={{ cursor: 'pointer' }}
      onClick={() => handleClick(payload.value)}
      className="hover:fill-blue-600"
    >
      {payload.value}
    </text>
  )

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>月別視聴本数</CardTitle>
            <CardDescription>各月に視聴した映画の本数（重複除外）</CardDescription>
          </div>
          <Link
            href="/months"
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
            <XAxis dataKey="month" tick={renderXAxisTick} />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value) => [`${value}本`, '視聴本数']} />
            <Bar
              dataKey="count"
              fill="#3b82f6"
              name="視聴本数"
              cursor="pointer"
              activeBar={false}
              onClick={(_, index) => handleClick(data[index].month)}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
