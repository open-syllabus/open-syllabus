-- Fix the trigger to work with the new room_members table instead of room_memberships

-- First, drop the old trigger on room_memberships
DROP TRIGGER IF EXISTS create_student_chatbot_instances_trigger ON public.room_memberships;

-- Create the same trigger on the new room_members table
CREATE TRIGGER create_student_chatbot_instances_trigger 
AFTER INSERT ON public.room_members 
FOR EACH ROW 
EXECUTE FUNCTION create_student_chatbot_instances();

-- Also create a trigger for when chatbots are added to rooms
-- This ensures existing students get instances for new chatbots
CREATE OR REPLACE FUNCTION create_chatbot_instances_for_new_room_chatbot()
RETURNS TRIGGER AS $$
BEGIN
    -- When a chatbot is added to a room, create instances for all students in that room
    INSERT INTO public.student_chatbot_instances (student_id, chatbot_id, room_id)
    SELECT 
        rm.student_id,
        NEW.chatbot_id,
        NEW.room_id
    FROM 
        public.room_members rm
    WHERE 
        rm.room_id = NEW.room_id
    ON CONFLICT (student_id, chatbot_id, room_id) 
    DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for when chatbots are added to rooms
DROP TRIGGER IF EXISTS create_chatbot_instances_for_new_room_chatbot_trigger ON public.room_chatbots;
CREATE TRIGGER create_chatbot_instances_for_new_room_chatbot_trigger 
AFTER INSERT ON public.room_chatbots 
FOR EACH ROW 
EXECUTE FUNCTION create_chatbot_instances_for_new_room_chatbot();

-- Now create instances for all existing assessment bots that are missing instances
-- This will fix the current data
INSERT INTO public.student_chatbot_instances (student_id, chatbot_id, room_id)
SELECT DISTINCT
    rm.student_id,
    rc.chatbot_id,
    rc.room_id
FROM 
    public.room_chatbots rc
    INNER JOIN public.chatbots c ON rc.chatbot_id = c.chatbot_id
    INNER JOIN public.room_members rm ON rc.room_id = rm.room_id
WHERE 
    c.bot_type = 'assessment'
    AND NOT EXISTS (
        SELECT 1 
        FROM public.student_chatbot_instances sci 
        WHERE sci.student_id = rm.student_id 
        AND sci.chatbot_id = rc.chatbot_id 
        AND sci.room_id = rc.room_id
    )
ON CONFLICT (student_id, chatbot_id, room_id) 
DO NOTHING;