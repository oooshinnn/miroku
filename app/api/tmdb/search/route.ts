import { NextRequest, NextResponse } from 'next/server'
import { searchMovies } from '@/lib/tmdb/client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  const page = searchParams.get('page') || '1'

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    )
  }

  try {
    const results = await searchMovies(query, parseInt(page))
    return NextResponse.json(results)
  } catch (error) {
    console.error('TMDB search error:', error)
    return NextResponse.json(
      { error: 'Failed to search movies' },
      { status: 500 }
    )
  }
}
