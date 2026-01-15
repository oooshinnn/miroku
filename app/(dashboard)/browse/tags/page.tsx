'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Tag, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useMovieFilter } from '@/hooks/useMovieFilter'
import { MovieCard } from '@/components/movies/MovieCard'
import { createClient } from '@/lib/supabase/client'

interface TagData {
  id: string
  name: string
  color: string | null
}

const fetchTags = async (): Promise<TagData[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, color')
    .order('name')

  if (error) throw error
  return data || []
}

export default function TagsBrowsePage() {
  const { movies, loading: moviesLoading } = useMovieFilter()
  const { data: tags = [], isLoading: tagsLoading } = useSWR('browse-tags', fetchTags, {
    revalidateOnFocus: false,
  })

  const loading = moviesLoading || tagsLoading

  // タグ別に映画をグループ化
  const moviesByTag = useMemo(() => {
    const grouped = new Map<string, typeof movies>()

    for (const tag of tags) {
      const tagMovies = movies.filter(m =>
        m.tags.some(t => t.id === tag.id)
      )
      if (tagMovies.length > 0) {
        grouped.set(tag.id, tagMovies)
      }
    }

    return grouped
  }, [movies, tags])

  // 統計情報（映画数の多い順）
  const stats = useMemo(() => {
    return tags
      .map(tag => ({
        ...tag,
        count: moviesByTag.get(tag.id)?.length || 0,
      }))
      .filter(t => t.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [tags, moviesByTag])

  if (loading) {
    return <div className="text-center py-8 text-slate-600">読み込み中...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">タグ別</h1>
        <p className="text-slate-600 mt-1">タグごとの映画一覧</p>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {stats.slice(0, 12).map(tag => (
          <Link key={tag.id} href={`/browse/tags/${tag.id}`}>
            <Card className="hover:border-slate-400 transition-colors cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Tag
                    className="h-4 w-4"
                    style={{ color: tag.color || '#64748b' }}
                  />
                </div>
                <p
                  className="text-sm font-medium text-center truncate"
                  style={{ color: tag.color || '#1e293b' }}
                >
                  {tag.name}
                </p>
                <p className="text-2xl font-bold text-center mt-1">{tag.count}</p>
                <p className="text-sm text-slate-500 text-center">本</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* タグ別セクション */}
      {stats.slice(0, 10).map(tag => {
        const tagMovies = moviesByTag.get(tag.id)
        if (!tagMovies || tagMovies.length === 0) return null

        return (
          <section key={tag.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag
                  className="h-5 w-5"
                  style={{ color: tag.color || '#64748b' }}
                />
                <span
                  className="text-lg font-semibold"
                  style={{ color: tag.color || '#1e293b' }}
                >
                  {tag.name}
                </span>
                <span className="text-slate-500">
                  {tagMovies.length}本
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {tagMovies.slice(0, 12).map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {tagMovies.length > 12 && (
              <Link
                href={`/browse/tags/${tag.id}`}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                すべて表示 ({tagMovies.length}本)
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </section>
        )
      })}

      {stats.length === 0 && (
        <p className="text-center text-slate-500 py-8">
          タグ付けされた映画がありません
        </p>
      )}
    </div>
  )
}
