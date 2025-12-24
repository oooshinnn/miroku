import { SignupForm } from '@/components/auth/SignupForm'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="space-y-4">
      <SignupForm />
      <p className="text-sm text-center text-slate-600">
        既にアカウントをお持ちの方は{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          こちら
        </Link>
      </p>
    </div>
  )
}
