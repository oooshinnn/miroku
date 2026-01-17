'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ProfileFormProps {
  initialEmail: string
  initialDisplayName: string
}

export function ProfileForm({ initialEmail, initialDisplayName }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [email, setEmail] = useState(initialEmail)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [profileLoading, setProfileLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      })

      if (error) throw error

      setProfileMessage({ type: 'success', text: '表示名を更新しました' })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '更新に失敗しました'
      setProfileMessage({ type: 'error', text: message })
    } finally {
      setProfileLoading(false)
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailLoading(true)
    setEmailMessage(null)

    if (email === initialEmail) {
      setEmailMessage({ type: 'error', text: '現在と同じメールアドレスです' })
      setEmailLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ email })

      if (error) throw error

      setEmailMessage({
        type: 'success',
        text: '確認メールを送信しました。メール内のリンクをクリックして変更を完了してください',
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '更新に失敗しました'
      setEmailMessage({ type: 'error', text: message })
    } finally {
      setEmailLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordMessage(null)

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'パスワードは6文字以上にしてください' })
      setPasswordLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'パスワードが一致しません' })
      setPasswordLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) throw error

      setPasswordMessage({ type: 'success', text: 'パスワードを更新しました' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '更新に失敗しました'
      setPasswordMessage({ type: 'error', text: message })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 表示名 */}
      <Card>
        <CardHeader>
          <CardTitle>表示名</CardTitle>
          <CardDescription>アプリ内で表示される名前を設定します</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">表示名</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="表示名を入力"
              />
            </div>
            {profileMessage && (
              <p
                className={`text-sm ${
                  profileMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {profileMessage.text}
              </p>
            )}
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? '更新中...' : '表示名を更新'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* メールアドレス */}
      <Card>
        <CardHeader>
          <CardTitle>メールアドレス</CardTitle>
          <CardDescription>ログインに使用するメールアドレスを変更します</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレスを入力"
                required
              />
            </div>
            {emailMessage && (
              <p
                className={`text-sm ${
                  emailMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {emailMessage.text}
              </p>
            )}
            <Button type="submit" disabled={emailLoading}>
              {emailLoading ? '送信中...' : 'メールアドレスを変更'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* パスワード */}
      <Card>
        <CardHeader>
          <CardTitle>パスワード</CardTitle>
          <CardDescription>ログインパスワードを変更します</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">新しいパスワード</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新しいパスワード（6文字以上）"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="新しいパスワードを再入力"
                required
                minLength={6}
              />
            </div>
            {passwordMessage && (
              <p
                className={`text-sm ${
                  passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {passwordMessage.text}
              </p>
            )}
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? '更新中...' : 'パスワードを変更'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
