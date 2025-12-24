'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TagBadge } from '@/components/tags/TagBadge'
import { TagForm } from '@/components/tags/TagForm'
import { useTags } from '@/hooks/useTags'
import type { TagFormData } from '@/lib/validations/tag'
import type { Tag } from '@/types/tag'

export default function TagsPage() {
  const { tags, loading, addTag, updateTag, deleteTag } = useTags()
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
        <h1 className="text-3xl font-bold text-slate-900">タグ管理</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>タグを作成</Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-600">読み込み中...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>タグ一覧</CardTitle>
            <CardDescription>
              映画の分類に使用するタグを管理します
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tags.length === 0 ? (
              <p className="text-slate-600 text-center py-4">
                タグがありません。右上のボタンから作成してください。
              </p>
            ) : (
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <TagBadge tag={tag} />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTag(tag)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(tag.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
