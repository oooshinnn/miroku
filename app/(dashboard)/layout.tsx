import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/movies" className="text-2xl font-bold text-slate-900">
                MIROKU
              </Link>
              <nav className="flex space-x-4">
                <Link
                  href="/movies"
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  映画
                </Link>
                <Link
                  href="/watch-logs"
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  視聴ログ
                </Link>
                <Link
                  href="/persons"
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  人物
                </Link>
                <Link
                  href="/tags"
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  タグ
                </Link>
                <Link
                  href="/analytics"
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  分析
                </Link>
              </nav>
            </div>
            <form action="/api/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm">
                ログアウト
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
