# Supabase Setup Guide for SVCDA Platform

## Step 1: Create Supabase Account & Project

1. **Sign up for Supabase:**
   - Go to https://supabase.com
   - Click "Start your project"
   - Sign up with GitHub or email

2. **Create New Project:**
   - Click "New Project"
   - Organization: Create new or use existing
   - Name: `svcda-platform`
   - Database Password: Create a strong password (save it!)
   - Region: Choose `South Asia (Mumbai)` for India
   - Click "Create new project"
   - Wait 2-3 minutes for provisioning

3. **Get API Credentials:**
   - Go to Settings (⚙️) → API
   - Copy:
     - **Project URL** (looks like: https://xxxxx.supabase.co)
     - **anon/public key** (long string starting with eyJ...)
   - Open `supabase-config.js` 
   - Replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your values

---

## Step 2: Create Database Tables

Go to **SQL Editor** in Supabase dashboard and run these SQL commands:

### 1. Create Members Table
```sql
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

-- Add index for faster searches
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_added_by ON members(added_by);
CREATE INDEX idx_members_created_at ON members(created_at DESC);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (you can restrict later)
CREATE POLICY "Allow all operations on members" ON members
  FOR ALL USING (true);
```

### 2. Create Employees Table
```sql
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- In production, use hashed passwords
  role TEXT DEFAULT 'employee',
  status TEXT DEFAULT 'active',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for email lookups
CREATE INDEX idx_employees_email ON employees(email);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations
CREATE POLICY "Allow all operations on employees" ON employees
  FOR ALL USING (true);
```

### 3. Create Activity Log Table
```sql
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

-- Add index for timestamp
CREATE INDEX idx_activity_timestamp ON activity(timestamp DESC);
CREATE INDEX idx_activity_type ON activity(type);

-- Enable Row Level Security
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations
CREATE POLICY "Allow all operations on activity" ON activity
  FOR ALL USING (true);
```

### 4. Create Settings Table
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations
CREATE POLICY "Allow all operations on settings" ON settings
  FOR ALL USING (true);
```

### 5. Insert Default Employees
```sql
-- Insert default employee accounts
INSERT INTO employees (name, email, password, role) VALUES
  ('Default Employee', 'employee@svcda.in', 'emp123', 'employee'),
  ('Sarah Johnson', 'sarah@svcda.in', 'emp123', 'employee');

-- Insert admin PIN setting
INSERT INTO settings (key, value) VALUES
  ('admin_pin', 'admin123'),
  ('sms_webhook', '');
```

---

## Step 3: Update HTML Files

Add Supabase SDK to ALL HTML files (before closing `</head>` tag):

```html
<!-- Supabase SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../supabase-config.js"></script>
```

For pages in root folder (index.html), use:
```html
<script src="./supabase-config.js"></script>
```

---

## Step 4: Test the Integration

1. **Open Admin Panel:**
   - Go to `pages/admin.html`
   - Login with PIN: `admin123`
   - You should see 2 employees in the table

2. **Test Employee Login:**
   - Go to `pages/employee-login.html`
   - Login with: `employee@svcda.in` / `emp123`
   - Should redirect to dashboard

3. **Test Adding Member:**
   - In employee dashboard, click "Add Premium Member"
   - Fill form and complete payment
   - Member should save to Supabase database
   - View in Supabase Dashboard → Table Editor → members

---

## Step 5: Enable Storage for PDF Cards

1. **Create Storage Bucket:**
   - Go to Storage in Supabase dashboard
   - Click "New bucket"
   - Name: `premium-cards`
   - Public bucket: Yes (so PDFs are accessible)
   - Click "Create bucket"

2. **Set up Storage Policy:**
```sql
-- Allow public read access to premium cards
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'premium-cards' );

-- Allow authenticated insert
CREATE POLICY "Allow insert for authenticated"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'premium-cards' );
```

---

## Step 6: Optional - Set up MSG91 SMS Integration

### Get MSG91 Credentials:
1. Sign up at https://msg91.com
2. Go to Dashboard → Get Auth Key
3. Create Sender ID (e.g., "SVCDA")
4. Get Flow ID for SMS template

### Add to Supabase Settings:
```sql
INSERT INTO settings (key, value) VALUES
  ('msg91_auth_key', 'YOUR_AUTH_KEY_HERE'),
  ('msg91_sender_id', 'SVCDA'),
  ('msg91_flow_id', 'YOUR_FLOW_ID');
```

---

## Step 7: Migrate Existing Data (if any)

If you have data in localStorage, run this in browser console on admin page:

```javascript
// Get existing members from localStorage
const oldMembers = JSON.parse(localStorage.getItem('svcda_members') || '[]');

// Migrate to Supabase
async function migrateData() {
  for (const member of oldMembers) {
    try {
      await db.members.create({
        name: member.name,
        phone: member.phone,
        email: member.email,
        location: member.location,
        plan: member.plan || 'Premium',
        card_number: member.cardNumber,
        amount: member.amount,
        payment_id: member.paymentId,
        added_by_name: member.addedByName || 'Legacy',
        status: member.status || 'Active'
      });
      console.log('Migrated:', member.name);
    } catch (error) {
      console.error('Error migrating:', member.name, error);
    }
  }
  console.log('Migration complete!');
}

// Run migration
migrateData();
```

---

## Deployment Checklist

✅ **Completed:**
- [ ] Supabase account created
- [ ] Project created
- [ ] API credentials copied to `supabase-config.js`
- [ ] All SQL tables created
- [ ] Default employees inserted
- [ ] Supabase SDK added to HTML files
- [ ] Employee login tested
- [ ] Member registration tested
- [ ] Storage bucket created
- [ ] Admin panel tested

✅ **Optional:**
- [ ] MSG91 credentials added
- [ ] Existing data migrated
- [ ] Row Level Security policies customized
- [ ] Password hashing implemented (for production)

---

## Pricing & Limits (Free Tier)

✅ **Included in FREE plan:**
- 500MB database storage (50K+ members)
- Unlimited API requests
- 1GB file storage (for PDF cards)
- 2GB bandwidth/month
- Social OAuth providers
- 50K monthly active users
- Real-time subscriptions

**When to upgrade ($25/month):**
- Need more than 500MB database
- Need more than 1GB file storage
- Need more than 2GB bandwidth
- Need daily backups

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **SQL Reference:** https://www.postgresql.org/docs/
- **Support:** https://supabase.com/dashboard/support

---

## Next Steps

After completing setup, you can:
1. Customize Row Level Security policies for better security
2. Add password hashing for employee accounts
3. Implement SMS notifications with MSG91
4. Add PDF generation with Supabase Edge Functions
5. Set up automated backups
6. Add analytics and reporting
