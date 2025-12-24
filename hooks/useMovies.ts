'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Movie, MovieInsert, Person, PersonInsert, MoviePersonInsert } from '@/types/movie'
import type { Tag } from '@/types/tag'
import type { TMDBMovie, TMDBMovieDetails, TMDBCredits } from '@/lib/tmdb/types'

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchMovies = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setMovies(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMovies()
  }, [])

  const addMovieFromTMDB = async (tmdbMovie: TMDBMovie) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('ユーザーがログインしていません')
    }

    // 映画詳細とクレジット情報を取得
    const response = await fetch(`/api/tmdb/movie/${tmdbMovie.id}`)
    if (!response.ok) {
      throw new Error('映画詳細の取得に失敗しました')
    }

    const { details, credits }: { details: TMDBMovieDetails; credits: TMDBCredits } = await response.json()

    // 映画を挿入
    const movieData: MovieInsert = {
      user_id: user.id,
      tmdb_movie_id: details.id,
      tmdb_title: details.title,
      tmdb_poster_path: details.poster_path,
      tmdb_release_date: details.release_date || null,
      tmdb_production_countries: details.production_countries.map(c => c.name),
    }

    const { data: newMovie, error: movieError } = (await supabase
      .from('movies')
      .insert(movieData as any)
      .select()
      .single()) as { data: Movie | null; error: any }

    if (movieError || !newMovie) {
      throw movieError || new Error('Failed to create movie')
    }

    // 監督を保存
    const directors = credits.crew.filter(c => c.job === 'Director')
    for (const director of directors) {
      const { data: person } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_person_id', director.id)
        .eq('display_name', director.name)
        .maybeSingle() as { data: Person | null }

      let personId: string

      if (person) {
        personId = person.id
      } else {
        const personData: PersonInsert = {
          user_id: user.id,
          tmdb_person_id: director.id,
          display_name: director.name,
        }

        const { data: newPerson, error: personError } = (await supabase
          .from('persons')
          .insert(personData as any)
          .select()
          .single()) as { data: Person | null; error: any }

        if (personError || !newPerson) continue
        personId = newPerson.id
      }

      const moviePersonData: MoviePersonInsert = {
        movie_id: newMovie.id,
        person_id: personId,
        role: 'director',
      }

      await supabase.from('movie_persons').insert(moviePersonData as any)
    }

    // 脚本家を保存
    const writers = credits.crew.filter(c => c.job === 'Writer' || c.job === 'Screenplay')
    for (const writer of writers.slice(0, 5)) {
      const { data: person } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_person_id', writer.id)
        .eq('display_name', writer.name)
        .maybeSingle() as { data: Person | null }

      let personId: string

      if (person) {
        personId = person.id
      } else {
        const personData: PersonInsert = {
          user_id: user.id,
          tmdb_person_id: writer.id,
          display_name: writer.name,
        }

        const { data: newPerson, error: personError } = (await supabase
          .from('persons')
          .insert(personData as any)
          .select()
          .single()) as { data: Person | null; error: any }

        if (personError || !newPerson) continue
        personId = newPerson.id
      }

      const moviePersonData: MoviePersonInsert = {
        movie_id: newMovie.id,
        person_id: personId,
        role: 'writer',
      }

      await supabase.from('movie_persons').insert(moviePersonData as any)
    }

    // キャストを保存（上位20名）
    for (const cast of credits.cast.slice(0, 20)) {
      const { data: person } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_person_id', cast.id)
        .eq('display_name', cast.name)
        .maybeSingle() as { data: Person | null }

      let personId: string

      if (person) {
        personId = person.id
      } else {
        const personData: PersonInsert = {
          user_id: user.id,
          tmdb_person_id: cast.id,
          display_name: cast.name,
        }

        const { data: newPerson, error: personError } = (await supabase
          .from('persons')
          .insert(personData as any)
          .select()
          .single()) as { data: Person | null; error: any }

        if (personError || !newPerson) continue
        personId = newPerson.id
      }

      const moviePersonData: MoviePersonInsert = {
        movie_id: newMovie.id,
        person_id: personId,
        role: 'cast',
        cast_order: cast.order,
      }

      await supabase.from('movie_persons').insert(moviePersonData as any)
    }

    await fetchMovies()
    return newMovie
  }

  const getMovieTags = async (movieId: string): Promise<Tag[]> => {
    const { data, error } = await supabase
      .from('movie_tags')
      .select('tag:tags(*)')
      .eq('movie_id', movieId)

    if (error || !data) {
      return []
    }

    return data.map((item: any) => item.tag).filter(Boolean)
  }

  const addTagToMovie = async (movieId: string, tagId: string) => {
    const { error } = await supabase
      .from('movie_tags')
      .insert({ movie_id: movieId, tag_id: tagId } as any)

    if (error) {
      throw error
    }
  }

  const removeTagFromMovie = async (movieId: string, tagId: string) => {
    const { error } = await supabase
      .from('movie_tags')
      .delete()
      .eq('movie_id', movieId)
      .eq('tag_id', tagId)

    if (error) {
      throw error
    }
  }

  return {
    movies,
    loading,
    addMovieFromTMDB,
    getMovieTags,
    addTagToMovie,
    removeTagFromMovie,
    refetch: fetchMovies,
  }
}
