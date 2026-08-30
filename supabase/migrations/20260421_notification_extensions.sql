-- ==========================================
-- 🔔 NOTIFICATION SYSTEM EXTENSIONS
-- ==========================================

-- 1. Push Subscriptions Table
-- Stores the browser-generated WebPush keys for each user.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_json JSONB NOT NULL,
  device_type TEXT, -- 'mobile', 'desktop', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subscription_json)
);

-- 2. Notification Settings Table
-- Allows users to toggle specific types of alerts.
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  enable_push BOOLEAN DEFAULT TRUE,
  enable_email BOOLEAN DEFAULT FALSE, -- Future use
  notify_on_team_activity BOOLEAN DEFAULT TRUE,
  notify_on_followups BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can manage own push_subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- Users can manage their own settings
CREATE POLICY "Users can manage own notification_settings" ON notification_settings
  FOR ALL USING (user_id = auth.uid());

-- 4. Automatically create settings for new users
CREATE OR REPLACE FUNCTION handle_new_user_notifications()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We add this to the existing auth.users trigger flow
DROP TRIGGER IF EXISTS on_auth_user_created_notifications ON auth.users;
CREATE TRIGGER on_auth_user_created_notifications
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_notifications();

-- Pre-fill settings for existing users
INSERT INTO notification_settings (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;
