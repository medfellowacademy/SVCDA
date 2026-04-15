-- SVCDA Platform Database Schema
-- Run this in Supabase SQL Editor

-- 1. Create Employees Table (FIRST - referenced by other tables)
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'employee',
  status TEXT DEFAULT 'active',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_employees_email ON employees(email);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on employees" ON employees
  FOR ALL USING (true);

-- 2. Create Members Table (references employees)
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT,
  plan TEXT DEFAULT 'Basic',
  card_number TEXT UNIQUE,
  amount DECIMAL(10,2),
  payment_id TEXT,
  added_by UUID REFERENCES employees(id),
  added_by_name TEXT,
  status TEXT DEFAULT 'Active',
  card_pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_added_by ON members(added_by);
CREATE INDEX idx_members_created_at ON members(created_at DESC);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on members" ON members
  FOR ALL USING (true);

-- 3. Create Activity Log Table
CREATE TABLE activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  member_id UUID REFERENCES members(id),
  member_name TEXT,
  phone TEXT,
  service TEXT,
  payment TEXT,
  added_by UUID REFERENCES employees(id),
  added_by_name TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_timestamp ON activity(timestamp DESC);
CREATE INDEX idx_activity_type ON activity(type);

ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on activity" ON activity
  FOR ALL USING (true);

-- 4. Create Settings Table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on settings" ON settings
  FOR ALL USING (true);

-- 5. Insert Default Data
INSERT INTO employees (name, email, password, role) VALUES
  ('Default Employee', 'default@svcda.org', 'emp123', 'employee'),
  ('Admin Employee', 'admin@svcda.org', 'emp123', 'admin');

INSERT INTO settings (key, value) VALUES
  ('admin_pin', 'admin123'),
  ('sms_webhook', ''),
  ('twilio_config', '{}');

-- Success message
SELECT 'Database setup complete! 4 tables created, 2 employees added.' AS status;
