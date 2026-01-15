'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { MovieCard } from '@/components/movies/MovieCard'
import { useMovieFilter } from '@/hooks/useMovieFilter'

const fetchMonthMovieIds = async (month: string): Promise<string[]> => {
  const supabase = createClient()

  // 月の開始日と翌月の開始日を計算
  const [year, monthNum] = month.split('-').map(Number)
  const startDate = `${month}-01`

  // 翌月の1日を計算（翌月の1日未満で絞り込む）
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1
  const nextYear = monthNum === 12 ? year + 1 : year
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('watch_logs')
    .select('movie_id')
    .gte('watched_at', startDate)
    .lt('watched_at', endDate) as { data: { movie_id: string }[] | null; error: any }

  if (error) throw error

  // ユニークな映画IDを返す
  return [...new Set((data || []).map(d => d.movie_id))]
}

export default function MonthDetailPage() {
  const params = useParams()
  const month = params.month as string
  const { movies, loading: moviesLoading } = useMovieFilter()

  const { data: movieIds = [], isLoading: idsLoading } = useSWR(
    `browse-month-${month}`,
    () => fetchMonthMovieIds(month),
    { revalidateOnFocus: false }
  )

  const filteredMovies = useMemo(() => {
    const idSet = new Set(movieIds)
    return movies.filter(m => idSet.has(m.id))
  }, [movies, movieIds])

  const loading = moviesLoading || idsLoading

  // 月のラベルを生成
  const [year, m] = month.split('-')
  const monthLabel = `${year}年${parseInt(m)}月`

  if (loading) {
    return <div className="text-center py-8 text-slate-600">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/months">
          <Button variant="outline">← 一覧に戻る</Button>
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-slate-600" />
          <h1 className="text-2xl font-bold text-slate-900">
            {monthLabel}の映画
          </h1>
        </div>
        <p className="text-slate-600 mt-1">{filteredMovies.length}本</p>
      </div>

      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-500 py-8">
          この月の映画はありません
        </p>
      )}
    </div>
  )
}
