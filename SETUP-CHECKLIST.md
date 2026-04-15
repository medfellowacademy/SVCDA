# ✅ SVCDA SETUP CHECKLIST

## Before You Can Go Live - Quick Checklist

### 🔴 CRITICAL (Must Do Now!)

- [ ] **Run Supabase SQL Schema**
  - [ ] Login to https://ugpnumgppmhtnozskxdq.supabase.co
  - [ ] Go to SQL Editor
  - [ ] Open `supabase-tables.sql` file
  - [ ] Copy entire content
  - [ ] Paste in SQL Editor and click **Run**
  - [ ] Verify tables created: employees, members, activity, settings

- [ ] **Configure MSG91 (SMS & WhatsApp)**
  - [ ] Sign up at https://control.msg91.com/signup/
  - [ ] Get Auth Key from Settings → API Keys
  - [ ] Get Sender ID (6 characters, e.g., SVCDA)
  - [ ] Register DLT Template (for India compliance)
  - [ ] Edit `payment-system.js` lines 25-32
  - [ ] Replace AUTH_KEY, SENDER_ID, DLT_TE_ID

- [ ] **Configure Razorpay (Payment)**
  - [ ] Sign up at https://dashboard.razorpay.com/signup
  - [ ] Get Test Key ID: `rzp_test_...`
  - [ ] Edit `payment-system.js` line 19
  - [ ] Replace KEY_ID with your key

### 🟡 IMPORTANT (Do Before Launch)

- [ ] **Test Complete Flow**
  - [ ] Register new user (`pages/register.html`)
  - [ ] Make test payment (use card: 4111 1111 1111 1111)
  - [ ] Verify SMS received (if Twilio configured)
  - [ ] Verify WhatsApp received (if Twilio configured)
  - [ ] Check member appears in admin panel
  - [ ] Check activity logged

- [ ] **Create Employee Account**
  - [ ] Go to Supabase dashboard → Table Editor → employees
  - [ ] Insert new row:
    - name: Your Name
    - email: your@email.com
    - password: yourpassword (plain text for now)
    - role: admin
  - [ ] Test login at `pages/employee-login.html`

- [ ] **Test Member Login**
  - [ ] Go to `pages/member-login.html`
  - [ ] Try login with registered phone number
  - [ ] Verify dashboard shows correct data

### 🟢 OPTIONAL (Nice to Have)

- [ ] Update pricing in `pages/premium-card.html`
- [ ] Customize SMS message in `payment-system.js` line 69
- [ ] Customize WhatsApp message in `payment-system.js` line 91
- [ ] Add more employee accounts
- [ ] Set up backup for database
- [ ] Get SSL certificate for domain
- [ ] Switch to Razorpay LIVE keys

---

## 🚀 Quick Start Commands

### 1. Run SQL Schema (Supabase)
```
Go to: https://ugpnumgppmhtnozskxdq.supabase.co
→ SQL Editor
→ Copy from supabase-tables.sql
→ Paste and Run
```

### 2. Configure MSG91 (payment-system.js)
```javascript
const MSG91_CONFIG = {
  AUTH_KEY: 'xxxxxxxx',          // Replace this
  SENDER_ID: 'SVCDA',            // Replace this
  ROUTE: '4',                    // 4 = Transactional
  DLT_TE_ID: 'xxxxxxxxx'         // Replace this
};
```

### 3. Configure Razorpay (payment-system.js)
```javascript
const RAZORPAY_CONFIG = {
  KEY_ID: 'rzp_test_xxxxxxxx',  // Replace this
  // ... rest stays same
};
```

### 4. Test Payment
```
1. Open pages/register.html
2. Fill form and submit
3. On premium page, click "Pay Now"
4. Use test card: 4111 1111 1111 1111
5. CVV: 123, Expiry: 12/25
6. Complete payment
7. Check SMS/WhatsApp
```

---

## 📂 Key Files Reference

| File | What It Does |
|------|--------------|
| `payment-system.js` | **CONFIGURE THIS** - Razorpay + Twilio credentials |
| `supabase-config.js` | Database connection (already configured ✅) |
| `supabase-tables.sql` | Database schema (run in Supabase) |
| `pages/register.html` | User registration |
| `pages/premium-card.html` | Payment page |
| `pages/member-login.html` | Member login |
| `pages/member-dashboard.html` | Member view |
| `pages/employee-dashboard.html` | Employee panel |

---

## 🧪 Test Data

### Test Card (Razorpay)
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits (e.g., `123`)
- Expiry: Any future date (e.g., `12/25`)

### Test Phone Number
- Use any valid Indian number: `+91 9876543210`
- Format accepted: `+919876543210`, `919876543210`, `9876543210`

---

## ❓ Need Help?

### If SMS Not Sending:
1. Check MSG91 credentials in `payment-system.js`
2. Verify MSG91 account has credits
3. Check DLT Template is approved
4. Check browser console (F12) for errors
5. Verify phone number format: `+91xxxxxxxxxx`

### If Payment Not Saving:
1. Check Supabase tables are created
2. Verify `supabase-config.js` credentials
3. Check browser console for errors
4. Check Supabase → Logs

### If Member Can't Login:
1. Verify member exists in Supabase members table
2. Check phone number format matches
3. Clear browser cache/cookies
4. Try incognito mode

---

## 📞 Support

- **Read**: `PRODUCTION-SYSTEM-GUIDE.md` (full documentation)
- **Phone**: +91 8978210705
- **Email**: info@svcdaservicehub.com

---

**Last Updated**: Today
**System Status**: ✅ Ready to Configure
