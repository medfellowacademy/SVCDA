-- GVCDA Supabase Migration
-- Run this in the Supabase SQL Editor to fix schema for employee dashboard member saves
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS guards)

-- 1. Add missing columns to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Drop UUID FK constraints so local EMP_<timestamp> employee IDs are accepted
--    and replace with plain TEXT columns
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_added_by_fkey;
ALTER TABLE members ALTER COLUMN added_by TYPE TEXT USING added_by::TEXT;

ALTER TABLE activity DROP CONSTRAINT IF EXISTS activity_added_by_fkey;
ALTER TABLE activity ALTER COLUMN added_by TYPE TEXT USING added_by::TEXT;

ALTER TABLE activity DROP CONSTRAINT IF EXISTS activity_member_id_fkey;
ALTER TABLE activity ALTER COLUMN member_id TYPE TEXT USING member_id::TEXT;

-- 3. Confirm
SELECT 'Migration complete. members.payment_method, members.notes added. FK constraints relaxed to TEXT.' AS status;
