'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MovieRefreshDialog } from '@/components/movies/MovieRefreshDialog'

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

  const handleRefreshComplete = () => {
    // router.refresh()だけではサーバーコンポーネントのデータが更新されない場合があるため、
    // フルリロードを行う
    window.location.reload()
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
    </div>
  )
}
