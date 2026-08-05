-- ============================================================
-- Camp Memories · Additional tables for ThinkPad database
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- 1. Create memories table
CREATE TABLE IF NOT EXISTS memories (
    id            TEXT PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title         TEXT NOT NULL DEFAULT '',
    date          TEXT NOT NULL DEFAULT '',
    year          INTEGER NOT NULL DEFAULT 2024,
    category      TEXT NOT NULL DEFAULT 'travel'
                  CHECK (category IN ('travel', 'growth', 'motorcycle', 'photography')),
    tag           TEXT NOT NULL DEFAULT '',
    image         TEXT NOT NULL DEFAULT '',
    gallery       TEXT[] DEFAULT ARRAY[]::TEXT[],
    past_self     TEXT NOT NULL DEFAULT '',
    present_self  TEXT NOT NULL DEFAULT '',
    pinned_by     TEXT NOT NULL DEFAULT 'pin'
                  CHECK (pinned_by IN ('pin', 'magnet', 'clip', 'tape')),
    px            REAL NOT NULL DEFAULT 50,
    py            REAL NOT NULL DEFAULT 50,
    rotation      REAL NOT NULL DEFAULT 0,
    location_name TEXT,
    location_mx   REAL,
    location_my   REAL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create future_letters table
CREATE TABLE IF NOT EXISTS future_letters (
    id             TEXT PRIMARY KEY,
    user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_date   TEXT NOT NULL DEFAULT '',
    delivery_year  INTEGER NOT NULL DEFAULT 2025,
    title          TEXT NOT NULL DEFAULT '',
    content        TEXT NOT NULL DEFAULT '',
    is_opened      BOOLEAN NOT NULL DEFAULT false,
    wax_seal_color TEXT NOT NULL DEFAULT '#b45309',
    rotation       REAL NOT NULL DEFAULT 0,
    px             REAL NOT NULL DEFAULT 50,
    py             REAL NOT NULL DEFAULT 50,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_year ON memories(year);
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
CREATE INDEX IF NOT EXISTS idx_future_letters_user_id ON future_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_future_letters_delivery_year ON future_letters(delivery_year);

-- 4. updated_at trigger for memories
DROP TRIGGER IF EXISTS memories_updated_at ON memories;
CREATE TRIGGER memories_updated_at
    BEFORE UPDATE ON memories
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 5. Enable RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE future_letters ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for memories
DROP POLICY IF EXISTS "Users can read own memories" ON memories;
CREATE POLICY "Users can read own memories"
    ON memories FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own memories" ON memories;
CREATE POLICY "Users can insert own memories"
    ON memories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own memories" ON memories;
CREATE POLICY "Users can update own memories"
    ON memories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own memories" ON memories;
CREATE POLICY "Users can delete own memories"
    ON memories FOR DELETE
    USING (auth.uid() = user_id);

-- 7. RLS policies for future_letters
DROP POLICY IF EXISTS "Users can read own letters" ON future_letters;
CREATE POLICY "Users can read own letters"
    ON future_letters FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own letters" ON future_letters;
CREATE POLICY "Users can insert own letters"
    ON future_letters FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own letters" ON future_letters;
CREATE POLICY "Users can update own letters"
    ON future_letters FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own letters" ON future_letters;
CREATE POLICY "Users can delete own letters"
    ON future_letters FOR DELETE
    USING (auth.uid() = user_id);

-- 8. user_id trigger for memories
DROP TRIGGER IF EXISTS memories_set_user_id ON memories;
CREATE TRIGGER memories_set_user_id
    BEFORE INSERT ON memories
    FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- 9. user_id trigger for future_letters
DROP TRIGGER IF EXISTS future_letters_set_user_id ON future_letters;
CREATE TRIGGER future_letters_set_user_id
    BEFORE INSERT ON future_letters
    FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- 10. 地区线支持（国家/城市钻取）
ALTER TABLE memories ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS city TEXT;
CREATE INDEX IF NOT EXISTS idx_memories_country ON memories(country);
