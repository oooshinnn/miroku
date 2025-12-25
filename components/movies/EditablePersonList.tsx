'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Plus } from 'lucide-react'
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
  const [saving, setSaving] = useState(false)
  const [personList, setPersonList] = useState(persons)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const supabase = createClient()

  const displayedPersons = maxDisplay ? personList.slice(0, maxDisplay) : personList
  const remainingCount = maxDisplay ? Math.max(0, personList.length - maxDisplay) : 0

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
    <div className="flex flex-wrap items-center gap-1.5">
      {personList.length === 0 && !canAdd && (
        <span className="text-slate-500 text-sm">-</span>
      )}

      {displayedPersons.map((person) => (
        <Link
          key={person.id}
          href={`/persons/${person.personId}`}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          {person.displayName}
        </Link>
      ))}

      {remainingCount > 0 && (
        <span className="text-slate-500 text-xs">他 {remainingCount} 名</span>
      )}

      {/* 追加フォーム */}
      {canAdd && (
        <>
          {isAdding ? (
            <div className="inline-flex items-center gap-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleAddKeyDown}
                placeholder="名前を入力"
                className="h-6 w-32 text-xs"
                autoFocus
                disabled={saving}
              />
              <button
                onClick={handleAddPerson}
                disabled={saving || !newName.trim()}
                className="p-0.5 text-green-600 hover:text-green-700 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => { setIsAdding(false); setNewName('') }}
                disabled={saving}
                className="p-0.5 text-slate-500 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="h-5 px-1.5 text-xs text-slate-400 hover:text-slate-600"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </>
      )}
    </div>
  )
}
