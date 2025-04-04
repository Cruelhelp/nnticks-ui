
-- Schema for NNticks application

-- Users extra information (extends Auth users)
CREATE TABLE IF NOT EXISTS users_extra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  pro_status BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  available_epochs INT DEFAULT 50,
  total_epochs INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb
);

-- User sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'ended', 'expired')),
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  login_method TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market ticks
CREATE TABLE IF NOT EXISTS ticks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL,
  value DECIMAL(18, 6) NOT NULL,
  market TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training history
CREATE TABLE IF NOT EXISTS training_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mission TEXT,
  epochs INT NOT NULL,
  accuracy DECIMAL(5, 2),
  model_id TEXT,
  model_data JSONB,
  points INT,
  date TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('rise', 'fall', 'odd', 'even')),
  confidence DECIMAL(5, 2),
  time_period INT NOT NULL,
  market TEXT NOT NULL,
  start_price DECIMAL(18, 6),
  end_price DECIMAL(18, 6),
  outcome TEXT CHECK (outcome IN ('win', 'loss', 'pending')),
  completed_at TIMESTAMPTZ,
  indicators JSONB,
  metadata JSONB
);

-- Models
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  accuracy DECIMAL(5, 2),
  epochs_trained INT,
  active BOOLEAN DEFAULT FALSE,
  weights JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  accuracy DECIMAL(5, 2),
  level INT DEFAULT 1,
  epochs INT DEFAULT 0,
  win_rate DECIMAL(5, 2),
  points INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE users_extra ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticks ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Users can only see and edit their own data
CREATE POLICY users_extra_policy ON users_extra
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_sessions_policy ON user_sessions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ticks_policy ON ticks
  USING (TRUE)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY training_history_policy ON training_history
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY predictions_policy ON predictions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY models_policy ON models
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY leaderboard_select_policy ON leaderboard
  FOR SELECT
  USING (TRUE);

CREATE POLICY leaderboard_update_policy ON leaderboard
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY leaderboard_insert_policy ON leaderboard
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
