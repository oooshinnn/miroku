'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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
import { MovieRefreshDialog } from '@/components/movies/MovieRefreshDialog'
import { createClient } from '@/lib/supabase/client'

interface PersonData {
  id: string
  personId: string
  name: string
  tmdbId: number | null
}

interface CastPersonData extends PersonData {
  order: number
}

interface MovieActionsProps {
  movieId: string
  tmdbMovieId: number | null
  currentData: {
    title: string | null
    releaseDate: string | null
    productionCountries: string[]
    posterPath: string | null
    directors: PersonData[]
    writers: PersonData[]
    cast: CastPersonData[]
  }
}

export function MovieActions({ movieId, tmdbMovieId, currentData }: MovieActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleRefreshComplete = () => {
    window.location.reload()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', movieId)

      if (error) {
        console.error('Failed to delete movie:', error)
        alert('映画の削除に失敗しました')
        return
      }

      router.push('/movies')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete movie:', error)
      alert('映画の削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {tmdbMovieId && (
        <MovieRefreshDialog
          movieId={movieId}
          tmdbMovieId={tmdbMovieId}
          currentData={currentData}
          onRefreshComplete={handleRefreshComplete}
        />
      )}
      <Link href={`/movies/${movieId}/edit`}>
        <Button variant="outline">編集</Button>
      </Link>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">削除</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>映画を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。映画に関連する視聴ログやタグも一緒に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? '削除中...' : '削除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
