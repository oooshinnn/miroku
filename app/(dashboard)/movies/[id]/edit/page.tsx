import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MovieEditClient } from './MovieEditClient'
import type { Movie } from '@/types/movie'

interface EditMoviePageProps {
  params: Promise<{ id: string }>
}

export default async function EditMoviePage({ params }: EditMoviePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: movie, error } = (await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single()) as { data: Movie | null; error: PostgrestError | null }

  if (error || !movie) {
    notFound()
  }

  return <MovieEditClient movie={movie} />
}
