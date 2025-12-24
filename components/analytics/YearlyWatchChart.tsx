'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface YearlyData {
  year: string
  count: number
}

interface YearlyWatchChartProps {
  data: YearlyData[]
}

export function YearlyWatchChart({ data }: YearlyWatchChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>年別視聴本数</CardTitle>
          <CardDescription>各年に視聴した映画の本数</CardDescription>
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
        <CardTitle>年別視聴本数</CardTitle>
        <CardDescription>各年に視聴した映画の本数（重複除外）</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="視聴本数" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
