'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Star, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMovieFilter } from '@/hooks/useMovieFilter'
import { MovieCard } from '@/components/movies/MovieCard'
import { WATCH_SCORES, type WatchScore } from '@/types/watch-log'

export default function ScoresBrowsePage() {
  const { movies, loading } = useMovieFilter()

  // スコア別に映画をグループ化
  const moviesByScore = useMemo(() => {
    const grouped = new Map<WatchScore, typeof movies>()

    WATCH_SCORES.forEach(score => {
      const filtered = movies.filter(m => m.bestScore === score)
      if (filtered.length > 0) {
        grouped.set(score, filtered)
      }
    })

    return grouped
  }, [movies])

  // 統計情報
  const stats = useMemo(() => {
    return WATCH_SCORES.map(score => ({
      score,
      count: movies.filter(m => m.bestScore === score).length,
    })).filter(s => s.count > 0)
  }, [movies])

  if (loading) {
    return <div className="text-center py-8 text-slate-600">読み込み中...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">スコア別</h1>
        <p className="text-slate-600 mt-1">評価スコアごとの映画一覧</p>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-5 gap-4">
        {WATCH_SCORES.map(score => {
          const count = movies.filter(m => m.bestScore === score).length
          return (
            <Card key={score} className={count === 0 ? 'opacity-50' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-center gap-1 text-yellow-500 mb-2">
                  {Array.from({ length: score }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-2xl font-bold text-center">{count}</p>
                <p className="text-sm text-slate-500 text-center">本</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* スコア別セクション（高評価順） */}
      {[...WATCH_SCORES].reverse().map(score => {
        const scoreMovies = moviesByScore.get(score)
        if (!scoreMovies || scoreMovies.length === 0) return null

        return (
          <section key={score} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 text-yellow-500">
                  {Array.from({ length: score }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <span className="text-lg font-semibold text-slate-900">
                  {scoreMovies.length}本
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {scoreMovies.slice(0, 12).map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {scoreMovies.length > 12 && (
              <Link
                href={`/browse/scores/${score}`}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                すべて表示 ({scoreMovies.length}本)
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </section>
        )
      })}

      {stats.length === 0 && (
        <p className="text-center text-slate-500 py-8">
          評価済みの映画がありません
        </p>
      )}
    </div>
  )
}
