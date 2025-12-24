'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search, Edit2, GitMerge, Check, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePersons, type PersonWithStats } from '@/hooks/usePersons'

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500'

const roleLabels: Record<string, string> = {
  director: '監督',
  writer: '脚本',
  cast: 'キャスト',
}

export default function PersonsPage() {
  const { personsWithStats, loading, updatePerson, mergePersons, refetch } = usePersons()
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [mergeSource, setMergeSource] = useState<PersonWithStats | null>(null)
  const [mergeTarget, setMergeTarget] = useState<PersonWithStats | null>(null)
  const [isMerging, setIsMerging] = useState(false)

  const filteredPersons = personsWithStats.filter((person) =>
    person.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStartEdit = (person: PersonWithStats) => {
    setEditingId(person.id)
    setEditName(person.display_name)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return

    try {
      await updatePerson(editingId, editName.trim())
      setEditingId(null)
      setEditName('')
    } catch (error) {
      console.error('Failed to update person:', error)
      alert('名前の更新に失敗しました')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleOpenMergeDialog = (person: PersonWithStats) => {
    setMergeSource(person)
    setMergeTarget(null)
    setMergeDialogOpen(true)
  }

  const handleMerge = async () => {
    if (!mergeSource || !mergeTarget) return

    setIsMerging(true)
    try {
      await mergePersons(mergeSource.id, mergeTarget.id)
      setMergeDialogOpen(false)
      setMergeSource(null)
      setMergeTarget(null)
    } catch (error) {
      console.error('Failed to merge persons:', error)
      alert('マージに失敗しました')
    } finally {
      setIsMerging(false)
    }
  }

  const availableMergeTargets = personsWithStats.filter(
    (p) => mergeSource && p.id !== mergeSource.id
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">人物管理</h1>
        <div className="text-center py-8 text-slate-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">人物管理</h1>
        <p className="text-slate-600 mt-2">
          監督・脚本・キャストの表記を編集したり、同一人物をマージできます
        </p>
      </div>

      {/* 検索 */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="名前で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 人物一覧 */}
      <div className="text-sm text-slate-600">{filteredPersons.length} 人</div>

      <div className="grid gap-3">
        {filteredPersons.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-600">
              {searchQuery
                ? '検索条件に一致する人物がいません'
                : '人物がまだ登録されていません'}
            </CardContent>
          </Card>
        ) : (
          filteredPersons.map((person) => (
            <Card key={person.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* 顔写真 */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                      {person.tmdb_profile_path ? (
                        <Image
                          src={`${IMAGE_BASE_URL}${person.tmdb_profile_path}`}
                          alt={person.display_name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                          <User className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {editingId === person.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="max-w-xs"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleSaveEdit}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="text-slate-600 hover:text-slate-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="font-medium text-slate-900">
                            {person.display_name}
                          </span>
                          <div className="flex gap-2 mt-1">
                            {person.roles.map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {roleLabels[role]}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-slate-500">
                          {person.movie_count} 作品
                        </span>
                      </>
                    )}
                  </div>

                  {editingId !== person.id && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleStartEdit(person)}
                        title="名前を編集"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenMergeDialog(person)}
                        title="他の人物にマージ"
                      >
                        <GitMerge className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* マージダイアログ */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>人物をマージ</DialogTitle>
            <DialogDescription>
              「{mergeSource?.display_name}」を別の人物に統合します。
              統合先の人物を選択してください。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">統合先を検索</label>
              <div className="max-h-64 overflow-y-auto border rounded-md">
                {availableMergeTargets.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500 text-center">
                    統合可能な人物がいません
                  </p>
                ) : (
                  availableMergeTargets.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => setMergeTarget(person)}
                      className={`w-full text-left px-4 py-2 border-b last:border-b-0 ${
                        mergeTarget?.id === person.id
                          ? 'bg-blue-50 text-blue-900'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-medium">{person.display_name}</div>
                      <div className="text-sm text-slate-500">
                        {person.movie_count} 作品 ・{' '}
                        {person.roles.map((r) => roleLabels[r]).join(', ')}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {mergeTarget && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">
                  「{mergeSource?.display_name}」の全ての出演記録は「
                  {mergeTarget.display_name}」に統合されます。
                  この操作は取り消すことができます。
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMergeDialogOpen(false)}
              disabled={isMerging}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleMerge}
              disabled={!mergeTarget || isMerging}
            >
              {isMerging ? 'マージ中...' : 'マージ実行'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
