'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Star, Calendar, Globe, Tag } from 'lucide-react'

const BROWSE_ITEMS = [
  { href: '/browse/scores', label: 'スコア別', icon: Star },
  { href: '/browse/months', label: '視聴月別', icon: Calendar },
  { href: '/browse/countries', label: '制作国別', icon: Globe },
  { href: '/browse/tags', label: 'タグ別', icon: Tag },
]

export function BrowseMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const isActive = pathname.startsWith('/browse')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 transition-colors ${
          isActive ? 'text-slate-900 font-medium' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        絞り込み
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
          {BROWSE_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 transition-colors ${
                pathname.startsWith(href) ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
