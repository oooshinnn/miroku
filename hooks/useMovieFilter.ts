'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Movie } from '@/types/movie'
import type { Tag } from '@/types/tag'

export interface MovieFilters {
  title: string
  tagIds: string[]
  personId: string | null
  yearFrom: number | null
  yearTo: number | null
}

const defaultFilters: MovieFilters = {
  title: '',
  tagIds: [],
  personId: null,
  yearFrom: null,
  yearTo: null,
}

export function useMovieFilter() {
  const [filters, setFilters] = useState<MovieFilters>(defaultFilters)
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchFilteredMovies = async () => {
    setLoading(true)

    try {
      // Base query
      let query = supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false })

      // Title filter
      if (filters.title.trim()) {
        const searchTerm = `%${filters.title.trim()}%`
        query = query.or(`tmdb_title.ilike.${searchTerm},custom_title.ilike.${searchTerm}`)
      }

      // Year filter
      if (filters.yearFrom !== null) {
        const yearStart = `${filters.yearFrom}-01-01`
        query = query.or(`tmdb_release_date.gte.${yearStart},custom_release_date.gte.${yearStart}`)
      }
      if (filters.yearTo !== null) {
        const yearEnd = `${filters.yearTo}-12-31`
        query = query.or(`tmdb_release_date.lte.${yearEnd},custom_release_date.lte.${yearEnd}`)
      }

      const { data: allMovies, error } = (await query) as { data: Movie[] | null; error: any }

      if (error) {
        console.error('Failed to fetch movies:', error)
        setMovies([])
        setLoading(false)
        return
      }

      let filteredMovies: Movie[] = allMovies || []

      // Tag filter - need to fetch movie_tags separately
      if (filters.tagIds.length > 0) {
        const { data: movieTags } = (await supabase
          .from('movie_tags')
          .select('movie_id, tag_id')
          .in('tag_id', filters.tagIds)) as { data: { movie_id: string; tag_id: string }[] | null }

        if (movieTags) {
          const movieIdsWithTags = new Set(movieTags.map(mt => mt.movie_id))
          filteredMovies = filteredMovies.filter(m => movieIdsWithTags.has(m.id))
        }
      }

      // Person filter - need to fetch movie_persons separately
      if (filters.personId) {
        const { data: moviePersons } = (await supabase
          .from('movie_persons')
          .select('movie_id')
          .eq('person_id', filters.personId)) as { data: { movie_id: string }[] | null }

        if (moviePersons) {
          const movieIdsWithPerson = new Set(moviePersons.map(mp => mp.movie_id))
          filteredMovies = filteredMovies.filter(m => movieIdsWithPerson.has(m.id))
        }
      }

      setMovies(filteredMovies)
    } catch (error) {
      console.error('Failed to fetch movies:', error)
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFilteredMovies()
  }, [filters])

  const updateFilters = (newFilters: Partial<MovieFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
  }

  const hasActiveFilters = useMemo(() => {
    return (
      filters.title.trim() !== '' ||
      filters.tagIds.length > 0 ||
      filters.personId !== null ||
      filters.yearFrom !== null ||
      filters.yearTo !== null
    )
  }, [filters])

  return {
    movies,
    loading,
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    refetch: fetchFilteredMovies,
  }
}
