-- MIROKU 初期スキーマ

-- カスタム型定義
CREATE TYPE person_role AS ENUM ('director', 'writer', 'cast');
CREATE TYPE watch_method AS ENUM ('theater', 'tv', 'streaming', 'bluray_dvd', 'other');
CREATE TYPE watch_score AS ENUM ('bad', 'neutral', 'good');

-- movies テーブル
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- TMDB由来データ
  tmdb_movie_id INTEGER,
  tmdb_title TEXT,
  tmdb_poster_path TEXT,
  tmdb_release_date DATE,
  tmdb_production_countries TEXT[], -- 配列形式

  -- ユーザー上書きデータ（NULL許可）
  custom_title TEXT,
  custom_poster_url TEXT,
  custom_release_date DATE,
  custom_production_countries TEXT[],

  -- メタデータ
  watch_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_user_tmdb_movie UNIQUE(user_id, tmdb_movie_id)
);

-- インデックス
CREATE INDEX idx_movies_user_id ON movies(user_id);
CREATE INDEX idx_movies_tmdb_id ON movies(tmdb_movie_id);

-- persons テーブル
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  tmdb_person_id INTEGER,
  display_name TEXT NOT NULL,

  -- マージ管理
  merged_into_id UUID REFERENCES persons(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_persons_user_id ON persons(user_id);
CREATE INDEX idx_persons_merged_into ON persons(merged_into_id);

-- movie_persons テーブル（中間テーブル）
CREATE TABLE movie_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  role person_role NOT NULL,

  -- キャストの順序保持用
  cast_order INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_movie_person_role UNIQUE(movie_id, person_id, role)
);

CREATE INDEX idx_movie_persons_movie ON movie_persons(movie_id);
CREATE INDEX idx_movie_persons_person ON movie_persons(person_id);
CREATE INDEX idx_movie_persons_role ON movie_persons(role);

-- tags テーブル
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT, -- Hex色コード（例: #FF5733）

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_user_tag_name UNIQUE(user_id, name)
);

CREATE INDEX idx_tags_user_id ON tags(user_id);

-- movie_tags テーブル（中間テーブル）
CREATE TABLE movie_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_movie_tag UNIQUE(movie_id, tag_id)
);

CREATE INDEX idx_movie_tags_movie ON movie_tags(movie_id);
CREATE INDEX idx_movie_tags_tag ON movie_tags(tag_id);

-- watch_logs テーブル
CREATE TABLE watch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,

  watched_at DATE NOT NULL,
  watch_method watch_method NOT NULL,
  score watch_score,
  memo TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_watch_logs_user_id ON watch_logs(user_id);
CREATE INDEX idx_watch_logs_movie_id ON watch_logs(movie_id);
CREATE INDEX idx_watch_logs_watched_at ON watch_logs(watched_at);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watch_logs_updated_at BEFORE UPDATE ON watch_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- watch_count自動更新トリガー
CREATE OR REPLACE FUNCTION increment_watch_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE movies
  SET watch_count = watch_count + 1
  WHERE id = NEW.movie_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_watch_log_insert
AFTER INSERT ON watch_logs
FOR EACH ROW
EXECUTE FUNCTION increment_watch_count();

CREATE OR REPLACE FUNCTION decrement_watch_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE movies
  SET watch_count = watch_count - 1
  WHERE id = OLD.movie_id AND watch_count > 0;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_watch_log_delete
AFTER DELETE ON watch_logs
FOR EACH ROW
EXECUTE FUNCTION decrement_watch_count();

-- Row Level Security (RLS) 設定

-- movies
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own movies"
  ON movies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movies"
  ON movies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own movies"
  ON movies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movies"
  ON movies FOR DELETE
  USING (auth.uid() = user_id);

-- persons
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own persons"
  ON persons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own persons"
  ON persons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own persons"
  ON persons FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own persons"
  ON persons FOR DELETE
  USING (auth.uid() = user_id);

-- movie_persons
ALTER TABLE movie_persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their movie_persons"
  ON movie_persons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM movies
      WHERE movies.id = movie_persons.movie_id
      AND movies.user_id = auth.uid()
    )
  );

-- tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- movie_tags
ALTER TABLE movie_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their movie_tags"
  ON movie_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM movies
      WHERE movies.id = movie_tags.movie_id
      AND movies.user_id = auth.uid()
    )
  );

-- watch_logs
ALTER TABLE watch_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch_logs"
  ON watch_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watch_logs"
  ON watch_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch_logs"
  ON watch_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watch_logs"
  ON watch_logs FOR DELETE
  USING (auth.uid() = user_id);
