import type { TMDBSearchResponse, TMDBMovieDetails, TMDBCredits, TMDBPersonDetails } from './types'

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

export async function getPersonDetails(personId: number): Promise<TMDBPersonDetails> {
  const isReadAccessToken = TMDB_API_KEY!.startsWith('eyJ')

  let url: string
  let headers: Record<string, string>

  if (isReadAccessToken) {
    url = `${TMDB_BASE_URL}/person/${personId}?language=ja-JP`
    headers = {
      Authorization: `Bearer ${TMDB_API_KEY}`,
      'Content-Type': 'application/json',
    }
  } else {
    url = `${TMDB_BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=ja-JP`
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

// 日本語名を抽出するヘルパー関数
// also_known_as から日本語（ひらがな、カタカナ、漢字）を含む名前を探す
export function extractJapaneseName(personDetails: TMDBPersonDetails): string {
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/

  for (const altName of personDetails.also_known_as) {
    if (japaneseRegex.test(altName)) {
      return altName
    }
  }

  // 日本語名が見つからない場合は元の名前を返す
  return personDetails.name
}

// 複数の人物の日本語名を一括取得
export async function getPersonsJapaneseNames(personIds: number[]): Promise<Map<number, string>> {
  const nameMap = new Map<number, string>()

  // 並列で取得（最大10件ずつ）
  const batchSize = 10
  for (let i = 0; i < personIds.length; i += batchSize) {
    const batch = personIds.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(id => getPersonDetails(id))
    )

    results.forEach((result, index) => {
      const personId = batch[index]
      if (result.status === 'fulfilled') {
        nameMap.set(personId, extractJapaneseName(result.value))
      }
    })
  }

  return nameMap
}
