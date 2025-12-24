'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { MovieSearchForm } from '@/components/movies/MovieSearchForm'
import { MovieSearchResults } from '@/components/movies/MovieSearchResults'
import { ManualMovieForm } from '@/components/movies/ManualMovieForm'
import { useMovies } from '@/hooks/useMovies'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { TMDBMovie } from '@/lib/tmdb/types'

export default function MovieSearchPage() {
  const router = useRouter()
  const { addMovieQuick, addMovieManually, getAddedTmdbIds } = useMovies()
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)

  const handleSearch = async (query: string) => {
    setSearching(true)
    setError(null)
    setSearchResults([])
    setHasSearched(false)
    setShowManualForm(false)

    try {
      const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('検索に失敗しました')
      }

      const data = await response.json()
      setSearchResults(data.results || [])
      setHasSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索に失敗しました')
    } finally {
      setSearching(false)
    }
  }

  const handleSelectMovie = async (movie: TMDBMovie) => {
    setAddingMovieId(movie.id)
    setError(null)

    try {
      // 基本情報のみ保存して即座に遷移（クレジットは詳細ページで取得）
      const newMovie = await addMovieQuick(movie)
      router.push(`/movies/${newMovie.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '映画の追加に失敗しました')
      setAddingMovieId(null)
    }
  }

  const handleManualAdd = async (data: { title: string; releaseDate?: string; director?: string }) => {
    setError(null)

    try {
      const newMovie = await addMovieManually(data)
      router.push(`/movies/${newMovie.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '映画の追加に失敗しました')
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

      {searchResults.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">検索結果</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowManualForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              手動で追加
            </Button>
          </div>
          <MovieSearchResults
            results={searchResults}
            onSelect={handleSelectMovie}
            addingMovieId={addingMovieId}
            addedTmdbIds={getAddedTmdbIds()}
          />
        </div>
      )}

      {hasSearched && searchResults.length === 0 && !showManualForm && (
        <div className="text-center py-8 space-y-4">
          <p className="text-slate-600">検索結果がありません</p>
          <Button onClick={() => setShowManualForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            映画を手動で追加
          </Button>
        </div>
      )}

      {showManualForm && (
        <ManualMovieForm
          onSubmit={handleManualAdd}
          onCancel={() => setShowManualForm(false)}
        />
      )}

      {!hasSearched && !showManualForm && (
        <div className="text-center py-8">
          <p className="text-slate-500 mb-4">
            または、検索せずに手動で追加することもできます
          </p>
          <Button variant="outline" onClick={() => setShowManualForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            手動で追加
          </Button>
        </div>
      )}
    </div>
  )
}
