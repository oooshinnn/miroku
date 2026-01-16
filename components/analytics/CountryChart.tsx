'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CountryData {
  name: string
  count: number
}

interface CountryChartProps {
  data: CountryData[]
}

export function CountryChart({ data }: CountryChartProps) {
  const router = useRouter()

  const handleClick = (name: string) => {
    router.push(`/countries/${encodeURIComponent(name)}`)
  }

  const renderYAxisTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill="#334155"
      fontSize={14}
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
            href="/countries"
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
            <YAxis dataKey="name" type="category" width={150} tick={renderYAxisTick} />
            <Tooltip formatter={(value) => [`${value}本`, '視聴本数']} />
            <Bar
              dataKey="count"
              fill="#f59e0b"
              name="視聴本数"
              cursor="pointer"
              activeBar={false}
              onClick={(_, index) => handleClick(data[index].name)}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
