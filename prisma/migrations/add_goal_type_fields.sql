-- Add new fields to goals table for type and trimester tracking
-- Migration: add_goal_type_fields
-- Created: 2026-01-18

-- Add type field (trimestral, semestral, anual, custom)
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'custom';

-- Add trimesters field to store calculated trimester labels
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS trimesters TEXT;

-- Add trimester_values field to store trimester numbers as array
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS trimester_values INTEGER[];

-- Add comment to explain the fields
COMMENT ON COLUMN goals.type IS 'Type of goal: trimestral, semestral, anual, or custom';
COMMENT ON COLUMN goals.trimesters IS 'Calculated trimester labels (e.g., "1º Trimestre, 2º Trimestre")';
COMMENT ON COLUMN goals.trimester_values IS 'Array of trimester numbers (1-4) that this goal covers';
