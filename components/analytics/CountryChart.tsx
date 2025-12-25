'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CountryData {
  name: string
  count: number
}

interface CountryChartProps {
  data: CountryData[]
}

export function CountryChart({ data }: CountryChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>製作国別視聴本数</CardTitle>
          <CardDescription>製作国ごとの視聴本数（Top 10）</CardDescription>
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
        <CardTitle>製作国別視聴本数</CardTitle>
        <CardDescription>製作国ごとの視聴本数（Top 10）</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#f59e0b" name="視聴本数" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
