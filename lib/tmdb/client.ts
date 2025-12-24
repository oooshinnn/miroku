import type { TMDBSearchResponse, TMDBMovieDetails, TMDBCredits } from './types'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY is not defined in environment variables')
}

export async function searchMovies(query: string, page: number = 1): Promise<TMDBSearchResponse> {
  // API KeyとRead Access Tokenの両方に対応
  const isReadAccessToken = TMDB_API_KEY!.startsWith('eyJ')

  let url: string
  let headers: Record<string, string>

  if (isReadAccessToken) {
    // Read Access Token (v4) を使用
    url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=ja-JP&page=${page}`
    headers = {
      Authorization: `Bearer ${TMDB_API_KEY}`,
      'Content-Type': 'application/json',
    }
  } else {
    // API Key (v3) を使用
    url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ja-JP&page=${page}`
    headers = {
      'Content-Type': 'application/json',
    }
  }

  const response = await fetch(url, {
    headers,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`)
  }

  return response.json()
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  const isReadAccessToken = TMDB_API_KEY!.startsWith('eyJ')

  let url: string
  let headers: Record<string, string>

  if (isReadAccessToken) {
    url = `${TMDB_BASE_URL}/movie/${movieId}?language=ja-JP`
    headers = {
      Authorization: `Bearer ${TMDB_API_KEY}`,
      'Content-Type': 'application/json',
    }
  } else {
    url = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=ja-JP`
    headers = {
      'Content-Type': 'application/json',
    }
  }

  const response = await fetch(url, {
    headers,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`)
  }

  return response.json()
}

export async function getMovieCredits(movieId: number): Promise<TMDBCredits> {
  const isReadAccessToken = TMDB_API_KEY!.startsWith('eyJ')

  let url: string
  let headers: Record<string, string>

  if (isReadAccessToken) {
    url = `${TMDB_BASE_URL}/movie/${movieId}/credits?language=ja-JP`
    headers = {
      Authorization: `Bearer ${TMDB_API_KEY}`,
      'Content-Type': 'application/json',
    }
  } else {
    url = `${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=ja-JP`
    headers = {
      'Content-Type': 'application/json',
    }
  }

  const response = await fetch(url, {
    headers,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`)
  }

  return response.json()
}
