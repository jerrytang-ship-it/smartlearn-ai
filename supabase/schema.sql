-- ============================================
-- 智學AI Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================

-- ==================
-- CONTENT TABLES
-- ==================

-- Units (e.g. "認識AI", "AI如何學習")
CREATE TABLE units (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '🤖',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chapters within units
CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  unit_id INT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  xp_reward INT NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chapters_unit ON chapters(unit_id, sort_order);

-- Questions within chapters
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  chapter_id INT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mcq', 'true_false', 'match', 'roleplay', 'news')),
  prompt TEXT NOT NULL,
  explanation TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_questions_chapter ON questions(chapter_id, sort_order);

-- Options for MCQ / roleplay / news / match questions
CREATE TABLE question_options (
  id SERIAL PRIMARY KEY,
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_options_question ON question_options(question_id, sort_order);

-- ==================
-- USER TABLES
-- ==================

-- Main users table — every visitor gets a row (anonymous or authenticated)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE,
  email TEXT,
  display_name TEXT DEFAULT '同學仔',
  avatar_url TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

-- User stats — XP, streak, level (one row per user)
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_activity_date DATE,
  chapters_completed INT NOT NULL DEFAULT 0,
  total_correct INT NOT NULL DEFAULT 0,
  total_answered INT NOT NULL DEFAULT 0
);

-- User progress per chapter
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id INT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'complete')),
  score INT,
  best_score INT,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, chapter_id)
);

CREATE INDEX idx_progress_user ON user_progress(user_id);

-- Individual answers (for analytics)
CREATE TABLE user_answers (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id INT REFERENCES question_options(id),
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_answers_user ON user_answers(user_id, answered_at);

-- Anonymous sessions — maps localStorage UUID to user row
-- When user logs in with Google, we attach the anonymous user_id to their Google account
CREATE TABLE anonymous_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

-- ==================
-- ROW LEVEL SECURITY
-- ==================

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_sessions ENABLE ROW LEVEL SECURITY;

-- Content tables: anyone can read
CREATE POLICY "Content is publicly readable" ON units FOR SELECT USING (true);
CREATE POLICY "Content is publicly readable" ON chapters FOR SELECT USING (true);
CREATE POLICY "Content is publicly readable" ON questions FOR SELECT USING (true);
CREATE POLICY "Content is publicly readable" ON question_options FOR SELECT USING (true);

-- Users: can read/update own row (matched by ID passed from client)
-- For anonymous users, we pass the UUID from localStorage in the request
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (id = auth.uid());

-- User stats: read own, service role writes
CREATE POLICY "Anyone can read stats" ON user_stats
  FOR SELECT USING (true);

CREATE POLICY "Service role manages stats" ON user_stats
  FOR ALL USING (true);

-- User progress: users manage own progress
CREATE POLICY "Anyone can read progress" ON user_progress
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert progress" ON user_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update progress" ON user_progress
  FOR UPDATE USING (true);

-- User answers: users insert own
CREATE POLICY "Anyone can insert answers" ON user_answers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read own answers" ON user_answers
  FOR SELECT USING (true);

-- Anonymous sessions: open for now (anonymous users need access)
CREATE POLICY "Sessions are open" ON anonymous_sessions
  FOR ALL USING (true);

-- ==================
-- HELPER FUNCTIONS
-- ==================

-- Function to create a new anonymous user and return the user_id
CREATE OR REPLACE FUNCTION create_anonymous_user(p_device_info TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Create user
  INSERT INTO users (is_anonymous)
  VALUES (true)
  RETURNING id INTO v_user_id;

  -- Create stats row
  INSERT INTO user_stats (user_id) VALUES (v_user_id);

  -- Create session
  INSERT INTO anonymous_sessions (user_id, device_info)
  VALUES (v_user_id, p_device_info);

  -- Unlock first chapter for new user
  INSERT INTO user_progress (user_id, chapter_id, status)
  SELECT v_user_id, c.id,
    CASE WHEN c.sort_order = 0 AND c.unit_id = (SELECT id FROM units ORDER BY sort_order LIMIT 1)
         THEN 'unlocked' ELSE 'locked' END
  FROM chapters c;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to attach anonymous user to Google account
CREATE OR REPLACE FUNCTION attach_google_account(
  p_user_id UUID,
  p_google_id TEXT,
  p_email TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET google_id = p_google_id,
      email = p_email,
      display_name = COALESCE(p_display_name, display_name),
      avatar_url = p_avatar_url,
      is_anonymous = false
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update streak (call on each activity)
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_last_date DATE;
  v_today DATE := CURRENT_DATE;
  v_streak INT;
BEGIN
  SELECT last_activity_date, streak INTO v_last_date, v_streak
  FROM user_stats WHERE user_id = p_user_id;

  IF v_last_date = v_today THEN
    -- Already active today, no change
    RETURN;
  ELSIF v_last_date = v_today - 1 THEN
    -- Consecutive day: increment streak
    UPDATE user_stats
    SET streak = streak + 1,
        longest_streak = GREATEST(longest_streak, streak + 1),
        last_activity_date = v_today
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken: reset to 1
    UPDATE user_stats
    SET streak = 1,
        last_activity_date = v_today
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a chapter and unlock next
CREATE OR REPLACE FUNCTION complete_chapter(
  p_user_id UUID,
  p_chapter_id INT,
  p_score INT
)
RETURNS VOID AS $$
DECLARE
  v_xp INT;
  v_unit_id INT;
  v_sort INT;
  v_next_chapter_id INT;
BEGIN
  -- Get chapter info
  SELECT xp_reward, unit_id, sort_order INTO v_xp, v_unit_id, v_sort
  FROM chapters WHERE id = p_chapter_id;

  -- Mark chapter complete
  INSERT INTO user_progress (user_id, chapter_id, status, score, best_score, completed_at)
  VALUES (p_user_id, p_chapter_id, 'complete', p_score, p_score, now())
  ON CONFLICT (user_id, chapter_id)
  DO UPDATE SET
    status = 'complete',
    score = p_score,
    best_score = GREATEST(user_progress.best_score, p_score),
    completed_at = COALESCE(user_progress.completed_at, now());

  -- Award XP
  UPDATE user_stats
  SET xp = xp + v_xp,
      level = 1 + (xp + v_xp) / 300,
      chapters_completed = chapters_completed + 1
  WHERE user_id = p_user_id;

  -- Unlock next chapter in same unit
  SELECT id INTO v_next_chapter_id
  FROM chapters
  WHERE unit_id = v_unit_id AND sort_order = v_sort + 1;

  IF v_next_chapter_id IS NOT NULL THEN
    INSERT INTO user_progress (user_id, chapter_id, status)
    VALUES (p_user_id, v_next_chapter_id, 'unlocked')
    ON CONFLICT (user_id, chapter_id) DO UPDATE SET status = 'unlocked'
    WHERE user_progress.status = 'locked';
  ELSE
    -- Last chapter in unit: unlock first chapter of next unit
    SELECT c.id INTO v_next_chapter_id
    FROM chapters c
    JOIN units u ON c.unit_id = u.id
    WHERE u.sort_order = (SELECT sort_order + 1 FROM units WHERE id = v_unit_id)
      AND c.sort_order = 0;

    IF v_next_chapter_id IS NOT NULL THEN
      INSERT INTO user_progress (user_id, chapter_id, status)
      VALUES (p_user_id, v_next_chapter_id, 'unlocked')
      ON CONFLICT (user_id, chapter_id) DO UPDATE SET status = 'unlocked'
      WHERE user_progress.status = 'locked';
    END IF;
  END IF;

  -- Update streak
  PERFORM update_streak(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- SEED DATA (1 unit of test content)
-- ==================

INSERT INTO units (id, title, description, emoji, sort_order) VALUES
(1, '認識AI', 'AI是什麼？它如何影響我們的日常生活？', '🤖', 0);

INSERT INTO chapters (id, unit_id, title, description, sort_order, xp_reward) VALUES
(1, 1, '什麼是人工智能？', '了解AI的基本概念', 0, 50),
(2, 1, 'AI在身邊', '發現日常生活中的AI應用', 1, 50),
(3, 1, 'AI的歷史', '從圖靈到ChatGPT', 2, 75),
(4, 1, 'AI vs 人類', 'AI能做什麼？不能做什麼？', 3, 75),
(5, 1, '單元測驗', '測試你對AI的認識', 4, 100);

-- Chapter 1 questions
INSERT INTO questions (id, chapter_id, type, prompt, explanation, sort_order) VALUES
(1, 1, 'mcq', '以下哪一個最能描述「人工智能」？', 'AI是讓電腦模擬人類智能行為的技術，包括學習、推理和解決問題。', 0),
(2, 1, 'true_false', 'AI可以像人類一樣思考和感受。', '目前的AI只是模擬智能行為，並不能真正「思考」或「感受」。它根據數據和算法運作。', 1),
(3, 1, 'mcq', 'Siri、Google Assistant 和 Alexa 都是什麼類型的AI？', '它們都是語音助手，使用自然語言處理（NLP）技術來理解和回應人類語言。', 2);

INSERT INTO question_options (question_id, option_text, is_correct, sort_order) VALUES
-- Q1 options
(1, '一種讓電腦模擬人類智能的技術', true, 0),
(1, '一種特殊的電腦硬件', false, 1),
(1, '一個會說話的機器人', false, 2),
(1, '一種電腦遊戲', false, 3),
-- Q3 options
(3, '社交媒體', false, 0),
(3, '語音助手', true, 1),
(3, '搜索引擎', false, 2),
(3, '電子遊戲', false, 3);
