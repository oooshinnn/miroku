'use client'

import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TagBadge } from '@/components/tags/TagBadge'
import { useTags } from '@/hooks/useTags'
import type { MovieFilters } from '@/hooks/useMovieFilter'
import type { Tag } from '@/types/tag'
import type { Person } from '@/types/movie'

interface MovieFilterProps {
  filters: MovieFilters
  onFiltersChange: (filters: Partial<MovieFilters>) => void
  onReset: () => void
  hasActiveFilters: boolean
  persons: Person[]
}

export function MovieFilter({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
  persons,
}: MovieFilterProps) {
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)
  const [personPopoverOpen, setPersonPopoverOpen] = useState(false)
  const { tags, loading: tagsLoading } = useTags()

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

  const selectedTags = tags.filter((tag) => filters.tagIds.includes(tag.id))
  const selectedPerson = persons.find((p) => p.id === filters.personId)

  const handleTagToggle = (tagId: string) => {
    const newTagIds = filters.tagIds.includes(tagId)
      ? filters.tagIds.filter((id) => id !== tagId)
      : [...filters.tagIds, tagId]
    onFiltersChange({ tagIds: newTagIds })
  }

  const handlePersonSelect = (personId: string | null) => {
    onFiltersChange({ personId })
    setPersonPopoverOpen(false)
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* タイトル検索 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="タイトルで検索..."
                value={filters.title}
                onChange={(e) => onFiltersChange({ title: e.target.value })}
                className="pl-9"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="outline" onClick={onReset} size="icon">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* フィルタ行 */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-slate-500" />

            {/* タグフィルタ */}
            <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  タグ
                  {selectedTags.length > 0 && (
                    <span className="ml-1 bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-xs">
                      {selectedTags.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                {tagsLoading ? (
                  <p className="text-sm text-slate-500">読み込み中...</p>
                ) : tags.length === 0 ? (
                  <p className="text-sm text-slate-500">タグがありません</p>
                ) : (
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={filters.tagIds.includes(tag.id)}
                          onCheckedChange={() => handleTagToggle(tag.id)}
                        />
                        <TagBadge tag={tag} />
                      </label>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* 人物フィルタ */}
            <Popover open={personPopoverOpen} onOpenChange={setPersonPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {selectedPerson ? selectedPerson.display_name : '人物'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 max-h-64 overflow-y-auto" align="start">
                {persons.length === 0 ? (
                  <p className="text-sm text-slate-500">人物がいません</p>
                ) : (
                  <div className="space-y-1">
                    {filters.personId && (
                      <button
                        onClick={() => handlePersonSelect(null)}
                        className="w-full text-left px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100 rounded"
                      >
                        選択解除
                      </button>
                    )}
                    {persons.map((person) => (
                      <button
                        key={person.id}
                        onClick={() => handlePersonSelect(person.id)}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded ${
                          filters.personId === person.id
                            ? 'bg-slate-200 text-slate-900'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {person.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* 年フィルタ */}
            <div className="flex items-center gap-1">
              <select
                value={filters.yearFrom ?? ''}
                onChange={(e) =>
                  onFiltersChange({
                    yearFrom: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="h-8 px-2 text-sm border rounded-md bg-white"
              >
                <option value="">開始年</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span className="text-slate-400">〜</span>
              <select
                value={filters.yearTo ?? ''}
                onChange={(e) =>
                  onFiltersChange({
                    yearTo: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="h-8 px-2 text-sm border rounded-md bg-white"
              >
                <option value="">終了年</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 選択中のフィルタ表示 */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {filters.title && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                  検索: {filters.title}
                  <button
                    onClick={() => onFiltersChange({ title: '' })}
                    className="hover:text-slate-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm"
                >
                  <TagBadge tag={tag} />
                  <button
                    onClick={() => handleTagToggle(tag.id)}
                    className="hover:text-slate-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {selectedPerson && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                  {selectedPerson.display_name}
                  <button
                    onClick={() => handlePersonSelect(null)}
                    className="hover:text-slate-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(filters.yearFrom || filters.yearTo) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                  {filters.yearFrom ?? '?'} 〜 {filters.yearTo ?? '?'}
                  <button
                    onClick={() => onFiltersChange({ yearFrom: null, yearTo: null })}
                    className="hover:text-slate-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
