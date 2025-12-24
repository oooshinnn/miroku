'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TagBadge } from '@/components/tags/TagBadge'
import { useTags } from '@/hooks/useTags'
import { useMovies } from '@/hooks/useMovies'
import type { Tag } from '@/types/tag'

interface MovieTagSelectorProps {
  movieId: string
  initialTags?: Tag[]
}

export function MovieTagSelector({ movieId, initialTags = [] }: MovieTagSelectorProps) {
  const [movieTags, setMovieTags] = useState<Tag[]>(initialTags)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { tags: allTags, loading: tagsLoading } = useTags()
  const { addTagToMovie, removeTagFromMovie, getMovieTags } = useMovies()

  useEffect(() => {
    const fetchTags = async () => {
      const tags = await getMovieTags(movieId)
      setMovieTags(tags)
    }
    fetchTags()
  }, [movieId])

  const availableTags = allTags.filter(
    tag => !movieTags.some(mt => mt.id === tag.id)
  )

  const handleAddTag = async (tag: Tag) => {
    setLoading(true)
    try {
      await addTagToMovie(movieId, tag.id)
      setMovieTags(prev => [...prev, tag])
    } catch (error) {
      console.error('タグの追加に失敗しました:', error)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    setLoading(true)
    try {
      await removeTagFromMovie(movieId, tagId)
      setMovieTags(prev => prev.filter(t => t.id !== tagId))
    } catch (error) {
      console.error('タグの削除に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {movieTags.map(tag => (
        <div key={tag.id} className="flex items-center gap-1">
          <TagBadge tag={tag} />
          <button
            onClick={() => handleRemoveTag(tag.id)}
            disabled={loading}
            className="p-0.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            disabled={loading || tagsLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            タグを追加
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          {availableTags.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-2">
              追加できるタグがありません
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleAddTag(tag)}
                  disabled={loading}
                  className="disabled:opacity-50"
                >
                  <TagBadge tag={tag} />
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
