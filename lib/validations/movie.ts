import { z } from 'zod'

export const movieSchema = z.object({
  tmdb_movie_id: z.number().optional(),
  tmdb_title: z.string().optional(),
  tmdb_poster_path: z.string().optional(),
  tmdb_release_date: z.string().optional(),
  tmdb_production_countries: z.array(z.string()).optional(),
  custom_title: z.string().optional(),
  custom_poster_url: z.string().optional(),
  custom_release_date: z.string().optional(),
  custom_production_countries: z.array(z.string()).optional(),
})

export type MovieFormData = z.infer<typeof movieSchema>
