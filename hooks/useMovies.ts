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

  // 高速追加: 基本情報でDBに保存（オプションでクレジットも保存）
  const addMovieQuick = async (
    tmdbMovie: TMDBMovie,
    options?: { details?: TMDBMovieDetails; credits?: TMDBCredits }
  ): Promise<Movie> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('ユーザーがログインしていません')
    }

    // 検索結果の基本情報で映画を挿入（製作国があれば含める）
    // tmdb_overviewはスキーマキャッシュに反映されていないため一時的に除外
    const movieData: MovieInsert = {
      user_id: user.id,
      tmdb_movie_id: tmdbMovie.id,
      tmdb_title: tmdbMovie.title,
      tmdb_poster_path: tmdbMovie.poster_path,
      tmdb_release_date: tmdbMovie.release_date || null,
    }

    // 詳細情報から製作国を追加
    if (options?.details?.production_countries?.length) {
      (movieData as any).tmdb_production_countries = options.details.production_countries.map(c => c.name)
    }

    const { data: newMovie, error: movieError } = (await supabase
      .from('movies')
      .insert(movieData as any)
      .select()
      .single()) as { data: Movie | null; error: any }

    if (movieError || !newMovie) {
      throw movieError || new Error('Failed to create movie')
    }

    // クレジット情報があれば保存
    if (options?.credits) {
      await saveCreditsForMovie(newMovie.id, user.id, options.credits)
    }

    await fetchMovies()
    return newMovie
  }

  // クレジット情報を保存するヘルパー関数
  const saveCreditsForMovie = async (movieId: string, userId: string, credits: TMDBCredits) => {
    const allDirectors = credits.crew?.filter(c => c.job === 'Director') || []
    const allWriters = (credits.crew?.filter(c => c.job === 'Writer' || c.job === 'Screenplay') || []).slice(0, 5)
    const allCast = (credits.cast || []).slice(0, 5)

    // 監督を保存
    for (const director of allDirectors) {
      const personId = await findOrCreatePerson(userId, director.id, director.name)
      if (personId) {
        const { error } = await supabase.from('movie_persons').insert({
          movie_id: movieId,
          person_id: personId,
          role: 'director',
        } as any)
        if (error) console.error('Error saving director:', error)
      }
    }

    // 脚本家を保存
    for (const writer of allWriters) {
      const personId = await findOrCreatePerson(userId, writer.id, writer.name)
      if (personId) {
        await supabase.from('movie_persons').insert({
          movie_id: movieId,
          person_id: personId,
          role: 'writer',
        } as any)
      }
    }

    // キャストを保存
    for (const castMember of allCast) {
      const personId = await findOrCreatePerson(userId, castMember.id, castMember.name)
      if (personId) {
        await supabase.from('movie_persons').insert({
          movie_id: movieId,
          person_id: personId,
          role: 'cast',
          cast_order: castMember.order,
        } as any)
      }
    }
  }

  // 人物を検索または作成
  const findOrCreatePerson = async (
    userId: string,
    tmdbPersonId: number,
    displayName: string
  ): Promise<string | null> => {
    const { data: person } = await supabase
      .from('persons')
      .select('*')
      .eq('user_id', userId)
      .eq('tmdb_person_id', tmdbPersonId)
      .maybeSingle() as { data: Person | null }

    if (person) {
      return person.id
    }

    // tmdb_profile_pathはスキーマキャッシュに反映されていないため一時的に除外
    const personData: Omit<PersonInsert, 'tmdb_profile_path'> = {
      user_id: userId,
      tmdb_person_id: tmdbPersonId,
      display_name: displayName,
    }

    const { data: newPerson, error } = await supabase
      .from('persons')
      .insert(personData as any)
      .select()
      .single() as { data: Person | null; error: any }

    if (error || !newPerson) {
      return null
    }
    return newPerson.id
  }

  // クレジット情報を後から取得・保存
  // 戻り値: true=保存成功, false=クレジット情報が空, undefined=既に存在
  const fetchAndSaveCredits = async (movieId: string, tmdbMovieId: number): Promise<boolean | undefined> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return undefined

    // 既にクレジット情報があるか確認
    const { data: existingPersons } = await supabase
      .from('movie_persons')
      .select('id')
      .eq('movie_id', movieId)
      .limit(1)

    if (existingPersons && existingPersons.length > 0) {
      return undefined // 既にクレジット情報がある
    }

    // TMDB APIから詳細とクレジット情報を取得
    const response = await fetch(`/api/tmdb/movie/${tmdbMovieId}`)
    if (!response.ok) return false

    const { details, credits }: { details: TMDBMovieDetails; credits: TMDBCredits } = await response.json()

    // 製作国を更新
    if (details.production_countries?.length > 0) {
      const query = supabase.from('movies')
      // @ts-expect-error - Supabase type inference issue with update
      await query.update({ tmdb_production_countries: details.production_countries.map(c => c.name) }).eq('id', movieId)
    }

    // クレジット情報が空かチェック
    const allDirectors = credits.crew.filter(c => c.job === 'Director')
    const allWriters = credits.crew.filter(c => c.job === 'Writer' || c.job === 'Screenplay')
    const allCast = credits.cast.slice(0, 5)

    if (allDirectors.length === 0 && allWriters.length === 0 && allCast.length === 0) {
      return false // クレジット情報が空
    }

    // 監督を保存
    for (const director of allDirectors) {
      const displayName = director.name

      const { data: person } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_person_id', director.id)
        .maybeSingle() as { data: Person | null }

      let personId: string

      if (person) {
        personId = person.id
        // tmdb_profile_pathの更新はスキーマキャッシュ問題のため一時的にスキップ
      } else {
        // tmdb_profile_pathはスキーマキャッシュに反映されていないため除外
        const personData = {
          user_id: user.id,
          tmdb_person_id: director.id,
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
    for (const writer of allWriters.slice(0, 5)) {
      const displayName = writer.name

      const { data: person } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_person_id', writer.id)
        .maybeSingle() as { data: Person | null }

      let personId: string

      if (person) {
        personId = person.id
        // tmdb_profile_pathの更新はスキーマキャッシュ問題のため一時的にスキップ
      } else {
        // tmdb_profile_pathはスキーマキャッシュに反映されていないため除外
        const personData = {
          user_id: user.id,
          tmdb_person_id: writer.id,
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

    // 主演を保存（上位5名）
    for (const castMember of allCast) {
      const displayName = castMember.name

      const { data: person } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_person_id', castMember.id)
        .maybeSingle() as { data: Person | null }

      let personId: string

      if (person) {
        personId = person.id
        // tmdb_profile_pathの更新はスキーマキャッシュ問題のため一時的にスキップ
      } else {
        // tmdb_profile_pathはスキーマキャッシュに反映されていないため除外
        const personData = {
          user_id: user.id,
          tmdb_person_id: castMember.id,
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
        cast_order: castMember.order,
      }

      await supabase.from('movie_persons').insert(moviePersonData as any)
    }

    return true // クレジット情報を保存した
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
