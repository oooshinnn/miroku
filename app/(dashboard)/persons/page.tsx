'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Edit2, GitMerge, Check, X, User, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { usePersons, type PersonWithStats } from '@/hooks/usePersons'

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500'

const roleLabels: Record<string, string> = {
  director: '監督',
  writer: '脚本',
  cast: 'キャスト',
}

export default function PersonsPage() {
  const { personsWithStats, loading, updatePerson, mergePersons, deleteUnusedPersons, refetch } = usePersons()
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [mergeSource, setMergeSource] = useState<PersonWithStats | null>(null)
  const [mergeTarget, setMergeTarget] = useState<PersonWithStats | null>(null)
  const [isMerging, setIsMerging] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 作品が0の人物の数
  const unusedPersonsCount = useMemo(() => {
    return personsWithStats.filter((p) => p.movie_count === 0).length
  }, [personsWithStats])

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

  const handleDeleteUnused = async () => {
    setIsDeleting(true)
    try {
      const deletedCount = await deleteUnusedPersons()
      if (deletedCount > 0) {
        alert(`${deletedCount} 人の未使用データを削除しました`)
      }
    } catch (error) {
      console.error('Failed to delete unused persons:', error)
      alert('削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

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

      {/* 検索とアクション */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="名前で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {unusedPersonsCount > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-1" />
                未使用を削除 ({unusedPersonsCount})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>未使用の人物データを削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  どの映画にも関連付けられていない {unusedPersonsCount} 人のデータを削除します。
                  この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUnused}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? '削除中...' : '削除'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* 人物一覧 */}
      <div className="text-sm text-slate-600">{filteredPersons.length} 人</div>

      {filteredPersons.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-600">
            {searchQuery
              ? '検索条件に一致する人物がいません'
              : '人物がまだ登録されていません'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredPersons.map((person) => (
            <Card key={person.id} className="group relative">
              <CardContent className="pt-4 pb-3 px-3">
                {/* 編集モード */}
                {editingId === person.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-sm"
                      autoFocus
                    />
                    <div className="flex gap-1 justify-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSaveEdit}
                        className="text-green-600 hover:text-green-700 h-8 px-2"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="text-slate-600 hover:text-slate-700 h-8 px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 顔写真 */}
                    <Link href={`/persons/${person.id}`} className="block">
                      <div className="relative w-24 h-24 mx-auto rounded-[30%] overflow-hidden bg-slate-200 mb-3">
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
                            <User className="h-10 w-10" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* 名前 */}
                    <Link
                      href={`/persons/${person.id}`}
                      className="block text-center font-medium text-sm text-slate-900 hover:text-blue-600 transition-colors truncate"
                      title={person.display_name}
                    >
                      {person.display_name}
                    </Link>

                    {/* 役割バッジ */}
                    <div className="flex flex-wrap gap-1 justify-center mt-2">
                      {person.roles.map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs px-1.5 py-0">
                          {roleLabels[role]}
                        </Badge>
                      ))}
                    </div>

                    {/* 作品数 */}
                    <p className="text-xs text-slate-500 text-center mt-2">
                      {person.movie_count} 作品
                    </p>

                    {/* ホバー時のアクションボタン */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleStartEdit(person)}
                        title="名前を編集"
                        className="h-7 w-7"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenMergeDialog(person)}
                        title="他の人物にマージ"
                        className="h-7 w-7"
                      >
                        <GitMerge className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
