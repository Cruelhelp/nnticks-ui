
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

-- User sessions for tracking activity
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB
);

-- Market data ticks from WebSocket connections
CREATE TABLE IF NOT EXISTS ticks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL,
  value NUMERIC NOT NULL,
  market TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store user predictions and outcomes
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('rise', 'fall', 'odd', 'even')),
  confidence NUMERIC,
  time_period INT NOT NULL,
  market TEXT NOT NULL,
  start_price NUMERIC,
  end_price NUMERIC,
  outcome TEXT CHECK (outcome IN ('win', 'loss', 'pending')),
  completed_at TIMESTAMPTZ,
  indicators JSONB,
  metadata JSONB
);

-- Training history with detailed metrics
CREATE TABLE IF NOT EXISTS training_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mission TEXT,
  epochs INT NOT NULL,
  accuracy NUMERIC,
  model_id TEXT,
  model_data JSONB,
  points INT,
  date TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Neural network models
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  accuracy NUMERIC,
  epochs_trained INT,
  active BOOLEAN DEFAULT FALSE,
  weights JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training metrics for evaluating model performance
CREATE TABLE IF NOT EXISTS training_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_id UUID REFERENCES training_history(id) ON DELETE CASCADE,
  epoch INT,
  loss NUMERIC,
  accuracy NUMERIC,
  val_loss NUMERIC,
  val_accuracy NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard for rankings
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  accuracy NUMERIC,
  level INT DEFAULT 1,
  epochs INT DEFAULT 0,
  win_rate NUMERIC,
  points INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for tables
ALTER TABLE users_extra ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticks ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS policy for users_extra - users can only see and update their own data
CREATE POLICY users_extra_select ON users_extra FOR SELECT
  USING (auth.uid() = user_id OR is_admin = TRUE);

CREATE POLICY users_extra_update ON users_extra FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policy for user_sessions - users can only see their own sessions
CREATE POLICY user_sessions_select ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS policy for ticks - users can insert their own ticks and see all ticks
CREATE POLICY ticks_select ON ticks FOR SELECT
  USING (TRUE);

CREATE POLICY ticks_insert ON ticks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policy for predictions - users can insert their own predictions and see their own predictions
CREATE POLICY predictions_select ON predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY predictions_insert ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY predictions_update ON predictions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policy for training_history - users can insert their own training history and see their own training history
CREATE POLICY training_history_select ON training_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY training_history_insert ON training_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY training_history_update ON training_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policy for models - users can insert their own models and see their own models
CREATE POLICY models_select ON models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY models_insert ON models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY models_update ON models FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policy for training_metrics - users can insert their own training metrics and see their own training metrics
CREATE POLICY training_metrics_select ON training_metrics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM training_history
    WHERE training_history.id = training_metrics.training_id
    AND training_history.user_id = auth.uid()
  ));

CREATE POLICY training_metrics_insert ON training_metrics FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM training_history
    WHERE training_history.id = training_metrics.training_id
    AND training_history.user_id = auth.uid()
  ));

-- RLS policy for leaderboard - everyone can see the leaderboard, but users can only update their own entry
CREATE POLICY leaderboard_select ON leaderboard FOR SELECT
  USING (TRUE);

CREATE POLICY leaderboard_insert ON leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY leaderboard_update ON leaderboard FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
