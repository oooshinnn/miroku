'use client'

import { useState } from 'react'
import { Edit2, Check, X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface PersonData {
  id: string
  personId: string
  displayName: string
}

interface EditablePersonListProps {
  persons: PersonData[]
  maxDisplay?: number
  movieId?: string
  role?: 'director' | 'writer' | 'cast'
  onPersonAdded?: () => void
}

export function EditablePersonList({ persons, maxDisplay, movieId, role, onPersonAdded }: EditablePersonListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [personList, setPersonList] = useState(persons)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const supabase = createClient()

  const displayedPersons = maxDisplay ? personList.slice(0, maxDisplay) : personList
  const remainingCount = maxDisplay ? Math.max(0, personList.length - maxDisplay) : 0

  const handleStartEdit = (person: PersonData) => {
    setEditingId(person.personId)
    setEditName(person.displayName)
  }

  const handleSave = async () => {
    if (!editingId || !editName.trim()) return

    setSaving(true)
    try {
      const query = supabase.from('persons')
      // @ts-expect-error - Supabase type inference issue with update
      const result: any = await query.update({ display_name: editName.trim() }).eq('id', editingId)
      const { error } = result as { error: any }

      if (error) throw error

      // ローカル状態を更新
      setPersonList(prev =>
        prev.map(p =>
          p.personId === editingId ? { ...p, displayName: editName.trim() } : p
        )
      )
      setEditingId(null)
      setEditName('')
    } catch (error) {
      console.error('Failed to update person name:', error)
      alert('名前の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleAddPerson = async () => {
    if (!newName.trim() || !movieId || !role) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 既存の人物を検索
      const { data: existingPerson } = await supabase
        .from('persons')
        .select('id')
        .eq('user_id', user.id)
        .eq('display_name', newName.trim())
        .is('merged_into_id', null)
        .maybeSingle() as { data: { id: string } | null }

      let personId: string

      if (existingPerson) {
        personId = existingPerson.id
      } else {
        // 新しい人物を作成
        const { data: newPerson, error: personError } = await supabase
          .from('persons')
          .insert({ user_id: user.id, display_name: newName.trim() } as any)
          .select()
          .single()

        if (personError || !newPerson) throw personError || new Error('Failed to create person')
        personId = (newPerson as any).id
      }

      // 映画との関連を作成
      const castOrder = role === 'cast' ? personList.length : undefined
      const { data: moviePerson, error: linkError } = await supabase
        .from('movie_persons')
        .insert({
          movie_id: movieId,
          person_id: personId,
          role,
          cast_order: castOrder,
        } as any)
        .select()
        .single()

      if (linkError || !moviePerson) throw linkError || new Error('Failed to link person')

      // ローカル状態を更新
      setPersonList(prev => [...prev, {
        id: (moviePerson as any).id,
        personId,
        displayName: newName.trim(),
      }])

      setNewName('')
      setIsAdding(false)
      onPersonAdded?.()
    } catch (error) {
      console.error('Failed to add person:', error)
      alert('人物の追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPerson()
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setNewName('')
    }
  }

  const canAdd = !!movieId && !!role

  return (
    <div className="space-y-2">
      {personList.length === 0 && !canAdd && (
        <span className="text-slate-500">-</span>
      )}

      {personList.length > 0 && (
        <div className="flex flex-wrap gap-x-1 gap-y-1">
          {displayedPersons.map((person, index) => (
            <span key={person.id} className="inline-flex items-center">
              {editingId === person.personId ? (
                <span className="inline-flex items-center gap-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-7 w-40 text-sm"
                    autoFocus
                    disabled={saving}
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="p-1 text-slate-500 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ) : (
                <span className="group inline-flex items-center">
                  <span className="text-slate-700">{person.displayName}</span>
                  <button
                    onClick={() => handleStartEdit(person)}
                    className="ml-1 p-0.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-600 transition-opacity"
                    title="名前を編集"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  {index < displayedPersons.length - 1 && (
                    <span className="text-slate-400 mr-1">,</span>
                  )}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {remainingCount > 0 && (
        <p className="text-slate-500 text-sm">他 {remainingCount} 名</p>
      )}

      {/* 追加フォーム */}
      {canAdd && (
        <div className="pt-1">
          {isAdding ? (
            <div className="inline-flex items-center gap-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleAddKeyDown}
                placeholder="名前を入力"
                className="h-7 w-40 text-sm"
                autoFocus
                disabled={saving}
              />
              <button
                onClick={handleAddPerson}
                disabled={saving || !newName.trim()}
                className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setIsAdding(false); setNewName('') }}
                disabled={saving}
                className="p-1 text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              追加
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
