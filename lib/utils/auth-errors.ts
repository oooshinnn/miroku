/**
 * Supabase認証エラーメッセージを日本語に変換
 */
export function translateAuthError(message: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
    'Email not confirmed': 'メールアドレスの確認が完了していません',
    'User already registered': 'このメールアドレスは既に登録されています',
    'Password should be at least 6 characters': 'パスワードは6文字以上で入力してください',
    'Unable to validate email address: invalid format': 'メールアドレスの形式が正しくありません',
    'Signup requires a valid password': '有効なパスワードを入力してください',
    'User not found': 'ユーザーが見つかりません',
    'Email rate limit exceeded': '送信制限に達しました。しばらくしてからお試しください',
    'For security purposes, you can only request this once every 60 seconds': 'セキュリティのため、60秒に1回のみリクエストできます',
  }

  // 完全一致
  if (errorMap[message]) {
    return errorMap[message]
  }

  // 部分一致
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  // マッチしない場合はそのまま返す（開発中は原文を見たいことがある）
  return message
}
