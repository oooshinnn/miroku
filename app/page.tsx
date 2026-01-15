import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-slate-900">MIROKU</h1>
          <p className="text-xl text-slate-600">
            あなたの映画体験を記録・分析するアプリ
          </p>
        </div>

        <div className="space-y-4 max-w-lg">
          <div className="text-left space-y-3 text-slate-700">
            <p>
              MIROKUは、映画鑑賞をより豊かにするための記録・分析アプリです。
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>観た映画を記録し、視聴履歴を管理</li>
              <li>俳優・監督ごとの視聴傾向を分析</li>
              <li>タグ付けで自分だけの映画コレクションを整理</li>
            </ul>
          </div>
          <div className="flex gap-4 justify-center pt-4">
            <Button asChild size="lg">
              <Link href="/signup">今すぐ始める</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">ログイン</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-8 py-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">ベータ版のご利用について</p>
            <p className="text-amber-700">
              本サービスは現在ベータ版として提供しています。
              予告なく機能の変更、データの修正・削除を行う場合があります。
              また、サービスの安定性やデータの永続性を保証するものではありません。
              あらかじめご了承ください。
            </p>
          </div>

          <div className="text-center text-sm text-slate-600">
            <p>
              お問い合わせ・ご要望は{' '}
              <a
                href="https://x.com/drumroll_tokyo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                @drumroll_tokyo
              </a>
              {' '}までご連絡ください
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
