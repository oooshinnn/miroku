'use client'

import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { WatchScore } from '@/types/watch-log'

interface ScoreData {
  score: WatchScore
  count: number
}

interface ScoreChartProps {
  data: ScoreData[]
}

const SCORE_COLORS = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#84cc16',
  5: '#22c55e',
}

export function ScoreChart({ data }: ScoreChartProps) {
  const router = useRouter()

  const handleClick = (score: number) => {
    router.push(`/scores/${score}`)
  }

  const renderXAxisTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
    const score = parseInt(payload.value.replace('★', ''), 10)
    return (
      <text
        x={x}
        y={y + 12}
        textAnchor="middle"
        fill="#334155"
        fontSize={14}
        style={{ cursor: 'pointer' }}
        onClick={() => handleClick(score)}
        className="hover:fill-blue-600"
      >
        {payload.value}
      </text>
    )
  }

  // 全スコア（1-5）のデータを作成（0件も含む）
  const fullData = [1, 2, 3, 4, 5].map(score => {
    const found = data.find(d => d.score === score)
    return {
      score,
      count: found?.count || 0,
      label: `★${score}`,
    }
  })

  const totalCount = data.reduce((sum, d) => sum + d.count, 0)
  const avgScore = totalCount > 0
    ? data.reduce((sum, d) => sum + d.score * d.count, 0) / totalCount
    : 0

  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>スコア分布</CardTitle>
          <CardDescription>評価スコアの分布</CardDescription>
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
            <CardTitle>スコア分布</CardTitle>
            <CardDescription>評価スコアの分布</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">平均スコア</p>
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="text-xl font-bold">{avgScore.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={fullData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={renderXAxisTick} />
            <YAxis allowDecimals={false} />
            <Tooltip
              formatter={(value) => [`${value}本`, '視聴本数']}
            />
            <Bar
              dataKey="count"
              name="視聴本数"
              cursor="pointer"
              activeBar={false}
              onClick={(_, index) => handleClick(fullData[index].score)}
            >
              {fullData.map((entry) => (
                <Cell
                  key={entry.score}
                  fill={SCORE_COLORS[entry.score as WatchScore]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
