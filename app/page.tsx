import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <main className="text-center space-y-8 p-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-slate-900">MIROKU</h1>
          <p className="text-xl text-slate-600">
            あなたの映画体験を記録・分析するアプリ
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-slate-700 max-w-md mx-auto">
            観た映画を記録し、視聴履歴を振り返ることで、
            新しい映画体験の発見につながります
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">今すぐ始める</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">ログイン</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
