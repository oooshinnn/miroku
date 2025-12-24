'use client'

import { Badge } from '@/components/ui/badge'
import type { Tag } from '@/types/tag'

interface TagBadgeProps {
  tag: Tag
  onClick?: () => void
}

export function TagBadge({ tag, onClick }: TagBadgeProps) {
  return (
    <Badge
      className="cursor-pointer"
      style={{
        backgroundColor: tag.color || '#64748b',
        color: '#ffffff',
      }}
      onClick={onClick}
    >
      {tag.name}
    </Badge>
  )
}
