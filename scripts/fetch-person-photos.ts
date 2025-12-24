/**
 * 既存の人物データに顔写真を取得するバッチスクリプト
 *
 * 実行方法:
 *   npx tsx scripts/fetch-person-photos.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// .env.local を読み込み
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TMDB_API_KEY = process.env.TMDB_API_KEY!
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

// service_role key を使用してRLSをバイパス
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface Person {
  id: string
  tmdb_person_id: number | null
  display_name: string
  tmdb_profile_path: string | null
}

async function fetchPersonDetails(tmdbPersonId: number): Promise<{ profile_path: string | null } | null> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/person/${tmdbPersonId}?api_key=${TMDB_API_KEY}&language=ja-JP`
    )
    if (!response.ok) {
      console.error(`  TMDB API error for person ${tmdbPersonId}: ${response.status}`)
      return null
    }
    const data = await response.json()
    return { profile_path: data.profile_path }
  } catch (error) {
    console.error(`  Error fetching person ${tmdbPersonId}:`, error)
    return null
  }
}

async function main() {
  console.log('=== 人物の顔写真を取得するバッチ処理 ===\n')

  // 環境変数チェック
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TMDB_API_KEY) {
    console.error('環境変数が設定されていません。.env.local を確認してください。')
    console.error('必要な変数: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TMDB_API_KEY')
    process.exit(1)
  }

  // TMDB person IDがあり、profile_pathがない人物を取得
  const { data: persons, error } = await supabase
    .from('persons')
    .select('id, tmdb_person_id, display_name, tmdb_profile_path')
    .not('tmdb_person_id', 'is', null)
    .is('tmdb_profile_path', null)

  if (error) {
    console.error('人物データの取得に失敗:', error)
    process.exit(1)
  }

  if (!persons || persons.length === 0) {
    console.log('更新対象の人物がいません（全員顔写真取得済み or TMDB IDなし）')
    return
  }

  console.log(`${persons.length} 人の顔写真を取得します...\n`)

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (const person of persons as Person[]) {
    if (!person.tmdb_person_id) continue

    console.log(`処理中: ${person.display_name} (TMDB ID: ${person.tmdb_person_id})`)

    const details = await fetchPersonDetails(person.tmdb_person_id)

    if (!details) {
      errorCount++
      continue
    }

    if (!details.profile_path) {
      console.log(`  -> 顔写真なし（TMDBに登録されていない）`)
      skipCount++
      continue
    }

    // DBを更新
    const { error: updateError } = await supabase
      .from('persons')
      .update({ tmdb_profile_path: details.profile_path })
      .eq('id', person.id)

    if (updateError) {
      console.error(`  -> 更新失敗:`, updateError)
      errorCount++
    } else {
      console.log(`  -> 取得成功: ${details.profile_path}`)
      successCount++
    }

    // TMDB APIのレート制限対策（1秒あたり約40リクエストまで）
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  console.log('\n=== 完了 ===')
  console.log(`成功: ${successCount} 人`)
  console.log(`顔写真なし: ${skipCount} 人`)
  console.log(`エラー: ${errorCount} 人`)
}

main().catch(console.error)
