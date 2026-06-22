-- SQL Script to set up database schema for ShadowDictate features:
-- Onboarding profile, Leaderboard, Attendance rewards and Admin config

-- 1. Extend user_stats table with Onboarding and Attendance columns
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS job text;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS learning_need text;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS last_checkin_date date;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS checkin_streak integer DEFAULT 0;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS checkin_history jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS additional_creations integer DEFAULT 0;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create attendance_config table for daily attendance reward configurations
CREATE TABLE IF NOT EXISTS public.attendance_config (
    id text PRIMARY KEY,
    rewards jsonb NOT null
);

-- 3. Populate default rewards for 7 days (Monday = 1, Sunday = 7)
INSERT INTO public.attendance_config (id, rewards)
VALUES ('weekly_rewards', '[
  {"dayOfWeek": 1, "rewardType": "multiplier", "rewardValue": 2, "rewardLabel": "Nhân 2 kinh nghiệm (x2 XP)"},
  {"dayOfWeek": 2, "rewardType": "creation", "rewardValue": 1, "rewardLabel": "Thêm 1 lượt tạo bài học"},
  {"dayOfWeek": 3, "rewardType": "xp", "rewardValue": 50, "rewardLabel": "+50 XP thưởng"},
  {"dayOfWeek": 4, "rewardType": "creation", "rewardValue": 2, "rewardLabel": "Thêm 2 lượt tạo bài học"},
  {"dayOfWeek": 5, "rewardType": "xp", "rewardValue": 100, "rewardLabel": "+100 XP thưởng"},
  {"dayOfWeek": 6, "rewardType": "multiplier", "rewardValue": 3, "rewardLabel": "Nhân 3 kinh nghiệm (x3 XP)"},
  {"dayOfWeek": 7, "rewardType": "creation", "rewardValue": 3, "rewardLabel": "Thêm 3 lượt tạo bài học + 150 XP"}
]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. Create trigger to enforce weekly creation limit at the database server level
CREATE OR REPLACE FUNCTION public.check_dialogue_creation_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_device_uuid TEXT;
    v_additional_limit INTEGER := 0;
    v_count INTEGER;
    v_max_allowed INTEGER;
BEGIN
    -- Only check user-created dialogues
    IF NEW.id LIKE 'dialogue-%' THEN
        -- NEW.id format is dialogue-{deviceUuid}-{timestamp}
        -- Extract deviceUuid by replacing the 'dialogue-' prefix and the ending '-{timestamp}'
        -- Example: dialogue-dev-abc-123456789 -> dev-abc
        v_device_uuid := regexp_replace(NEW.id, '^dialogue-(.+)-\d+$', '\1');
        
        IF v_device_uuid = NEW.id OR v_device_uuid IS NULL OR v_device_uuid = '' THEN
            RAISE EXCEPTION 'Invalid dialogue ID format';
        END IF;

        -- Fetch user stats additional creations
        SELECT COALESCE(additional_creations, 0)
        INTO v_additional_limit
        FROM public.user_stats
        WHERE id = 'stats_' || v_device_uuid;

        v_max_allowed := 50 + v_additional_limit;

        -- Count user's dialogues created in the last 7 days (not including system seeds)
        SELECT COUNT(*)
        INTO v_count
        FROM public.dialogues
        WHERE id LIKE 'dialogue-' || v_device_uuid || '-%'
          AND created_at >= (NOW() - INTERVAL '7 days')
          AND is_deleted = false;

        IF v_count >= v_max_allowed THEN
            RAISE EXCEPTION 'Giới hạn tạo bài học: Bạn đã đạt giới hạn tối đa % bài trong tuần này (bao gồm lượt thưởng). Hãy điểm danh để nhận thêm lượt tạo.', v_max_allowed;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_check_dialogue_creation_limit ON public.dialogues;

-- Create trigger
CREATE TRIGGER trg_check_dialogue_creation_limit
BEFORE INSERT ON public.dialogues
FOR EACH ROW
EXECUTE FUNCTION public.check_dialogue_creation_limit();

