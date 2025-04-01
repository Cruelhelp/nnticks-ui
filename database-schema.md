
# NNticks Supabase Database Schema

## Required Tables

### 1. users_extra
This table extends Supabase's built-in `auth.users` table with additional user information.

```sql
CREATE TABLE users_extra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  pro_status BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_users_extra_user_id ON users_extra(user_id);
CREATE UNIQUE INDEX idx_users_extra_username ON users_extra(username);
```

### 2. user_sessions
This table tracks user login sessions.

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  metadata JSONB
);

-- Create indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_status ON user_sessions(status);
```

### 3. user_settings
This table stores user settings and preferences.

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',
  accent TEXT DEFAULT 'green',
  font TEXT DEFAULT 'JetBrains Mono',
  chart_style TEXT DEFAULT 'line',
  terminal_height INTEGER DEFAULT 200,
  sidebar_width INTEGER DEFAULT 150,
  ws_url TEXT DEFAULT 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
  api_key TEXT,
  subscription TEXT DEFAULT '{"ticks":"R_10"}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX idx_user_settings_user_id ON user_settings(user_id);
```

### 4. ticks
This table stores market tick data from WebSocket connections.

```sql
CREATE TABLE ticks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  value NUMERIC NOT NULL,
  market TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB
);

-- Create indexes
CREATE INDEX idx_ticks_timestamp ON ticks(timestamp);
CREATE INDEX idx_ticks_market ON ticks(market);
CREATE INDEX idx_ticks_user_id ON ticks(user_id);
```

### 5. predictions
This table stores user predictions and their outcomes.

```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  direction TEXT NOT NULL,
  confidence NUMERIC,
  timeframe TEXT,
  market TEXT NOT NULL,
  result TEXT,
  outcome_at TIMESTAMP WITH TIME ZONE,
  is_correct BOOLEAN,
  start_value NUMERIC,
  end_value NUMERIC,
  metadata JSONB
);

-- Create indexes
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_created_at ON predictions(created_at);
CREATE INDEX idx_predictions_market ON predictions(market);
```

## Enable Google and GitHub OAuth

1. In your Supabase dashboard, go to Authentication → Providers
2. Enable and configure Google OAuth:
   - Enable Google provider
   - Add your Client ID and Client Secret from Google Cloud Console
   - Set the authorized redirect URI to your site's callback URL

3. Enable and configure GitHub OAuth:
   - Enable GitHub provider
   - Add your Client ID and Client Secret from GitHub Developer Settings
   - Set the authorized callback URL to your site's callback URL

## Security Policies

Don't forget to set up Row Level Security (RLS) for your tables:

```sql
-- Example RLS policy for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON user_settings 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings 
  FOR UPDATE USING (auth.uid() = user_id);

-- Similar policies should be created for other tables
```

Make sure to implement similar policies for all tables to secure user data.
