import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { WatchLogEditClient } from './WatchLogEditClient'
import type { WatchLog } from '@/types/watch-log'

interface EditWatchLogPageProps {
  params: Promise<{ id: string }>
}

export default async function EditWatchLogPage({ params }: EditWatchLogPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: watchLog, error } = (await supabase
    .from('watch_logs')
    .select('*')
    .eq('id', id)
    .single()) as { data: WatchLog | null; error: PostgrestError | null }

  if (error || !watchLog) {
    notFound()
  }

  return <WatchLogEditClient watchLog={watchLog} />
}
