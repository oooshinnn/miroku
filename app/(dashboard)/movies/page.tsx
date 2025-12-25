'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MovieList } from '@/components/movies/MovieList'
import { MovieFilter } from '@/components/movies/MovieFilter'
import { UnifiedMovieCard } from '@/components/movies/UnifiedMovieCard'
import { ManualMovieForm } from '@/components/movies/ManualMovieForm'
import { useMovieFilter } from '@/hooks/useMovieFilter'
import { usePersons } from '@/hooks/usePersons'
import { useMovies } from '@/hooks/useMovies'
import type { TMDBMovie } from '@/lib/tmdb/types'

export default function MoviesPage() {
  const router = useRouter()
  const { movies, loading, filters, updateFilters, resetFilters, hasActiveFilters } =
    useMovieFilter()
  const { persons } = usePersons()
  const { addMovieQuick, addMovieManually, getTmdbIdToMovieIdMap, refetch } = useMovies()

  // TMDB検索用の状態
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
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
  }, [])

  const handleAddMovie = async (movie: TMDBMovie) => {
    setAddingMovieId(movie.id)
    setError(null)

    try {
      const newMovie = await addMovieQuick(movie)
      await refetch()
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
      await refetch()
      router.push(`/movies/${newMovie.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '映画の追加に失敗しました')
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
    setShowManualForm(false)
    updateFilters({ title: '' })
  }

  const tmdbIdToMovieIdMap = getTmdbIdToMovieIdMap()
  const isSearchMode = hasSearched || searching

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">映画一覧</h1>

      <MovieFilter
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={() => {
          resetFilters()
          handleClearSearch()
        }}
        hasActiveFilters={hasActiveFilters || isSearchMode}
        persons={persons}
        onSearch={handleSearch}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 検索モード時 */}
      {isSearchMode ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {searching ? (
                '検索中...'
              ) : (
                <>「{searchQuery}」の検索結果: {searchResults.length} 件</>
              )}
            </p>
            <div className="flex gap-2">
              {!searching && searchResults.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  手動で追加
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleClearSearch}>
                検索をクリア
              </Button>
            </div>
          </div>

          {searching ? (
            <div className="text-center py-8 text-slate-600">検索中...</div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 grid-rows-[auto_auto_auto]">
              {searchResults.map((movie) => (
                <UnifiedMovieCard
                  key={movie.id}
                  movie={movie}
                  registeredMovieId={tmdbIdToMovieIdMap.get(movie.id)}
                  isAdding={addingMovieId === movie.id}
                  onAdd={handleAddMovie}
                />
              ))}
            </div>
          ) : !showManualForm ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-slate-600">検索結果がありません</p>
              <Button onClick={() => setShowManualForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                映画を手動で追加
              </Button>
            </div>
          ) : null}

          {showManualForm && (
            <ManualMovieForm
              onSubmit={handleManualAdd}
              onCancel={() => setShowManualForm(false)}
            />
          )}
        </div>
      ) : (
        /* 通常モード（自分の登録済み映画一覧） */
        <>
          {loading ? (
            <div className="text-center py-8 text-slate-600">読み込み中...</div>
          ) : movies.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              {hasActiveFilters
                ? '条件に一致する映画が見つかりません'
                : '映画がまだ登録されていません。検索して映画を追加しましょう。'}
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600">{movies.length} 件の映画</p>
              <MovieList movies={movies} />
            </>
          )}
        </>
      )}
    </div>
  )
}
