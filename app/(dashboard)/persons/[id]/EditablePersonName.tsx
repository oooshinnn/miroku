'use client'

import { useState } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface EditablePersonNameProps {
  personId: string
  initialName: string
}

export function EditablePersonName({ personId, initialName }: EditablePersonNameProps) {
  const [name, setName] = useState(initialName)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    if (!editValue.trim() || editValue.trim() === name) {
      setIsEditing(false)
      setEditValue(name)
      return
    }

    setSaving(true)
    try {
      const query = supabase.from('persons')
      const result = await (query as any).update({ display_name: editValue.trim() }).eq('id', personId)
      const { error } = result

      if (error) throw error

      setName(editValue.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update name:', error)
      alert('名前の更新に失敗しました')
      setEditValue(name)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(name)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-2xl font-bold h-10 w-64"
          autoFocus
          disabled={saving}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={saving}
          className="text-green-600 hover:text-green-700"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={saving}
          className="text-slate-500 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2">
      <h1 className="text-3xl font-bold text-slate-900">{name}</h1>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setEditValue(name)
          setIsEditing(true)
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
