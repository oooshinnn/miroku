import { NextRequest, NextResponse } from 'next/server'
import { getMovieDetails, getMovieCredits } from '@/lib/tmdb/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const movieId = parseInt(id)

  if (isNaN(movieId)) {
    return NextResponse.json(
      { error: 'Invalid movie ID' },
      { status: 400 }
    )
  }

  try {
    const [details, credits] = await Promise.all([
      getMovieDetails(movieId),
      getMovieCredits(movieId),
    ])

    return NextResponse.json({ details, credits })
  } catch (error) {
    console.error('TMDB movie details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    )
  }
}
