'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TagBadge } from '@/components/tags/TagBadge'
import { useTags } from '@/hooks/useTags'
import { useMovies } from '@/hooks/useMovies'
import type { Tag } from '@/types/tag'

// 色のプリセット
const COLOR_PRESETS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#64748b', // slate
]

interface MovieTagSelectorProps {
  movieId: string
  initialTags?: Tag[]
}

export function MovieTagSelector({ movieId, initialTags = [] }: MovieTagSelectorProps) {
  const [movieTags, setMovieTags] = useState<Tag[]>(initialTags)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(COLOR_PRESETS[0])
  const { tags: allTags, loading: tagsLoading, addTag, refetch: refetchTags } = useTags()
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

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    setLoading(true)
    try {
      const newTag = await addTag({
        name: newTagName.trim(),
        color: newTagColor,
      })

      if (newTag) {
        await addTagToMovie(movieId, newTag.id)
        setMovieTags(prev => [...prev, newTag])
        await refetchTags()
      }

      setNewTagName('')
      setNewTagColor(COLOR_PRESETS[0])
      setIsCreating(false)
      setOpen(false)
    } catch (error) {
      console.error('タグの作成に失敗しました:', error)
      alert('タグの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setIsCreating(false)
      setNewTagName('')
      setNewTagColor(COLOR_PRESETS[0])
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
            aria-label={`${tag.name}タグを削除`}
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      ))}

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            disabled={loading || tagsLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            タグ
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          {isCreating ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">新しいタグを作成</div>
              <Input
                placeholder="タグ名"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                disabled={loading}
                autoFocus
                className="h-8"
              />
              <div className="space-y-1">
                <div className="text-xs text-slate-500">色を選択</div>
                <div className="flex flex-wrap gap-1">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTagColor(color)}
                      className={`size-6 rounded-full transition-transform ${
                        newTagColor === color ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      disabled={loading}
                      aria-label={`色を${color}に設定`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={loading || !newTagName.trim()}
                  className="flex-1"
                >
                  {loading ? '作成中...' : '作成して追加'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  disabled={loading}
                >
                  戻る
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {availableTags.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500">既存のタグから選択</div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => handleAddTag(tag)}
                        disabled={loading}
                        className="disabled:opacity-50 hover:scale-105 transition-transform"
                      >
                        <TagBadge tag={tag} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t pt-2">
                <button
                  onClick={() => setIsCreating(true)}
                  disabled={loading}
                  className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  新しいタグを作成
                </button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
