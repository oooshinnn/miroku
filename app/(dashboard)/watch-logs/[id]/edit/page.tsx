import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { WatchLogEditClient } from './WatchLogEditClient'

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
    .single()) as { data: any; error: any }

  if (error || !watchLog) {
    notFound()
  }

  return <WatchLogEditClient watchLog={watchLog} />
}
