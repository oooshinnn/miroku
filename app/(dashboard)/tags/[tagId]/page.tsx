'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMovieFilter } from '@/hooks/useMovieFilter'
import { MovieCard } from '@/components/movies/MovieCard'
import { createClient } from '@/lib/supabase/client'

interface TagData {
  id: string
  name: string
  color: string | null
}

const fetchTag = async (tagId: string): Promise<TagData | null> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, color')
    .eq('id', tagId)
    .single()

  if (error) return null
  return data
}

export default function TagDetailPage() {
  const params = useParams()
  const tagId = params.tagId as string
  const { movies, loading: moviesLoading } = useMovieFilter()

  const { data: tag, isLoading: tagLoading } = useSWR(
    `browse-tag-${tagId}`,
    () => fetchTag(tagId),
    { revalidateOnFocus: false }
  )

  const loading = moviesLoading || tagLoading

  const filteredMovies = useMemo(() => {
    return movies.filter(m =>
      m.tags.some(t => t.id === tagId)
    )
  }, [movies, tagId])

  if (loading) {
    return <div className="text-center py-8 text-slate-600">読み込み中...</div>
  }

  if (!tag) {
    return (
      <div className="text-center py-8 text-slate-600">
        タグが見つかりません
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/tags">
          <Button variant="outline">← 一覧に戻る</Button>
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Tag
            className="h-6 w-6"
            style={{ color: tag.color || '#64748b' }}
          />
          <h1
            className="text-2xl font-bold"
            style={{ color: tag.color || '#1e293b' }}
          >
            {tag.name}の映画
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
          このタグの映画はありません
        </p>
      )}
    </div>
  )
}
