export interface TMDBMovie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids: number[]
}

export interface TMDBSearchResponse {
  page: number
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}

export interface TMDBMovieDetails extends TMDBMovie {
  adult: boolean
  budget: number
  genres: { id: number; name: string }[]
  homepage: string | null
  imdb_id: string | null
  production_companies: { id: number; name: string; logo_path: string | null }[]
  production_countries: { iso_3166_1: string; name: string }[]
  revenue: number
  runtime: number | null
  spoken_languages: { english_name: string; iso_639_1: string; name: string }[]
  status: string
  tagline: string | null
}

export interface TMDBCastMember {
  id: number
  cast_id: number
  credit_id: string
  name: string
  display_name?: string  // 日本語名（取得できた場合）
  character: string
  gender: number
  order: number
  profile_path: string | null
}

export interface TMDBCrewMember {
  id: number
  credit_id: string
  name: string
  display_name?: string  // 日本語名（取得できた場合）
  job: string
  department: string
  gender: number
  profile_path: string | null
}

export interface TMDBCredits {
  id: number
  cast: TMDBCastMember[]
  crew: TMDBCrewMember[]
}

export interface TMDBPersonDetails {
  id: number
  name: string
  also_known_as: string[]
  biography: string
  birthday: string | null
  deathday: string | null
  place_of_birth: string | null
  profile_path: string | null
  popularity: number
}
