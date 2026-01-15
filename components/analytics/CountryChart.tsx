'use client'

import Link from 'next/link'
import { Globe, ChevronRight } from 'lucide-react'
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>製作国別視聴本数</CardTitle>
            <CardDescription>製作国ごとの視聴本数（Top 10）</CardDescription>
          </div>
          <Link
            href="/browse/countries"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            すべて見る
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
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

        {/* 国別リンク */}
        <div className="mt-4 space-y-1">
          {data.slice(0, 5).map(({ name, count }) => (
            <Link
              key={name}
              href={`/browse/countries/${encodeURIComponent(name)}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-500" />
                <span className="text-sm">{name}</span>
              </div>
              <span className="text-sm text-slate-500">{count}本</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
