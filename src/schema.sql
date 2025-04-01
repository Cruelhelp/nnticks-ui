
-- Schema for NNticks application

-- Users extra information (extends Auth users)
CREATE TABLE IF NOT EXISTS users_extra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  api_key TEXT,
  pro_status BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  settings JSONB
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

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',
  accent TEXT DEFAULT 'green',
  font TEXT DEFAULT 'JetBrains Mono',
  chart_style TEXT DEFAULT 'line',
  terminal_height INTEGER DEFAULT 200,
  sidebar_width INTEGER DEFAULT 200,
  ws_url TEXT DEFAULT 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
  api_key TEXT,
  subscription TEXT DEFAULT '{"ticks":"R_10"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market ticks
CREATE TABLE IF NOT EXISTS ticks (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  value DECIMAL(18, 6) NOT NULL,
  market TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training history
CREATE TABLE IF NOT EXISTS training_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id TEXT,
  epochs INTEGER,
  accuracy DECIMAL(5, 2),
  loss DECIMAL(10, 6),
  model_config JSONB,
  data_points INTEGER,
  training_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading history
CREATE TABLE IF NOT EXISTS trade_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  market TEXT NOT NULL,
  prediction TEXT CHECK (prediction IN ('rise', 'fall', 'even', 'odd')),
  confidence DECIMAL(5, 2),
  outcome TEXT CHECK (outcome IN ('win', 'loss', 'pending')),
  start_price DECIMAL(18, 6),
  end_price DECIMAL(18, 6),
  time_period INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Models
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  config JSONB,
  accuracy DECIMAL(5, 2),
  weights JSONB,
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to count ticks for a user
CREATE OR REPLACE FUNCTION get_tick_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM ticks WHERE user_id = user_id_param);
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
-- Enable row level security
ALTER TABLE users_extra ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticks ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Users can only see and edit their own data
CREATE POLICY users_extra_policy ON users_extra
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_sessions_policy ON user_sessions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_settings_policy ON user_settings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ticks_policy ON ticks
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY training_history_policy ON training_history
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY trade_history_policy ON trade_history
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY models_policy ON models
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
