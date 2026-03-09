
-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  tutor_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, tutor_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Conversations RLS: participants can view/create
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = student_id OR auth.uid() IN (
  SELECT user_id FROM public.tutor_profiles WHERE id = tutor_id
));

CREATE POLICY "Students can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Participants can update conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = student_id OR auth.uid() IN (
  SELECT user_id FROM public.tutor_profiles WHERE id = tutor_id
));

-- Messages RLS: conversation participants
CREATE POLICY "Conversation participants can view messages"
ON public.messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = conversation_id
  AND (auth.uid() = c.student_id OR auth.uid() IN (
    SELECT user_id FROM public.tutor_profiles WHERE id = c.tutor_id
  ))
));

CREATE POLICY "Conversation participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (auth.uid() = c.student_id OR auth.uid() IN (
      SELECT user_id FROM public.tutor_profiles WHERE id = c.tutor_id
    ))
  )
);

CREATE POLICY "Recipients can mark messages as read"
ON public.messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = conversation_id
  AND (auth.uid() = c.student_id OR auth.uid() IN (
    SELECT user_id FROM public.tutor_profiles WHERE id = c.tutor_id
  ))
));

-- Notifications RLS
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Indexes
CREATE INDEX idx_conversations_student ON public.conversations(student_id);
CREATE INDEX idx_conversations_tutor ON public.conversations(tutor_id);
CREATE INDEX idx_conversations_last_msg ON public.conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read);

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Create a function to get or create conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_student_id uuid, p_tutor_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE student_id = p_student_id AND tutor_id = p_tutor_id;

  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (student_id, tutor_id)
    VALUES (p_student_id, p_tutor_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for message attachments
CREATE POLICY "Authenticated users can upload message attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Anyone can view message attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-attachments');
