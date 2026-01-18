-- Create dream_maps table
CREATE TABLE IF NOT EXISTS dream_maps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  goal_id TEXT,
  image_url TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key to users table
  CONSTRAINT fk_dream_maps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Optional foreign key to goals table (if exists)
  CONSTRAINT fk_dream_maps_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_dream_maps_user_id ON dream_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_maps_created_at ON dream_maps(created_at DESC);

-- Enable Row Level Security
ALTER TABLE dream_maps ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own dream maps
CREATE POLICY "Users can view their own dream maps"
  ON dream_maps FOR SELECT
  USING (auth.uid()::text = user_id);

-- Create policy for users to insert their own dream maps
CREATE POLICY "Users can insert their own dream maps"
  ON dream_maps FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Create policy for users to update their own dream maps
CREATE POLICY "Users can update their own dream maps"
  ON dream_maps FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Create policy for users to delete their own dream maps
CREATE POLICY "Users can delete their own dream maps"
  ON dream_maps FOR DELETE
  USING (auth.uid()::text = user_id);
