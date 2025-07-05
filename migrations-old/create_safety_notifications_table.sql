-- Create safety_notifications table if it doesn't exist
-- This table is used for safety message notifications

CREATE TABLE IF NOT EXISTS safety_notifications (
    notification_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,  -- This should be auth_user_id
    message_id UUID NOT NULL REFERENCES chat_messages(message_id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Add index for faster lookups
    INDEX idx_safety_notifications_user_id (user_id),
    INDEX idx_safety_notifications_room_id (room_id),
    INDEX idx_safety_notifications_created_at (created_at)
);