import { NextRequest, NextResponse } from 'next/server'
import { getMovieDetails, getMovieCredits, getPersonsJapaneseNames } from '@/lib/tmdb/client'

export async function GET(
  _request: NextRequest,
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

    // 監督、脚本家、主演（上位3名）の人物IDを収集
    const directors = credits.crew.filter(c => c.job === 'Director')
    const writers = credits.crew.filter(c => c.job === 'Writer' || c.job === 'Screenplay').slice(0, 5)
    const topCast = credits.cast.slice(0, 3)

    const personIds = [
      ...directors.map(d => d.id),
      ...writers.map(w => w.id),
      ...topCast.map(c => c.id),
    ]
    const uniquePersonIds = [...new Set(personIds)]

    // 日本語名を取得
    const japaneseNames = await getPersonsJapaneseNames(uniquePersonIds)

    // クレジット情報に日本語名を追加
    const creditsWithJapaneseName = {
      ...credits,
      crew: credits.crew.map(member => ({
        ...member,
        display_name: japaneseNames.get(member.id) || member.name,
      })),
      cast: credits.cast.map(member => ({
        ...member,
        display_name: japaneseNames.get(member.id) || member.name,
      })),
    }

    return NextResponse.json({ details, credits: creditsWithJapaneseName })
  } catch (error) {
    console.error('TMDB movie details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    )
  }
}
