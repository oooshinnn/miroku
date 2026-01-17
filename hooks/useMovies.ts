'use client'

import useSWR, { mutate } from 'swr'
import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Movie, MovieInsert, Person, PersonInsert, MoviePersonInsert } from '@/types/movie'
import type { Tag } from '@/types/tag'
import type { TMDBMovie, TMDBMovieDetails, TMDBCredits } from '@/lib/tmdb/types'

// movie_tags テーブルのインサート型
interface MovieTagInsert {
  movie_id: string
  tag_id: string
}

// movie_tags から tag を結合した結果の型
interface MovieTagWithTag {
  tag: Tag | null
}

// SWR キャッシュキー
const MOVIES_CACHE_KEY = 'movies'

// 映画一覧を取得する fetcher
const fetchMovies = async (): Promise<Movie[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// キャッシュを無効化して再取得
export const invalidateMoviesCache = () => {
  mutate(MOVIES_CACHE_KEY)
}

export function useMovies() {
  const supabase = createClient()

  // SWR でデータ取得（キャッシュあり）
  const { data: movies = [], isLoading: loading, mutate: mutateMovies } = useSWR<Movie[]>(
    MOVIES_CACHE_KEY,
    fetchMovies,
    {
      revalidateOnFocus: false, // フォーカス時の自動再取得を無効化
      revalidateOnReconnect: false, // 再接続時の自動再取得を無効化
      dedupingInterval: 60000, // 1分間は同じリクエストを重複排除
    }
  )

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
    const movieData: MovieInsert = {
      user_id: user.id,
      tmdb_movie_id: tmdbMovie.id,
      tmdb_title: tmdbMovie.title,
      tmdb_poster_path: tmdbMovie.poster_path,
      tmdb_release_date: tmdbMovie.release_date || null,
    }

    // 詳細情報から製作国を追加
    if (options?.details?.production_countries?.length) {
      (movieData as MovieInsert & { tmdb_production_countries?: string[] }).tmdb_production_countries = options.details.production_countries.map(c => c.name)
    }

    const { data: newMovie, error: movieError } = (await supabase
      .from('movies')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
      .insert(movieData as any)
      .select()
      .single()) as { data: Movie | null; error: PostgrestError | null }

    if (movieError || !newMovie) {
      throw movieError || new Error('Failed to create movie')
    }

    // クレジット情報があれば保存
    if (options?.credits) {
      await saveCreditsForMovie(newMovie.id, user.id, options.credits)
    }

    // キャッシュを更新（楽観的更新）
    mutateMovies([newMovie, ...movies], false)

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
        const moviePersonData: MoviePersonInsert = {
          movie_id: movieId,
          person_id: personId,
          role: 'director',
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
        await supabase.from('movie_persons').insert(moviePersonData as any)
      }
    }

    // 脚本家を保存
    for (const writer of allWriters) {
      const personId = await findOrCreatePerson(userId, writer.id, writer.name)
      if (personId) {
        const moviePersonData: MoviePersonInsert = {
          movie_id: movieId,
          person_id: personId,
          role: 'writer',
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
        await supabase.from('movie_persons').insert(moviePersonData as any)
      }
    }

    // キャストを保存
    for (const castMember of allCast) {
      const personId = await findOrCreatePerson(userId, castMember.id, castMember.name)
      if (personId) {
        const moviePersonData: MoviePersonInsert = {
          movie_id: movieId,
          person_id: personId,
          role: 'cast',
          cast_order: castMember.order,
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
        await supabase.from('movie_persons').insert(moviePersonData as any)
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

    const personData: Omit<PersonInsert, 'tmdb_profile_path'> = {
      user_id: userId,
      tmdb_person_id: tmdbPersonId,
      display_name: displayName,
    }

    const { data: newPerson, error } = await supabase
      .from('persons')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
      .insert(personData as any)
      .select()
      .single() as { data: Person | null; error: PostgrestError | null }

    if (error || !newPerson) {
      return null
    }
    return newPerson.id
  }

  // クレジット情報を後から取得・保存
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
      return undefined
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
      return false
    }

    // 監督を保存
    for (const director of allDirectors) {
      const { data: person } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_person_id', director.id)
        .maybeSingle() as { data: Person | null }

      let personId: string

      if (person) {
        personId = person.id
      } else {
        const personData = {
          user_id: user.id,
          tmdb_person_id: director.id,
          display_name: director.name,
        }

        const { data: newPerson, error: personError } = (await supabase
          .from('persons')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
          .insert(personData as any)
          .select()
          .single()) as { data: Person | null; error: PostgrestError | null }

        if (personError || !newPerson) continue
        personId = newPerson.id
      }

      const moviePersonData: MoviePersonInsert = {
        movie_id: movieId,
        person_id: personId,
        role: 'director',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
      await supabase.from('movie_persons').insert(moviePersonData as any)
    }

    // 脚本家を保存
    for (const writer of allWriters.slice(0, 5)) {
      const { data: person } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_person_id', writer.id)
        .maybeSingle() as { data: Person | null }

      let personId: string

      if (person) {
        personId = person.id
      } else {
        const personData = {
          user_id: user.id,
          tmdb_person_id: writer.id,
          display_name: writer.name,
        }

        const { data: newPerson, error: personError } = (await supabase
          .from('persons')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
          .insert(personData as any)
          .select()
          .single()) as { data: Person | null; error: PostgrestError | null }

        if (personError || !newPerson) continue
        personId = newPerson.id
      }

      const moviePersonData: MoviePersonInsert = {
        movie_id: movieId,
        person_id: personId,
        role: 'writer',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
      await supabase.from('movie_persons').insert(moviePersonData as any)
    }

    // 主演を保存（上位5名）
    for (const castMember of allCast) {
      const { data: person } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_person_id', castMember.id)
        .maybeSingle() as { data: Person | null }

      let personId: string

      if (person) {
        personId = person.id
      } else {
        const personData = {
          user_id: user.id,
          tmdb_person_id: castMember.id,
          display_name: castMember.name,
        }

        const { data: newPerson, error: personError } = (await supabase
          .from('persons')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
          .insert(personData as any)
          .select()
          .single()) as { data: Person | null; error: PostgrestError | null }

        if (personError || !newPerson) continue
        personId = newPerson.id
      }

      const moviePersonData: MoviePersonInsert = {
        movie_id: movieId,
        person_id: personId,
        role: 'cast',
        cast_order: castMember.order,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
      await supabase.from('movie_persons').insert(moviePersonData as any)
    }

    return true
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

    return data.map((item: MovieTagWithTag) => item.tag).filter((tag): tag is Tag => tag !== null)
  }

  const addTagToMovie = async (movieId: string, tagId: string) => {
    const movieTagData: MovieTagInsert = { movie_id: movieId, tag_id: tagId }
    const { error } = await supabase
      .from('movie_tags')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
      .insert(movieTagData as any)

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

    const movieData: MovieInsert = {
      user_id: user.id,
      custom_title: data.title,
      custom_release_date: data.releaseDate || null,
      custom_poster_url: data.posterUrl || null,
      custom_production_countries: data.productionCountries || null,
    }

    const { data: newMovie, error: movieError } = (await supabase
      .from('movies')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
      .insert(movieData as any)
      .select()
      .single()) as { data: Movie | null; error: PostgrestError | null }

    if (movieError || !newMovie) {
      throw movieError || new Error('映画の作成に失敗しました')
    }

    // 監督を保存（入力があれば）
    if (data.director?.trim()) {
      const directorName = data.director.trim()

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
          .insert(personData as any)
          .select()
          .single()) as { data: Person | null; error: PostgrestError | null }

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase型推論の問題を回避
      await supabase.from('movie_persons').insert(moviePersonData as any)
    }

    // キャッシュを更新（楽観的更新）
    mutateMovies([newMovie, ...movies], false)
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
    refetch: () => mutateMovies(), // キャッシュを無効化して再取得
  }
}
