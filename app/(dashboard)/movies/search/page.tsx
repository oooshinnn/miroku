'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MovieSearchForm } from '@/components/movies/MovieSearchForm'
import { MovieSearchResults } from '@/components/movies/MovieSearchResults'
import { useMovies } from '@/hooks/useMovies'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { TMDBMovie } from '@/lib/tmdb/types'

export default function MovieSearchPage() {
  const router = useRouter()
  const { addMovieFromTMDB } = useMovies()
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([])
  const [searching, setSearching] = useState(false)
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSearch = async (query: string) => {
    setSearching(true)
    setError(null)
    setSearchResults([])

    try {
      const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('検索に失敗しました')
      }

      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索に失敗しました')
    } finally {
      setSearching(false)
    }
  }

  const handleSelectMovie = async (movie: TMDBMovie) => {
    setAddingMovieId(movie.id)
    setError(null)
    setSuccess(false)

    try {
      await addMovieFromTMDB(movie)
      setSuccess(true)
      setTimeout(() => {
        router.push('/movies')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '映画の追加に失敗しました')
    } finally {
      setAddingMovieId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">映画を検索</h1>
        <p className="text-slate-600 mt-2">
          映画を検索して、あなたのコレクションに追加しましょう
        </p>
      </div>

      <MovieSearchForm onSearch={handleSearch} loading={searching} />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>映画を追加しました。映画一覧に移動します...</AlertDescription>
        </Alert>
      )}

      {searchResults.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">検索結果</h2>
          <MovieSearchResults
            results={searchResults}
            onSelect={handleSelectMovie}
            addingMovieId={addingMovieId}
          />
        </div>
      )}
    </div>
  )
}
