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

  // 高速追加: 基本情報のみでDBに保存（API呼び出しなし）
  const addMovieQuick = async (tmdbMovie: TMDBMovie): Promise<Movie> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('ユーザーがログインしていません')
    }

    // 検索結果の基本情報だけで映画を挿入
    const movieData: MovieInsert = {
      user_id: user.id,
      tmdb_movie_id: tmdbMovie.id,
      tmdb_title: tmdbMovie.title,
      tmdb_poster_path: tmdbMovie.poster_path,
      tmdb_release_date: tmdbMovie.release_date || null,
    }

    const { data: newMovie, error: movieError } = (await supabase
      .from('movies')
      .insert(movieData as any)
      .select()
      .single()) as { data: Movie | null; error: any }

    if (movieError || !newMovie) {
      throw movieError || new Error('Failed to create movie')
    }

    await fetchMovies()
    return newMovie
  }

  // クレジット情報を後から取得・保存
  const fetchAndSaveCredits = async (movieId: string, tmdbMovieId: number): Promise<void> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // 既にクレジット情報があるか確認
    const { data: existingPersons } = await supabase
      .from('movie_persons')
      .select('id')
      .eq('movie_id', movieId)
      .limit(1)

    if (existingPersons && existingPersons.length > 0) {
      return // 既にクレジット情報がある
    }

    // TMDB APIから詳細とクレジット情報を取得
    const response = await fetch(`/api/tmdb/movie/${tmdbMovieId}`)
    if (!response.ok) return

    const { details, credits }: { details: TMDBMovieDetails; credits: TMDBCredits } = await response.json()

    // 製作国を更新
    if (details.production_countries?.length > 0) {
      const query = supabase.from('movies')
      // @ts-expect-error - Supabase type inference issue with update
      await query.update({ tmdb_production_countries: details.production_countries.map(c => c.name) }).eq('id', movieId)
    }

    // 監督を保存
    const directors = credits.crew.filter(c => c.job === 'Director')
    for (const director of directors) {
      const displayName = director.display_name || director.name

      const { data: person } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_person_id', director.id)
        .maybeSingle() as { data: Person | null }

      let personId: string

      if (person) {
        personId = person.id
        // 既存の人物にprofile_pathがなければ更新
        if (!person.tmdb_profile_path && director.profile_path) {
          const pQuery = supabase.from('persons')
          // @ts-expect-error - Supabase type inference issue with update
          await pQuery.update({ tmdb_profile_path: director.profile_path }).eq('id', person.id)
        }
      } else {
        const personData: PersonInsert = {
          user_id: user.id,
          tmdb_person_id: director.id,
          tmdb_profile_path: director.profile_path,
          display_name: displayName,
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
        movie_id: movieId,
        person_id: personId,
        role: 'director',
      }

      await supabase.from('movie_persons').insert(moviePersonData as any)
    }

    // 脚本家を保存
    const writers = credits.crew.filter(c => c.job === 'Writer' || c.job === 'Screenplay')
    for (const writer of writers.slice(0, 5)) {
      const displayName = writer.display_name || writer.name

      const { data: person } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_person_id', writer.id)
        .maybeSingle() as { data: Person | null }

      let personId: string

      if (person) {
        personId = person.id
        // 既存の人物にprofile_pathがなければ更新
        if (!person.tmdb_profile_path && writer.profile_path) {
          const pQuery = supabase.from('persons')
          // @ts-expect-error - Supabase type inference issue with update
          await pQuery.update({ tmdb_profile_path: writer.profile_path }).eq('id', person.id)
        }
      } else {
        const personData: PersonInsert = {
          user_id: user.id,
          tmdb_person_id: writer.id,
          tmdb_profile_path: writer.profile_path,
          display_name: displayName,
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
        movie_id: movieId,
        person_id: personId,
        role: 'writer',
      }

      await supabase.from('movie_persons').insert(moviePersonData as any)
    }

    // 主演を保存（上位3名）
    for (const cast of credits.cast.slice(0, 3)) {
      const displayName = cast.display_name || cast.name

      const { data: person } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_person_id', cast.id)
        .maybeSingle() as { data: Person | null }

      let personId: string

      if (person) {
        personId = person.id
        // 既存の人物にprofile_pathがなければ更新
        if (!person.tmdb_profile_path && cast.profile_path) {
          const pQuery = supabase.from('persons')
          // @ts-expect-error - Supabase type inference issue with update
          await pQuery.update({ tmdb_profile_path: cast.profile_path }).eq('id', person.id)
        }
      } else {
        const personData: PersonInsert = {
          user_id: user.id,
          tmdb_person_id: cast.id,
          tmdb_profile_path: cast.profile_path,
          display_name: displayName,
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
        movie_id: movieId,
        person_id: personId,
        role: 'cast',
        cast_order: cast.order,
      }

      await supabase.from('movie_persons').insert(moviePersonData as any)
    }
  }

  // 従来の追加関数（互換性のために残す）
  const addMovieFromTMDB = async (tmdbMovie: TMDBMovie) => {
    const movie = await addMovieQuick(tmdbMovie)
    await fetchAndSaveCredits(movie.id, tmdbMovie.id)
    return movie
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

  interface ManualMovieData {
    title: string
    releaseDate?: string
    posterUrl?: string
    productionCountries?: string[]
    director?: string
  }

  const addMovieManually = async (data: ManualMovieData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('ユーザーがログインしていません')
    }

    // 映画を挿入（カスタムデータとして保存）
    const movieData: MovieInsert = {
      user_id: user.id,
      custom_title: data.title,
      custom_release_date: data.releaseDate || null,
      custom_poster_url: data.posterUrl || null,
      custom_production_countries: data.productionCountries || null,
    }

    const { data: newMovie, error: movieError } = (await supabase
      .from('movies')
      .insert(movieData as any)
      .select()
      .single()) as { data: Movie | null; error: any }

    if (movieError || !newMovie) {
      throw movieError || new Error('映画の作成に失敗しました')
    }

    // 監督を保存（入力があれば）
    if (data.director?.trim()) {
      const directorName = data.director.trim()

      // 既存の人物を検索
      const { data: existingPerson } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .eq('display_name', directorName)
        .is('merged_into_id', null)
        .maybeSingle() as { data: Person | null }

      let personId: string

      if (existingPerson) {
        personId = existingPerson.id
      } else {
        const personData: PersonInsert = {
          user_id: user.id,
          display_name: directorName,
        }

        const { data: newPerson, error: personError } = (await supabase
          .from('persons')
          .insert(personData as any)
          .select()
          .single()) as { data: Person | null; error: any }

        if (personError || !newPerson) {
          throw personError || new Error('監督の作成に失敗しました')
        }
        personId = newPerson.id
      }

      const moviePersonData: MoviePersonInsert = {
        movie_id: newMovie.id,
        person_id: personId,
        role: 'director',
      }

      await supabase.from('movie_persons').insert(moviePersonData as any)
    }

    await fetchMovies()
    return newMovie
  }

  // 追加済みのTMDB映画IDセットを取得
  const getAddedTmdbIds = (): Set<number> => {
    const ids = new Set<number>()
    movies.forEach((movie) => {
      if (movie.tmdb_movie_id) {
        ids.add(movie.tmdb_movie_id)
      }
    })
    return ids
  }

  // TMDB IDから映画IDへのマップを取得
  const getTmdbIdToMovieIdMap = (): Map<number, string> => {
    const map = new Map<number, string>()
    movies.forEach((movie) => {
      if (movie.tmdb_movie_id) {
        map.set(movie.tmdb_movie_id, movie.id)
      }
    })
    return map
  }

  return {
    movies,
    loading,
    addMovieFromTMDB,
    addMovieQuick,
    fetchAndSaveCredits,
    addMovieManually,
    getMovieTags,
    addTagToMovie,
    removeTagFromMovie,
    getAddedTmdbIds,
    getTmdbIdToMovieIdMap,
    refetch: fetchMovies,
  }
}
