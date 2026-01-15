'use client'

import Link from 'next/link'
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
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip
              formatter={(value) => [`${value}本`, '視聴本数']}
            />
            <Bar dataKey="count" name="視聴本数">
              {fullData.map((entry) => (
                <Cell
                  key={entry.score}
                  fill={SCORE_COLORS[entry.score as WatchScore]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* スコア別リンク */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          {fullData.map(({ score, count }) => (
            <Link
              key={score}
              href={`/browse/scores/${score}`}
              className="flex flex-col items-center p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-0.5 text-yellow-500">
                {Array.from({ length: score }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
              </div>
              <span className="text-sm font-medium">{count}本</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
