'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Tag as TagIcon, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TagForm } from '@/components/tags/TagForm'
import { useTags } from '@/hooks/useTags'
import { useMovieFilter } from '@/hooks/useMovieFilter'
import type { TagFormData } from '@/lib/validations/tag'
import type { Tag } from '@/types/tag'

export default function TagsPage() {
  const { tags, loading, addTag, updateTag, deleteTag } = useTags()
  const { movies } = useMovieFilter()

  // タグごとの映画数を計算
  const movieCountByTag = useMemo(() => {
    const counts = new Map<string, number>()
    for (const tag of tags) {
      const count = movies.filter(m => m.tags.some(t => t.id === tag.id)).length
      counts.set(tag.id, count)
    }
    return counts
  }, [tags, movies])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  const handleCreate = async (data: TagFormData) => {
    try {
      await addTag(data)
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('タグの作成に失敗しました:', error)
      alert('タグの作成に失敗しました')
    }
  }

  const handleUpdate = async (data: TagFormData) => {
    if (!editingTag) return

    try {
      await updateTag(editingTag.id, data)
      setEditingTag(null)
    } catch (error) {
      console.error('タグの更新に失敗しました:', error)
      alert('タグの更新に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このタグを削除しますか？')) return

    try {
      await deleteTag(id)
    } catch (error) {
      console.error('タグの削除に失敗しました:', error)
      alert('タグの削除に失敗しました')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">タグ管理</h1>
          <p className="text-slate-600 mt-1">映画の分類に使用するタグを管理します</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>タグを作成</Button>
      </div>

      <div className="text-sm text-slate-600">{tags.length} 件</div>

      {loading ? (
        <div className="text-center py-8 text-slate-600">読み込み中...</div>
      ) : tags.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-600">
            タグがありません。右上のボタンから作成してください。
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tags.map((tag) => {
            const movieCount = movieCountByTag.get(tag.id) || 0
            return (
              <Card key={tag.id} className="group relative">
                <CardContent className="pt-4 pb-3 px-3">
                  {/* タグアイコン（クリック可能） */}
                  <Link href={`/tags/${tag.id}`} className="block">
                    <div
                      className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: tag.color || '#64748b' }}
                    >
                      <TagIcon className="h-8 w-8 text-white" />
                    </div>
                  </Link>

                  {/* タグ名 */}
                  <Link
                    href={`/tags/${tag.id}`}
                    className="block text-center font-medium text-sm truncate hover:opacity-80 transition-opacity"
                    style={{ color: tag.color || '#1e293b' }}
                    title={tag.name}
                  >
                    {tag.name}
                  </Link>

                  {/* 映画数 */}
                  <p className="text-xs text-slate-500 text-center mt-1">
                    {movieCount} 作品
                  </p>

                  {/* ホバー時のアクションボタン */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault()
                        setEditingTag(tag)
                      }}
                      title="編集"
                      className="h-7 w-7"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault()
                        handleDelete(tag.id)
                      }}
                      title="削除"
                      className="h-7 w-7 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 作成ダイアログ */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タグを作成</DialogTitle>
            <DialogDescription>
              新しいタグを作成します
            </DialogDescription>
          </DialogHeader>
          <TagForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            submitLabel="作成"
          />
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タグを編集</DialogTitle>
            <DialogDescription>
              タグの情報を編集します
            </DialogDescription>
          </DialogHeader>
          {editingTag && (
            <TagForm
              defaultValues={{
                name: editingTag.name,
                color: editingTag.color || undefined,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditingTag(null)}
              submitLabel="更新"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
