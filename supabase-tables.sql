-- GVCDA Platform Database Schema
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

-- 5. Create Job Applications Table
CREATE TABLE job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  age INTEGER,
  qualification TEXT,
  experience DECIMAL(4,1),
  position TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT NOT NULL,
  skills TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES employees(id),
  reviewed_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_applications_created_at ON job_applications(created_at DESC);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_position ON job_applications(position);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on job_applications" ON job_applications
  FOR ALL USING (true);

-- 6. Create Payments Table (for tracking all Razorpay payments)
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  razorpay_payment_id TEXT UNIQUE NOT NULL,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'success',
  method TEXT,
  email TEXT,
  phone TEXT,
  name TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on payments" ON payments
  FOR ALL USING (true);

-- 7. Insert Default Data
INSERT INTO employees (name, email, password, role) VALUES
  ('Default Employee', 'default@gvcda.org', 'emp123', 'employee'),
  ('Admin Employee', 'admin@gvcda.org', 'emp123', 'admin');

INSERT INTO settings (key, value) VALUES
  ('admin_pin', 'admin123'),
  ('sms_webhook', ''),
  ('twilio_config', '{}');

-- Success message
SELECT 'Database setup complete! 6 tables created (employees, members, activity, settings, job_applications, payments). 2 employees added.' AS status;
