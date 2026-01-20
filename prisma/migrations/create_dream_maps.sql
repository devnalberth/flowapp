-- Create dream_maps table (CORRIGIDO PARA UUID)
CREATE TABLE IF NOT EXISTS dream_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  goal_id UUID,
  image_url TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_dream_maps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_dream_maps_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL
);

-- Indices and RLS
CREATE INDEX IF NOT EXISTS idx_dream_maps_user_id ON dream_maps(user_id);
ALTER TABLE dream_maps ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own dream maps" ON dream_maps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own dream maps" ON dream_maps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own dream maps" ON dream_maps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own dream maps" ON dream_maps FOR DELETE USING (auth.uid() = user_id);