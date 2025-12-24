'use client'

import { useState } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

interface PersonData {
  id: string
  personId: string
  displayName: string
}

interface EditablePersonListProps {
  persons: PersonData[]
  maxDisplay?: number
}

export function EditablePersonList({ persons, maxDisplay }: EditablePersonListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [personList, setPersonList] = useState(persons)
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

  if (personList.length === 0) {
    return <span className="text-slate-500">-</span>
  }

  return (
    <div className="space-y-1">
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
      {remainingCount > 0 && (
        <p className="text-slate-500 text-sm">他 {remainingCount} 名</p>
      )}
    </div>
  )
}
