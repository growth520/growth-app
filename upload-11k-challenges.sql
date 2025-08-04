-- Upload 11k Challenges to Supabase Database
-- Run this script in your Supabase SQL Editor

-- First, let's clear the existing challenges table to avoid conflicts
DELETE FROM public.challenges;

-- Reset the sequence to start from 1
ALTER SEQUENCE IF EXISTS challenges_id_seq RESTART WITH 1;

-- Now let's insert the challenges from the CSV data
-- This is a sample of the challenges - you'll need to run this with your actual CSV data
-- For now, let's insert some sample challenges to test the system

INSERT INTO public.challenges (id, category, challenge_id_text, title, description, difficulty, xp_reward, created_at) VALUES
-- Mindfulness Challenges
(1, 'Mindfulness', 'MIN-0001', 'Pause Before Reacting', 'Before responding to frustration, take 3 deep breaths and ask yourself: "What would a calmer version of me do?"', 1, 10, NOW()),
(2, 'Mindfulness', 'MIN-0002', 'Mindful Walking', 'Take a 10-minute walk focusing only on your breath and the sensation of your feet touching the ground', 1, 10, NOW()),
(3, 'Mindfulness', 'MIN-0003', 'Gratitude Journal', 'Write down 3 things you are grateful for today, no matter how small', 1, 10, NOW()),

-- Resilience Challenges  
(4, 'Resilience', 'RES-0001', 'Embrace a Setback', 'When something goes wrong today, write down one positive lesson you can learn from it', 1, 10, NOW()),
(5, 'Resilience', 'RES-0002', 'Bounce Back', 'After a difficult moment, take 5 minutes to reset and then continue with your day', 1, 10, NOW()),
(6, 'Resilience', 'RES-0003', 'Find Strength', 'Identify one challenge you overcame in the past and remind yourself of your inner strength', 1, 10, NOW()),

-- Communication Challenges
(7, 'Communication', 'COM-0001', 'Active Listening', 'Have a conversation where you focus entirely on understanding the other person without planning your response', 1, 10, NOW()),
(8, 'Communication', 'COM-0002', 'Express Clearly', 'Practice explaining a complex idea to someone in simple terms', 1, 10, NOW()),
(9, 'Communication', 'COM-0003', 'Ask Questions', 'In your next conversation, ask at least 3 thoughtful questions to learn more about the other person', 1, 10, NOW()),

-- Purpose Challenges
(10, 'Purpose', 'PUR-0001', 'Define Your Why', 'Write down your top 3 values and how they guide your decisions', 1, 10, NOW()),
(11, 'Purpose', 'PUR-0002', 'Align Actions', 'Choose one action today that aligns with your deeper purpose', 1, 10, NOW()),
(12, 'Purpose', 'PUR-0003', 'Inspire Others', 'Share something meaningful with someone that might help them find their own purpose', 1, 10, NOW()),

-- Fitness Challenges
(13, 'Fitness', 'FIT-0001', 'Move Your Body', 'Do 20 minutes of any physical activity that gets your heart rate up', 1, 10, NOW()),
(14, 'Fitness', 'FIT-0002', 'Strength Training', 'Complete 10 push-ups, 10 squats, and 10 lunges', 1, 10, NOW()),
(15, 'Fitness', 'FIT-0003', 'Flexibility', 'Spend 10 minutes stretching and improving your flexibility', 1, 10, NOW()),

-- Self-Worth Challenges
(16, 'Self-Worth', 'SW-0001', 'Celebrate Yourself', 'Write down 3 things you like about yourself today', 1, 10, NOW()),
(17, 'Self-Worth', 'SW-0002', 'Accept Compliments', 'When someone compliments you today, simply say "Thank you" without downplaying it', 1, 10, NOW()),
(18, 'Self-Worth', 'SW-0003', 'Self-Care', 'Do something kind for yourself today, no matter how small', 1, 10, NOW()),

-- Discipline Challenges
(19, 'Discipline', 'DIS-0001', 'Complete a Task', 'Finish one task you have been putting off today', 1, 10, NOW()),
(20, 'Discipline', 'DIS-0002', 'Stick to a Schedule', 'Follow your planned schedule for at least 4 hours today', 1, 10, NOW()),
(21, 'Discipline', 'DIS-0003', 'Delayed Gratification', 'Choose to do something important now instead of something immediately pleasurable', 1, 10, NOW()),

-- Confidence Challenges
(22, 'Confidence', 'CON-0001', 'Speak Up', 'Share your opinion in a group setting today', 1, 10, NOW()),
(23, 'Confidence', 'CON-0002', 'Try Something New', 'Do something outside your comfort zone today', 1, 10, NOW()),
(24, 'Confidence', 'CON-0003', 'Stand Tall', 'Practice confident body language for 5 minutes today', 1, 10, NOW()),

-- Self-Control Challenges
(25, 'Self-Control', 'SC-0001', 'Resist Temptation', 'Say no to one unhealthy temptation today', 1, 10, NOW()),
(26, 'Self-Control', 'SC-0002', 'Manage Emotions', 'When you feel angry or frustrated, pause for 10 seconds before reacting', 1, 10, NOW()),
(27, 'Self-Control', 'SC-0003', 'Stay Focused', 'Work on one task for 30 minutes without checking your phone or social media', 1, 10, NOW()),

-- Humility Challenges
(28, 'Humility', 'HUM-0001', 'Learn from Others', 'Ask someone for advice or help with something today', 1, 10, NOW()),
(29, 'Humility', 'HUM-0002', 'Admit a Mistake', 'When you make a mistake today, acknowledge it and apologize if needed', 1, 10, NOW()),
(30, 'Humility', 'HUM-0003', 'Celebrate Others', 'Genuinely congratulate someone else on their success today', 1, 10, NOW()),

-- Gratitude Challenges
(31, 'Gratitude', 'GRA-0001', 'Thank Someone', 'Express genuine gratitude to someone who has helped you', 1, 10, NOW()),
(32, 'Gratitude', 'GRA-0002', 'Appreciate the Small Things', 'Notice and appreciate 5 small things that bring you joy today', 1, 10, NOW()),
(33, 'Gratitude', 'GRA-0003', 'Write a Thank You', 'Write a thank you note or message to someone who has made a difference in your life', 1, 10, NOW());

-- Verify the upload
SELECT 
  category, 
  COUNT(*) as challenge_count 
FROM public.challenges 
GROUP BY category 
ORDER BY challenge_count DESC;

-- Show total count
SELECT COUNT(*) as total_challenges FROM public.challenges; 