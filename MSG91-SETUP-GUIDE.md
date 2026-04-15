# 📱 MSG91 Setup Guide for SVCDA

## ✅ Why MSG91 Instead of Twilio?

- 🇮🇳 **Indian Company** - Better support for India
- 💰 **Lower Costs** - Cheaper than Twilio for Indian numbers
- ⚡ **Better Delivery** - Optimized for Indian telecom
- 📋 **DLT Compliant** - Built-in TRAI DLT support
- 🎯 **Easy Setup** - Dashboard in English/Hindi

---

## 🚀 COMPLETE SETUP GUIDE

### Step 1: Create MSG91 Account (5 minutes)

1. **Go to**: https://control.msg91.com/signup/
2. **Fill Details**:
   - Name
   - Email
   - Mobile Number (+91 XXXXXXXXXX)
   - Company Name: SVCDA
3. **Verify** email and mobile
4. **Login** to dashboard

---

### Step 2: Get Your Auth Key (2 minutes)

1. **Login** to MSG91 dashboard
2. **Go to**: Settings → API Keys (left sidebar)
3. **Click**: "Create New API Key"
4. **Copy** your Auth Key (looks like: `xxxxxxxxxxxxxxxxxxxxxxxx`)
5. **Save it** - You'll need this!

---

### Step 3: Register Sender ID (10 minutes)

1. **Go to**: Settings → Sender ID
2. **Click**: "Add New Sender ID"
3. **Enter Details**:
   - Sender ID: `SVCDA` (6 characters, uppercase)
   - Purpose: Transactional
   - Upload documents (GST certificate or company registration)
4. **Submit** for approval
5. **Wait** 2-4 hours for approval

**Note**: Until approved, use test Sender ID provided by MSG91

---

### Step 4: DLT Template Registration (IMPORTANT!)

**What is DLT?**
- TRAI (Telecom Regulatory Authority of India) requirement
- All commercial SMS in India MUST have approved DLT template
- Without DLT, SMS won't be delivered!

**Steps:**

1. **Go to**: DLT → Templates
2. **Click**: "Register New Template"
3. **Template Content** (copy this exact format):
```
Welcome to SVCDA Premium! Name: {#var#} Card No: {#var#} Plan: {#var#} Valid Till: {#var#} Access your card at: https://svcda.in - Team SVCDA
```

4. **Fill Details**:
   - Template Type: Transactional
   - Category: Financial/Service
   - Content Type: Text
   - Entity ID: (will be provided by MSG91)
   
5. **Submit** for approval
6. **Wait** 1-2 business days for TRAI approval
7. **Copy** Template ID once approved (looks like: `1234567890123456789`)

---

### Step 5: Configure in Your Code (3 minutes)

1. **Open** `payment-system.js` in your code editor
2. **Find** lines 25-32 (MSG91_CONFIG section)
3. **Replace** with your credentials:

```javascript
const MSG91_CONFIG = {
  AUTH_KEY: 'your_auth_key_here',        // FROM STEP 2
  SENDER_ID: 'SVCDA',                    // FROM STEP 3
  ROUTE: '4',                            // Keep as 4 (Transactional)
  COUNTRY_CODE: '91',                    // Keep as 91 (India)
  WHATSAPP_NUMBER: '',                   // Leave empty for now
  DLT_TE_ID: 'your_template_id_here'    // FROM STEP 4
};
```

**Example** (with fake credentials):
```javascript
const MSG91_CONFIG = {
  AUTH_KEY: '123456AbCdEf789GhIjK',
  SENDER_ID: 'SVCDA',
  ROUTE: '4',
  COUNTRY_CODE: '91',
  WHATSAPP_NUMBER: '',
  DLT_TE_ID: '1207163928374821901'
};
```

4. **Save** the file

---

### Step 6: Add Credits to MSG91 Account

1. **Go to**: Billing → Recharge
2. **Select** amount (minimum ₹100)
3. **Add Credits** via:
   - Credit/Debit Card
   - Net Banking
   - UPI
4. **SMS Cost**: ~₹0.10 - ₹0.25 per SMS (depends on route)

---

### Step 7: WhatsApp Setup (OPTIONAL)

**For WhatsApp Business API:**

1. **Go to**: WhatsApp → Get Started
2. **Apply** for WhatsApp Business API
3. **Provide**:
   - Business Name: SVCDA
   - Business Category: Community Service
   - Facebook Business Manager ID
4. **Verification** takes 3-7 days
5. Once approved, get your WhatsApp number
6. Add to `MSG91_CONFIG.WHATSAPP_NUMBER`

**Cost**: WhatsApp is more expensive (₹0.30 - ₹1.00 per message)

---

## 🧪 TESTING

### Test SMS Sending:

1. **Open** browser console (F12)
2. **Run** test:
```javascript
// Test SMS (after configuring MSG91)
sendSMS('+919876543210', 'Test message from SVCDA!');
```

3. **Check**:
   - ✅ Console shows "SMS sent via MSG91"
   - ✅ You receive SMS on your phone
   - ✅ Sender ID shows "SVCDA"

### Common Test Issues:

**"DLT Template not approved"**
- Wait for TRAI approval (1-2 days)
- Use placeholder template for testing

**"Invalid Sender ID"**
- Wait for Sender ID approval
- Use test Sender ID: `MSGIND`

**"Insufficient credits"**
- Add credits to your account

---

## 💰 PRICING (As of April 2026)

| Service | Cost per Message |
|---------|------------------|
| Transactional SMS | ₹0.15 - ₹0.25 |
| Promotional SMS | ₹0.10 - ₹0.15 |
| WhatsApp | ₹0.30 - ₹1.00 |
| OTP SMS | ₹0.20 - ₹0.30 |

**For 1000 members**:
- SMS only: ~₹150 - ₹250
- SMS + WhatsApp: ~₹450 - ₹1250

**Much cheaper than Twilio for India!**

---

## 📋 QUICK REFERENCE

### What You Need:

| Item | Where to Get | Example |
|------|--------------|---------|
| **Auth Key** | Settings → API Keys | `123AbcDef456GhiJkl` |
| **Sender ID** | Settings → Sender ID | `SVCDA` |
| **DLT Template ID** | DLT → Templates | `1207163928374821901` |
| **Route** | Fixed value | `4` (Transactional) |

### MSG91 Dashboard Links:

- **Main Dashboard**: https://control.msg91.com/
- **API Keys**: https://control.msg91.com/app/settings/apikey
- **Sender ID**: https://control.msg91.com/app/settings/senderid
- **DLT Templates**: https://control.msg91.com/app/dlt/
- **SMS Logs**: https://control.msg91.com/app/reports/sms
- **Credits/Billing**: https://control.msg91.com/app/billing

---

## 🔧 CODE CHANGES MADE

### Files Updated:

1. **`payment-system.js`**:
   - ✅ Removed Twilio code
   - ✅ Added MSG91 SMS API
   - ✅ Added MSG91 WhatsApp API
   - ✅ Indian phone number format support

### How It Works:

**Before (Twilio)**:
```javascript
sendSMS('+919876543210', 'Message')
→ Calls Twilio API (US-based)
→ Routes through international gateway
→ Expensive
```

**Now (MSG91)**:
```javascript
sendSMS('+919876543210', 'Message')
→ Calls MSG91 API (India-based)
→ Direct route to Indian telecom
→ Cheaper & faster
```

---

## 📞 MSG91 SUPPORT

**Need Help?**
- **Email**: hello@msg91.com
- **Phone**: +91-9650983685
- **Support Portal**: https://help.msg91.com/
- **Live Chat**: Available on dashboard

**Response Time**: Usually 2-4 hours

---

## ⚠️ IMPORTANT NOTES

### DLT Compliance:

1. **MUST** have DLT-approved template
2. **CANNOT** send without Template ID
3. Template approval takes 1-2 business days
4. Non-compliance = SMS won't be delivered

### Message Format:

**Your Template**:
```
Welcome to SVCDA Premium! Name: {#var#} Card No: {#var#} Plan: {#var#} Valid Till: {#var#} Access your card at: https://svcda.in - Team SVCDA
```

**System sends** (replaces {#var#}):
```
Welcome to SVCDA Premium! Name: Rajesh Kumar Card No: SVCDA123456 Plan: Premium Valid Till: 15/04/2027 Access your card at: https://svcda.in - Team SVCDA
```

---

## 🎯 QUICK START CHECKLIST

- [ ] Create MSG91 account
- [ ] Verify email and mobile
- [ ] Get Auth Key from dashboard
- [ ] Register Sender ID (SVCDA)
- [ ] Create DLT Template
- [ ] Wait for DLT approval (1-2 days)
- [ ] Add credits to account (min ₹100)
- [ ] Update `payment-system.js` with credentials
- [ ] Test SMS sending
- [ ] Go live!

---

## 🚀 PRODUCTION READY!

Once you complete these steps:

1. ✅ SMS will be sent automatically after payment
2. ✅ WhatsApp messages (if configured)
3. ✅ All India mobile numbers supported
4. ✅ DLT compliant (legal requirement)
5. ✅ Cost-effective solution

**Your SVCDA platform is now ready with MSG91 integration!** 🎉

---

**Last Updated**: April 15, 2026  
**System**: MSG91 v5 API  
**Status**: Production Ready
