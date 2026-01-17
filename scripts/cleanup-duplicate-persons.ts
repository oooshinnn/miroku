/**
 * 重複した人物データをクリーンアップするスクリプト
 *
 * 同じ user_id + tmdb_person_id の組み合わせで複数登録されている人物を統合します。
 *
 * 実行方法:
 *   npx tsx scripts/cleanup-duplicate-persons.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface Person {
  id: string
  user_id: string
  tmdb_person_id: number | null
  display_name: string
  tmdb_profile_path: string | null
  created_at: string
}

interface MoviePersonLink {
  id: string
  movie_id: string
  role: string
}

async function main() {
  console.log('=== 重複人物のクリーンアップ ===\n')

  // 全ての人物を取得
  const { data: allPersons, error } = await supabase
    .from('persons')
    .select('*')
    .not('tmdb_person_id', 'is', null)
    .is('merged_into_id', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('人物データの取得に失敗:', error)
    process.exit(1)
  }

  if (!allPersons || allPersons.length === 0) {
    console.log('人物データがありません')
    return
  }

  // user_id + tmdb_person_id でグループ化
  const groups = new Map<string, Person[]>()
  allPersons.forEach((person: Person) => {
    const key = `${person.user_id}_${person.tmdb_person_id}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(person)
  })

  // 重複しているグループを抽出
  const duplicateGroups = Array.from(groups.entries()).filter(
    ([, persons]) => persons.length > 1
  )

  if (duplicateGroups.length === 0) {
    console.log('重複している人物はいません')
    return
  }

  console.log(`${duplicateGroups.length} グループの重複を処理します...\n`)

  let mergedCount = 0
  let deletedLinksCount = 0

  for (const [_key, persons] of duplicateGroups) {
    // 最初の人物を正規のものとして残す（最も古いレコード）
    const [primary, ...duplicates] = persons

    console.log(`処理中: ${primary.display_name} (TMDB ID: ${primary.tmdb_person_id})`)
    console.log(`  正規: ${primary.id}`)
    console.log(`  重複: ${duplicates.length}件`)

    // 正規の人物の movie_persons を取得
    const { data: primaryLinks } = await supabase
      .from('movie_persons')
      .select('id, movie_id, role')
      .eq('person_id', primary.id)

    const primarySet = new Set(
      (primaryLinks || []).map((l: MoviePersonLink) => `${l.movie_id}_${l.role}`)
    )

    for (const dup of duplicates) {
      // 重複人物の movie_persons を取得
      const { data: dupLinks } = await supabase
        .from('movie_persons')
        .select('id, movie_id, role')
        .eq('person_id', dup.id)

      if (dupLinks && dupLinks.length > 0) {
        // 正規に既に存在する組み合わせは削除
        const toDelete = dupLinks.filter((l: MoviePersonLink) =>
          primarySet.has(`${l.movie_id}_${l.role}`)
        )
        const toUpdate = dupLinks.filter((l: MoviePersonLink) =>
          !primarySet.has(`${l.movie_id}_${l.role}`)
        )

        if (toDelete.length > 0) {
          await supabase
            .from('movie_persons')
            .delete()
            .in('id', toDelete.map((l: MoviePersonLink) => l.id))
          deletedLinksCount += toDelete.length
        }

        if (toUpdate.length > 0) {
          await supabase
            .from('movie_persons')
            .update({ person_id: primary.id })
            .in('id', toUpdate.map((l: MoviePersonLink) => l.id))

          // 正規のセットに追加
          toUpdate.forEach((l: MoviePersonLink) => {
            primarySet.add(`${l.movie_id}_${l.role}`)
          })
        }
      }

      // 重複人物を削除
      await supabase.from('persons').delete().eq('id', dup.id)
      mergedCount++
    }

    // 正規の人物に profile_path がなければ更新
    if (!primary.tmdb_profile_path) {
      const personWithPhoto = persons.find(p => p.tmdb_profile_path)
      if (personWithPhoto) {
        await supabase
          .from('persons')
          .update({ tmdb_profile_path: personWithPhoto.tmdb_profile_path })
          .eq('id', primary.id)
      }
    }
  }

  console.log('\n=== 完了 ===')
  console.log(`統合した人物: ${mergedCount} 人`)
  console.log(`削除した重複リンク: ${deletedLinksCount} 件`)
}

main().catch(console.error)
