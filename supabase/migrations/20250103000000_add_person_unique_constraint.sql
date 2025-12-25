-- 同一ユーザー内で同じTMDB person IDの重複を防ぐユニーク制約
-- tmdb_person_id が NULL の場合は制約対象外（手動追加の人物）
CREATE UNIQUE INDEX idx_persons_user_tmdb_unique
ON persons (user_id, tmdb_person_id)
WHERE tmdb_person_id IS NOT NULL;
