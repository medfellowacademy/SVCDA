# 🚀 Supabase Quick Setup Guide

## ✅ What You Need to Add in Supabase

Your Supabase is **already configured** with the credentials! You just need to **create the database tables**.

---

## 📋 Step-by-Step Instructions

### Step 1: Login to Supabase
1. Go to https://supabase.com/dashboard
2. Login with your account
3. Select your project: **ugpnumgppmhtnozskxdq** (already configured in the code)

---

### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"+ New Query"** button

---

### Step 3: Copy and Run SQL

1. **Copy ALL the code** from the file `supabase-tables.sql` in your project folder
2. **Paste** it into the SQL Editor
3. Click **"Run"** button (or press Ctrl/Cmd + Enter)

**That's it!** ✅

---

## 🎯 What This Creates

### 4 Database Tables:

#### 1. **employees** 
   - Stores employee/admin login data
   - Default employees created:
     - **Email:** `default@svcda.org` | **Password:** `emp123`
     - **Email:** `admin@svcda.org` | **Password:** `emp123` (admin)

#### 2. **members**
   - Stores premium card members
   - Includes: name, phone, email, card number, payment details
   - Links to employee who added them

#### 3. **activity**
   - Logs all actions (payments, registrations, etc.)
   - Tracks who did what and when

#### 4. **settings**
   - System configuration
   - Admin PIN: `admin123`

---

## ✅ Verify Setup

After running the SQL:

1. Click **"Table Editor"** in left sidebar
2. You should see **4 tables**:
   - ✅ employees
   - ✅ members
   - ✅ activity
   - ✅ settings

3. Click on **"employees"** table
   - You should see **2 rows** (default employees)

4. Click on **"settings"** table
   - You should see **3 rows** (admin_pin, sms_webhook, twilio_config)

---

## 🔐 Default Credentials

### Employee Login
- **URL:** https://svcda.vercel.app/pages/employee-login.html
- **Email:** `default@svcda.org`
- **Password:** `emp123`

### Admin Login
- **URL:** https://svcda.vercel.app/pages/admin.html
- **PIN:** `admin123`

---

## 🚨 Important Notes

### Already Configured in Code ✅
These are **already set** in your `supabase-config.js`:
```javascript
SUPABASE_URL = 'https://ugpnumgppmhtnozskxdq.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGci...' // Full key already in code
```

### Using Vite (Environment Variables)
If deploying to Vercel, the credentials are loaded from `.env`:
```
VITE_SUPABASE_URL=https://ugpnumgppmhtnozskxdq.supabase.co
VITE_SUPABASE_KEY=eyJhbGci...
```

---

## 🧪 Test Your Setup

### Test 1: Member Registration
1. Go to `pages/register.html`
2. Create a test account
3. Check **"members"** table in Supabase
4. You should see the new member!

### Test 2: Payment Flow
1. Go to `pages/premium-card.html`
2. Fill form and pay (use test card: `4111 1111 1111 1111`)
3. Check **"members"** table
4. Check **"activity"** table - should log the payment

### Test 3: Employee Login
1. Go to `pages/employee-login.html`
2. Login with `default@svcda.org` / `emp123`
3. Should redirect to employee dashboard

---

## 📊 Database Structure Visualization

```
┌─────────────┐       ┌─────────────┐
│  employees  │       │   members   │
├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ added_by    │
│ email       │       │ card_number │
│ password    │       │ phone       │
│ role        │       │ payment_id  │
└─────────────┘       └─────────────┘
                             │
                             │
                             ▼
                      ┌─────────────┐
                      │  activity   │
                      ├─────────────┤
                      │ id (PK)     │
                      │ member_id   │
                      │ type        │
                      │ timestamp   │
                      └─────────────┘

          ┌─────────────┐
          │  settings   │
          ├─────────────┤
          │ key (PK)    │
          │ value       │
          └─────────────┘
```

---

## 🔧 Troubleshooting

### Error: "relation already exists"
- **Solution:** Tables already created! You're good to go.

### Error: "permission denied"
- **Solution:** Check you're logged into correct Supabase project

### Can't see tables in Table Editor
- **Solution:** Refresh the page, or click "Database" → "Tables"

### Employee login not working
- **Solution:** 
  1. Check **employees** table has data
  2. Verify email: `default@svcda.org`
  3. Verify password: `emp123`

---

## 🎉 Next Steps

After Supabase setup is complete:

1. ✅ **Configure MSG91** (for SMS)
   - See `MSG91-SETUP-GUIDE.md`

2. ✅ **Configure Razorpay** (for payments)
   - Get live key from dashboard
   - Update in Vercel environment variables

3. ✅ **Optional: Setup EmailJS** (for emails)
   - See `VERCEL-DEPLOYMENT.md`

4. ✅ **Deploy to Vercel**
   - See `VERCEL-DEPLOYMENT.md`

---

## 📞 Need Help?

**Can't figure it out?**
- Email: info@svcdaservicehub.com
- Phone: +91 8978210705

**Reference Files:**
- `supabase-tables.sql` - Full SQL to run
- `SUPABASE-SETUP.md` - Detailed setup guide
- `VERCEL-DEPLOYMENT.md` - Deployment guide

---

## ✨ Summary

**What to do:**
1. Login to Supabase dashboard
2. Go to SQL Editor
3. Copy & paste ALL code from `supabase-tables.sql`
4. Click "Run"
5. Done! ✅

**Time needed:** 2 minutes

**Your Supabase credentials are already in the code - nothing to configure!** 🎉
