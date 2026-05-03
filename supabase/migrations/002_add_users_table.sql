-- Rookies - Add Users Table for Clerk Auth
-- Run this in Supabase SQL Editor
-- ============================================

-- ─── Users (Clerk Auth identity records) ───
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast Clerk ID lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);

