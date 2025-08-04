-- Setup Badge System
-- This script creates the badges and user_badges tables

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    criteria_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_badges_created_at ON badges(created_at);

-- Insert some sample badges
INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'First Challenge',
    'Complete your very first challenge',
    NULL,
    '{"type": "challenges_completed", "target": 1, "requirements": [{"description": "Complete 1 challenge", "target": 1}]}'
),
(
    '5 Challenges',
    'Complete 5 challenges',
    NULL,
    '{"type": "challenges_completed", "target": 5, "requirements": [{"description": "Complete 5 challenges", "target": 5}]}'
),
(
    '10 Challenges',
    'Complete 10 challenges',
    NULL,
    '{"type": "challenges_completed", "target": 10, "requirements": [{"description": "Complete 10 challenges", "target": 10}]}'
),
(
    '25 Challenges',
    'Complete 25 challenges',
    NULL,
    '{"type": "challenges_completed", "target": 25, "requirements": [{"description": "Complete 25 challenges", "target": 25}]}'
),
(
    '50 Challenges',
    'Complete 50 challenges',
    NULL,
    '{"type": "challenges_completed", "target": 50, "requirements": [{"description": "Complete 50 challenges", "target": 50}]}'
),
(
    'Level 2',
    'Reach level 2',
    NULL,
    '{"type": "level", "target": 2, "requirements": [{"description": "Reach level 2", "target": 2}]}'
),
(
    'Level 3',
    'Reach level 3',
    NULL,
    '{"type": "level", "target": 3, "requirements": [{"description": "Reach level 3", "target": 3}]}'
),
(
    'Level 4',
    'Reach level 4',
    NULL,
    '{"type": "level", "target": 4, "requirements": [{"description": "Reach level 4", "target": 4}]}'
),
(
    'Level 5',
    'Reach level 5',
    NULL,
    '{"type": "level", "target": 5, "requirements": [{"description": "Reach level 5", "target": 5}]}'
),
(
    '7-Day Streak',
    'Maintain a 7-day streak',
    NULL,
    '{"type": "streak", "target": 7, "requirements": [{"description": "Maintain a 7-day streak", "target": 7}]}'
),
(
    '30-Day Streak',
    'Maintain a 30-day streak',
    NULL,
    '{"type": "streak", "target": 30, "requirements": [{"description": "Maintain a 30-day streak", "target": 30}]}'
),
(
    'Deep Thinker',
    'Complete your first reflection',
    NULL,
    '{"type": "reflection", "target": 1, "requirements": [{"description": "Complete 1 reflection", "target": 1}]}'
),
(
    'Community Builder',
    'Share your first post',
    NULL,
    '{"type": "share", "target": 1, "requirements": [{"description": "Share 1 post", "target": 1}]}'
)
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for badges (read-only for all authenticated users)
CREATE POLICY "Allow authenticated users to read badges" ON badges
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policies for user_badges
CREATE POLICY "Users can view their own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" ON user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT ON badges TO authenticated;
GRANT SELECT, INSERT ON user_badges TO authenticated; 