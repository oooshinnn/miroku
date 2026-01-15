export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">MIROKU</h1>
        <p className="text-sm text-slate-600 text-center mt-2">映画視聴記録アプリ</p>
      </div>
      <div className="w-full max-w-xl px-4">
        {children}
      </div>
    </div>
  )
}
