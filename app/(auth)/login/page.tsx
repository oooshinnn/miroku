import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <LoginForm />
      <p className="text-sm text-center text-slate-600">
        アカウントをお持ちでない方は{' '}
        <Link href="/signup" className="text-blue-600 hover:underline">
          こちら
        </Link>
      </p>
    </div>
  )
}
