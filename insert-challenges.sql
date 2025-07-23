-- Insert sample challenges to test the system
-- Run this in Supabase SQL Editor

INSERT INTO challenges (id, category, challenge_id_text, title, description) VALUES
(1, 'Confidence', 'CON-001', 'Make eye contact with someone for at least 3 seconds.', 'Make eye contact with someone for at least 3 seconds.'),
(2, 'Confidence', 'CON-002', 'Start a conversation with a stranger.', 'Start a conversation with a stranger.'),
(3, 'Confidence', 'CON-003', 'Give a genuine compliment to someone today.', 'Give a genuine compliment to someone today.'),
(4, 'Confidence', 'CON-004', 'Raise your hand or speak once in a group setting.', 'Raise your hand or speak once in a group setting.'),
(5, 'Confidence', 'CON-005', 'Record yourself saying something positive about yourself.', 'Record yourself saying something positive about yourself.'),
(14, 'Confidence', 'CON-014', 'Test challenge for completion', 'Test challenge for completion'),
(15, 'Leadership', 'LEA-001', 'Lead a small group discussion.', 'Lead a small group discussion.'),
(16, 'Communication', 'COM-001', 'Practice active listening in a conversation.', 'Practice active listening in a conversation.')
ON CONFLICT (id) DO NOTHING; 