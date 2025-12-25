'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CastData {
  name: string
  count: number
}

interface CastChartProps {
  data: CastData[]
}

export function CastChart({ data }: CastChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>キャスト別視聴作品数</CardTitle>
          <CardDescription>最も多く視聴したキャストの作品（Top 10）</CardDescription>
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
        <CardTitle>キャスト別視聴作品数</CardTitle>
        <CardDescription>最も多く視聴したキャストの作品（Top 10）</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="視聴作品数" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
