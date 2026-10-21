-- Applied to FlowApp via Supabase MCP migration add_event_type.
-- Remote migration version: 20261021133950.
ALTER TABLE public.events
  ADD COLUMN type text NOT NULL DEFAULT 'default'
  CONSTRAINT events_type_check CHECK (type IN ('default', 'event', 'meeting', 'workout'));
