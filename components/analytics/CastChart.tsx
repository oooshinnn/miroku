'use client'

import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CastData {
  id: string
  name: string
  count: number
}

interface CastChartProps {
  data: CastData[]
}

export function CastChart({ data }: CastChartProps) {
  const router = useRouter()

  const handleClick = (personId: string) => {
    router.push(`/persons/${personId}`)
  }

  const renderYAxisTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
    const person = data.find((d) => d.name === payload.value)
    return (
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor="end"
        fill="#334155"
        fontSize={14}
        style={{ cursor: 'pointer' }}
        onClick={() => person && handleClick(person.id)}
        className="hover:fill-blue-600"
      >
        {payload.value}
      </text>
    )
  }

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
            <YAxis dataKey="name" type="category" width={150} tick={renderYAxisTick} />
            <Tooltip formatter={(value) => [`${value}本`, '視聴作品数']} />
            <Bar
              dataKey="count"
              fill="#3b82f6"
              name="視聴作品数"
              cursor="pointer"
              activeBar={false}
              onClick={(_, index) => handleClick(data[index].id)}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
