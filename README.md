# MIROKU - 映画視聴記録アプリ

MIROKU は、個人がこれまでに視聴した映画作品を記録・管理・分析するためのアプリです。

## 主な機能

### 実装済み機能 ✅

- **認証機能**
  - メールアドレス＋パスワードによるサインアップ・ログイン
  - Supabase Auth を利用した安全な認証

- **映画検索・登録**
  - TMDB API と連携した映画検索
  - 映画詳細情報の自動取得（タイトル、ポスター、公開日、監督、脚本、キャスト）
  - データベースへの保存
  - 映画一覧・詳細表示
  - 映画情報の編集（タイトル、ポスター、公開日のカスタマイズ）

- **視聴ログ管理**
  - 視聴記録の登録・編集・削除
  - 視聴日、視聴方法、スコア、感想メモの記録
  - 映画ごとの視聴回数の自動カウント
  - 視聴ログ一覧表示

- **タグ管理**
  - タグの作成・編集・削除
  - タグへの色付け
  - 映画へのタグ付与・削除

- **検索・フィルタ機能**
  - タイトル検索
  - タグによる絞り込み
  - 人物（監督・キャスト）による絞り込み
  - 公開年による絞り込み

- **人物管理**
  - 監督・脚本・キャストの一覧表示
  - 人物名の編集
  - 同一人物のマージ（表記揺れの統合）
  - マージ解除

- **分析機能**
  - 年別視聴本数のグラフ表示
  - 監督別視聴作品数のランキング（Top 10）
  - キャスト別視聴作品数のランキング（Top 10）
  - Recharts による視覚化

## 技術スタック

- **フロントエンド**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **バックエンド**: Supabase (PostgreSQL + Auth)
- **外部API**: TMDB API
- **ホスティング**: Netlify（予定）

## セットアップ手順

### 1. 前提条件

- Node.js 18.17 以上
- npm または yarn
- Supabase アカウント
- TMDB API キー

### 2. Supabase プロジェクトの作成

1. [Supabase](https://supabase.com) にアクセスしてプロジェクトを作成
   - Project name: `miroku`
   - Region: `Northeast Asia (Tokyo)` 推奨

2. Project Settings → API から以下の情報を取得
   - `Project URL`
   - `anon public` key
   - `service_role` key

3. SQL Editor で `supabase/migrations/20250101000000_initial_schema.sql` の内容を実行

### 3. TMDB API キーの取得

1. [The Movie Database](https://www.themoviedb.org) でアカウントを作成
2. Settings → API → Request an API Key
3. API Key (v3 auth) を取得

### 4. プロジェクトのセットアップ

```bash
# 依存パッケージのインストール
npm install

# 環境変数の設定
cp .env.local.example .env.local
```

### 5. 環境変数の設定

`.env.local` ファイルを編集して、以下の値を設定してください：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# TMDB
TMDB_API_KEY=your_tmdb_api_key
NEXT_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## データベーススキーマ

主要なテーブル：

- `movies`: 映画作品情報
- `persons`: 人物情報（監督・脚本・キャスト）
- `movie_persons`: 映画と人物の関連付け
- `tags`: タグ
- `movie_tags`: 映画とタグの関連付け
- `watch_logs`: 視聴ログ

詳細は `supabase/migrations/20250101000000_initial_schema.sql` を参照してください。

## プロジェクト構成

```
miroku/
├── app/                        # Next.js App Router
│   ├── (auth)/                # 認証ページ
│   ├── (dashboard)/           # ダッシュボード
│   └── api/                   # API Routes
├── components/                # Reactコンポーネント
│   ├── ui/                    # shadcn/ui コンポーネント
│   ├── auth/                  # 認証コンポーネント
│   └── movies/                # 映画関連コンポーネント
├── lib/                       # ユーティリティ
│   ├── supabase/              # Supabase クライアント
│   ├── tmdb/                  # TMDB API クライアント
│   └── validations/           # バリデーションスキーマ
├── hooks/                     # カスタムフック
├── types/                     # TypeScript型定義
└── supabase/                  # Supabaseマイグレーション
```

## 開発状況

全機能が完成しました：

- ✅ Phase 0: 環境セットアップ
- ✅ Phase 1: 認証基盤
- ✅ Phase 2: 映画検索・登録
- ✅ Phase 3: 視聴ログ管理
- ✅ Phase 4: タグ管理
- ✅ Phase 5: 人物管理・マージ機能
- ✅ Phase 6: 検索・フィルタ機能
- ✅ Phase 7: 分析機能（年別・監督別・キャスト別）

## ライセンス

MIT
