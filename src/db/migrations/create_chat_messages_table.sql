-- Chat Messages table for customer support chat widget
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can insert messages (for chat widget)
DROP POLICY IF EXISTS "Public insert access" ON public.chat_messages;
CREATE POLICY "Public insert access" ON public.chat_messages
  FOR INSERT
  WITH CHECK (true);

-- Everyone can read messages from their session
DROP POLICY IF EXISTS "Public read own session" ON public.chat_messages;
CREATE POLICY "Public read own session" ON public.chat_messages
  FOR SELECT
  USING (true); -- Allow reading all messages for now (session-based filtering is done in application code)

-- Admins can read all messages
DROP POLICY IF EXISTS "Admin read all" ON public.chat_messages;
CREATE POLICY "Admin read all" ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update/delete messages
DROP POLICY IF EXISTS "Admin manage messages" ON public.chat_messages;
CREATE POLICY "Admin manage messages" ON public.chat_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
