# ✅ WHAT YOU NEED TO CONNECT MSG91

## 🎯 Quick Answer

You need **3 things** from MSG91:

1. **AUTH_KEY** - Your API authentication key
2. **SENDER_ID** - Your brand name (6 characters, e.g., `SVCDA`)
3. **DLT_TE_ID** - DLT Template ID (for India SMS compliance)

---

## 📝 WHERE TO ADD THESE

**File**: `payment-system.js`  
**Lines**: 25-32

Replace these values:

```javascript
const MSG91_CONFIG = {
  AUTH_KEY: 'xxxxxxxxxxxxxxxxxxxxxxxx',  // ← ADD YOUR AUTH KEY HERE
  SENDER_ID: 'SVCDA',                    // ← ADD YOUR SENDER ID HERE
  ROUTE: '4',                             // ← KEEP AS IS
  COUNTRY_CODE: '91',                     // ← KEEP AS IS
  WHATSAPP_NUMBER: '',                    // ← OPTIONAL (for WhatsApp)
  DLT_TE_ID: ''                          // ← ADD YOUR DLT TEMPLATE ID HERE
};
```

---

## 🚀 HOW TO GET THESE

### 1. AUTH_KEY

**Steps**:
1. Go to https://control.msg91.com/signup/
2. Create account (FREE)
3. Login → Settings → API Keys
4. Click "Create New API Key"
5. Copy the key (looks like: `AbCd1234EfGh5678IjKl`)

**Time**: 5 minutes

---

### 2. SENDER_ID

**Steps**:
1. Login to MSG91
2. Settings → Sender ID
3. Click "Add New Sender ID"
4. Enter: `SVCDA` (your brand name)
5. Upload: GST certificate or company registration
6. Submit and wait for approval (2-4 hours)

**Time**: 10 minutes + approval wait

---

### 3. DLT_TE_ID (Template ID)

**Steps**:
1. Login to MSG91
2. DLT → Templates
3. Click "Register New Template"
4. Copy this exact template:

```
Welcome to SVCDA Premium! Name: {#var#} Card No: {#var#} Plan: {#var#} Valid Till: {#var#} Access your card at: https://svcda.in - Team SVCDA
```

5. Submit for approval
6. Wait 1-2 business days for TRAI approval
7. Copy Template ID once approved

**Time**: 10 minutes + 1-2 days approval wait

---

## 💰 DO YOU NEED TO PAY?

**MSG91 Account**: FREE to create

**For Testing**: FREE credits provided

**For Production**: 
- Add credits: Minimum ₹100
- SMS cost: ~₹0.15 - ₹0.25 per message
- Much cheaper than Twilio!

**Example**: 1000 SMS = ₹150-250 only

---

## ⏱️ TOTAL TIME NEEDED

**Today (30 minutes)**:
- ✅ Create MSG91 account (5 min)
- ✅ Get Auth Key (2 min)
- ✅ Register Sender ID (10 min)
- ✅ Create DLT Template (10 min)
- ✅ Add code to payment-system.js (3 min)

**Wait for Approval**:
- Sender ID: 2-4 hours
- DLT Template: 1-2 business days

**Can test basic flow immediately** with test credentials!

---

## 📖 DETAILED GUIDE

Read the complete step-by-step guide:  
**Open**: `MSG91-SETUP-GUIDE.md`

---

## 🎯 READY TO START?

1. **Go to**: https://control.msg91.com/signup/
2. **Create** account
3. **Follow** MSG91-SETUP-GUIDE.md
4. **Update** payment-system.js with your credentials

That's it! Your SMS and WhatsApp will work automatically. 🚀
