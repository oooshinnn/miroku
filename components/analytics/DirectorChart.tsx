'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DirectorData {
  name: string
  count: number
}

interface DirectorChartProps {
  data: DirectorData[]
}

export function DirectorChart({ data }: DirectorChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>監督別視聴作品数</CardTitle>
          <CardDescription>最も多く視聴した監督の作品（Top 10）</CardDescription>
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
        <CardTitle>監督別視聴作品数</CardTitle>
        <CardDescription>最も多く視聴した監督の作品（Top 10）</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#22c55e" name="視聴作品数" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
