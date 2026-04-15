# Twilio SMS & WhatsApp Integration Guide for SVCDA Platform

## Overview

Twilio is the #1 cloud communications platform for SMS, WhatsApp, and voice. Perfect for SVCDA Platform.

### **Pricing (India)**
- **SMS (India):** ₹0.50 - ₹1.00 per message
- **WhatsApp:** $0.0042 - $0.02 per message (₹0.35 - ₹1.65)
- **Free Trial:** $15 credit (300-3000 messages)
- **No monthly fees** - Pay only for what you use

---

## Step 1: Create Twilio Account

### 1.1 Sign Up

1. **Go to Twilio:**
   - Visit: https://www.twilio.com/try-twilio
   - Click "Sign up and start building"

2. **Enter Details:**
   - First name, Last name
   - Email address
   - Password (strong password)

3. **Verify Email:**
   - Check your email
   - Click verification link

4. **Verify Phone:**
   - Enter your phone number with country code (+91...)
   - Enter OTP code received via SMS

### 1.2 Complete Setup

1. **Answer Questions:**
   - Which Twilio product? → **SMS**
   - What do you plan to build? → **Notifications & User Verification**
   - How do you want to build? → **With code**
   - Programming language? → **JavaScript**

2. **Get Free Trial Credit:**
   - You'll receive **$15 free credit** (₹1200)
   - Good for 300-3000 messages

---

## Step 2: Get Twilio Credentials

### 2.1 Get Account SID and Auth Token

1. **Go to Console:**
   - Login to https://console.twilio.com
   - You'll see your Dashboard

2. **Copy Credentials:**
   ```
   Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Auth Token: (click "Show" to reveal)
   ```

3. **Save Securely:**
   - Store in password manager
   - Never commit to Git
   - Never share publicly

### 2.2 Get a Phone Number

1. **Get Trial Number (Free):**
   - Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
   - Click "Get a trial number"
   - Accept the number shown
   - **Format:** +1 555 123 4567

2. **For Production - Buy Number ($1/month):**
   - Go to: Phone Numbers → Buy a number
   - Search for **India** number
   - Capabilities needed: ✓ SMS, ✓ Voice
   - Cost: ~$1-2/month
   - **Recommended for production**

### 2.3 Set Up WhatsApp (Optional)

1. **WhatsApp Sandbox (Free - For Testing):**
   - Go to: Messaging → Try it out → Send a WhatsApp message
   - You'll see: `whatsapp:+14155238886`
   - Send "join [your-code]" to this number from your WhatsApp
   - You can now send/receive WhatsApp messages in sandbox

2. **WhatsApp Business API (Production):**
   - For production use
   - Requires Facebook Business Manager account
   - Meta verification needed
   - Setup guide: https://www.twilio.com/docs/whatsapp/tutorial/connect-number-business-profile

---

## Step 3: Configure SVCDA Platform

### 3.1 Update Twilio Configuration File

**Edit: `twilio-integration.js`**

```javascript
const TWILIO_CONFIG = {
  ACCOUNT_SID: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Your Account SID
  AUTH_TOKEN: 'your_auth_token_here', // Your Auth Token
  PHONE_NUMBER: '+15551234567', // Your Twilio phone number
  WHATSAPP_NUMBER: 'whatsapp:+14155238886', // WhatsApp sandbox (or your number)
  API_BASE: 'https://api.twilio.com/2010-04-01'
};
```

### 3.2 Store in Supabase (Recommended)

**In Supabase SQL Editor:**

```sql
-- Save Twilio credentials securely in Supabase
INSERT INTO settings (key, value) VALUES
  ('twilio_account_sid', 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
  ('twilio_auth_token', 'your_auth_token_here'),
  ('twilio_phone_number', '+15551234567'),
  ('twilio_whatsapp_number', 'whatsapp:+14155238886');
```

**Benefits:**
- ✅ Credentials not in code
- ✅ Easy to update without redeploying
- ✅ Can be updated from admin panel

---

## Step 4: Add to HTML Pages

### 4.1 Add to Employee Dashboard

**Edit: `pages/employee-dashboard.html`**

Add before `</head>`:

```html
<!-- Twilio Integration -->
<script src="../twilio-integration.js"></script>
```

### 4.2 Add to Admin Panel

**Edit: `pages/admin.html`**

Add before `</head>`:

```html
<!-- Twilio Integration -->
<script src="../twilio-integration.js"></script>
```

---

## Step 5: Use in Employee Dashboard

### 5.1 Update Premium Member Registration

**Edit the `saveUserAfterPayment()` function:**

```javascript
async function saveUserAfterPayment(userData, paymentResponse) {
  const cardNumber = 'SVCDA' + String(Date.now()).slice(-8);
  const location = (userData.city ? userData.city + ', ' : '') + (userData.district || '');
  
  try {
    // Save to Supabase
    const member = await db.members.create({
      card_number: cardNumber,
      name: userData.name,
      phone: userData.phone,
      email: userData.email || null,
      location: location,
      plan: 'Premium',
      amount: userData.amount,
      payment_id: paymentResponse.razorpay_payment_id,
      added_by: currentEmployee.id,
      added_by_name: currentEmployee.name,
      status: 'Active'
    });

    // Log activity
    await db.activity.create({
      type: 'Premium Registration',
      member_id: member.id,
      member_name: userData.name,
      phone: userData.phone,
      service: 'Premium Card',
      payment: paymentResponse.razorpay_payment_id,
      added_by: currentEmployee.id,
      added_by_name: currentEmployee.name
    });

    // ✅ NEW: Send SMS & WhatsApp notifications via Twilio
    const notifications = await notifyPremiumCardComplete(member);
    
    if (notifications.sms?.success) {
      console.log('✓ SMS sent successfully');
    }
    
    if (notifications.whatsapp?.success) {
      console.log('✓ WhatsApp sent successfully');
    } else if (notifications.directLink) {
      console.log('✓ WhatsApp direct link opened');
    }

    // Show success message
    alert(`✅ Premium Member Registered!\n\n` +
          `Name: ${userData.name}\n` +
          `Card: ${cardNumber}\n` +
          `Payment: ${paymentResponse.razorpay_payment_id}\n\n` +
          `Notifications sent via ${notifications.sms?.success ? 'SMS' : ''} ${notifications.whatsapp?.success ? '& WhatsApp' : ''}`);
    
    // Refresh dashboard
    await loadStats();
    switchTab('users');
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
  }
}
```

---

## Step 6: Add Twilio Settings to Admin Panel

### 6.1 Add UI for Twilio Configuration

**Edit: `pages/admin.html`**

Find the settings section and add:

```html
<div class="admin-panel">
  <h3 style="margin:0 0 10px;color:var(--n)">Twilio Integration Settings</h3>
  
  <div class="admin-row">
    <input type="text" id="twilioAccountSid" placeholder="Account SID (ACxxxxx...)">
    <input type="password" id="twilioAuthToken" placeholder="Auth Token">
  </div>
  
  <div class="admin-row">
    <input type="text" id="twilioPhoneNumber" placeholder="Phone Number (+1555...)">
    <input type="text" id="twilioWhatsAppNumber" placeholder="WhatsApp Number (optional)">
    <button id="saveTwilioConfig">Save Twilio Config</button>
    <button id="testTwilioConfig" class="alt">Test Connection</button>
  </div>
  
  <p class="admin-sub" style="margin:6px 0 0">
    Get credentials from <a href="https://console.twilio.com" target="_blank">Twilio Console</a>
  </p>
</div>
```

### 6.2 Add JavaScript for Twilio Settings

**Edit: `assets/js/admin-supabase.js`**

Add to `initActions()` function:

```javascript
// Save Twilio Configuration
byId('saveTwilioConfig').addEventListener('click', async function() {
  const config = {
    accountSid: byId('twilioAccountSid').value.trim(),
    authToken: byId('twilioAuthToken').value.trim(),
    phoneNumber: byId('twilioPhoneNumber').value.trim(),
    whatsappNumber: byId('twilioWhatsAppNumber').value.trim()
  };
  
  if (!config.accountSid || !config.authToken || !config.phoneNumber) {
    alert('Please enter Account SID, Auth Token, and Phone Number');
    return;
  }
  
  const saved = await saveTwilioConfig(config);
  if (saved) {
    alert('✅ Twilio configuration saved successfully!');
  } else {
    alert('❌ Failed to save Twilio configuration');
  }
});

// Test Twilio Connection
byId('testTwilioConfig').addEventListener('click', async function() {
  const result = await verifyTwilioConfig();
  
  if (result.valid) {
    alert(`✅ Twilio Connected!\n\nAccount: ${result.accountName}\nStatus: ${result.status}`);
  } else {
    alert(`❌ Connection Failed\n\nError: ${result.error}`);
  }
});

// Load existing Twilio config
async function loadTwilioSettings() {
  const accountSid = await db.settings.get('twilio_account_sid');
  const phoneNumber = await db.settings.get('twilio_phone_number');
  const whatsappNumber = await db.settings.get('twilio_whatsapp_number');
  
  if (accountSid) byId('twilioAccountSid').value = accountSid;
  if (phoneNumber) byId('twilioPhoneNumber').value = phoneNumber;
  if (whatsappNumber) byId('twilioWhatsAppNumber').value = whatsappNumber;
}

// Call on page load
loadTwilioSettings();
```

---

## Step 7: Test Integration

### 7.1 Test SMS

**In browser console (employee dashboard or admin panel):**

```javascript
// Test SMS to your phone
sendSMS('+919876543210', 'Test SMS from SVCDA Platform').then(result => {
  if (result.success) {
    console.log('✅ SMS sent! Message SID:', result.messageSid);
  } else {
    console.error('❌ Failed:', result.error);
  }
});
```

### 7.2 Test WhatsApp

**First, join WhatsApp sandbox:**
1. Open WhatsApp on your phone
2. Send message to: **+1 415 523 8886**
3. Message text: **join [your-sandbox-code]**
   (You'll see the code in Twilio Console → Messaging → Try WhatsApp)

**Then test in console:**

```javascript
// Test WhatsApp to your phone
sendWhatsAppMessage('+919876543210', '🎉 Test WhatsApp from SVCDA!').then(result => {
  if (result.success) {
    console.log('✅ WhatsApp sent! Message SID:', result.messageSid);
  } else {
    console.error('❌ Failed:', result.error);
  }
});
```

### 7.3 Test Premium Card Notification

```javascript
// Test complete notification flow
const testMember = {
  name: 'Test User',
  phone: '+919876543210',
  card_number: 'SVCDA12345678',
  amount: 1499,
  payment_id: 'pay_test123'
};

notifyPremiumCardComplete(testMember).then(results => {
  console.log('SMS:', results.sms);
  console.log('WhatsApp:', results.whatsapp);
  console.log('Direct Link:', results.directLink);
});
```

---

## Step 8: Verify in Twilio Console

1. **Go to Logs:**
   - https://console.twilio.com/us1/monitor/logs/sms
   - You'll see all sent messages

2. **Check Message Status:**
   - ✅ Delivered
   - ⏳ Sent
   - ❌ Failed

3. **View Usage & Billing:**
   - https://console.twilio.com/us1/billing/usage
   - See how much credit you've used

---

## Production Checklist

### Before Going Live:

✅ **Twilio Account:**
- [ ] Account created and verified
- [ ] Free $15 credit available
- [ ] Buy production phone number ($1-2/month)
- [ ] Complete Facebook Business verification (for WhatsApp)

✅ **Configuration:**
- [ ] Credentials saved in Supabase settings
- [ ] Test SMS sent successfully
- [ ] Test WhatsApp sent successfully
- [ ] Error handling tested

✅ **Integration:**
- [ ] Added to employee dashboard
- [ ] Added to admin panel
- [ ] Notifications working after payment
- [ ] Logs visible in Twilio console

✅ **Compliance:**
- [ ] Add opt-out instructions in messages
- [ ] Follow Twilio's messaging policies
- [ ] GDPR compliance (if applicable)

---

## Cost Estimation

### SMS Costs (India):
- Transactional SMS: ₹0.50 - ₹1.00 per message
- 100 members/month: ₹50 - ₹100/month
- 1000 members/month: ₹500 - ₹1000/month

### WhatsApp Costs (India):
- Business-initiated: $0.0042 - $0.02 per message (₹0.35 - ₹1.65)
- User-initiated: Free
- 100 members/month: ₹35 - ₹165/month
- 1000 members/month: ₹350 - ₹1650/month

### Phone Number:
- Trial: Free
- Production: $1-2/month (₹80-160/month)

### **Example Total Cost:**
For 100 premium members/month:
- SMS (100 messages): ₹50-100
- WhatsApp (100 messages): ₹35-165
- Phone number: ₹80-160
- **Total: ₹165-425/month**

---

## Troubleshooting

### SMS Not Sending:

**1. Check Trial Account Limitations:**
- Trial accounts can only send to verified numbers
- Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
- Add your test phone numbers

**2. Check Phone Number Format:**
```javascript
// ✅ Correct
sendSMS('+919876543210', 'Message');

// ❌ Wrong
sendSMS('9876543210', 'Message');  // Missing country code
sendSMS('+91-9876543210', 'Message');  // Has dashes
```

**3. Check Credentials:**
```javascript
console.log('Account SID:', TWILIO_CONFIG.ACCOUNT_SID);
console.log('Phone Number:', TWILIO_CONFIG.PHONE_NUMBER);
// Both should not be empty
```

**4. Check Twilio Logs:**
- Go to: https://console.twilio.com/us1/monitor/logs/sms
- Look for error messages

### WhatsApp Not Sending:

**1. Join Sandbox First:**
- Send "join [code]" to WhatsApp sandbox number
- From Twilio Console → Messaging → Try WhatsApp

**2. Check WhatsApp Number Format:**
```javascript
// ✅ Correct
WHATSAPP_NUMBER: 'whatsapp:+14155238886'

// ❌ Wrong
WHATSAPP_NUMBER: '+14155238886'  // Missing 'whatsapp:' prefix
```

**3. For Production:**
- Need Facebook Business Manager account
- WhatsApp Business profile approved
- Message templates pre-approved

### CORS Errors:

**If you get CORS errors making direct API calls from browser:**

**Solution 1: Use Server-Side**
- Create API endpoint on your backend
- Call Twilio from server (Node.js/Python)

**Solution 2: Use Twilio Functions**
- https://www.twilio.com/docs/runtime/functions
- Create serverless function in Twilio
- Call from your frontend

---

## Advanced Features

### 1. Message Templates (WhatsApp)

Create pre-approved templates for WhatsApp Business:

```javascript
// Template with variables
const template = {
  name: 'premium_card_ready',
  language: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: member.name },
        { type: 'text', text: member.card_number }
      ]
    }
  ]
};
```

### 2. Delivery Status Webhooks

Get real-time delivery status updates:

1. **Set Webhook URL:**
   - Twilio Console → Phone Numbers → Your Number
   - Messaging → Status Callback URL
   - Enter: `https://your-api.com/twilio/webhook`

2. **Handle Webhook:**
```javascript
// In your backend
app.post('/twilio/webhook', (req, res) => {
  const { MessageSid, MessageStatus, To } = req.body;
  console.log(`Message ${MessageSid} to ${To}: ${MessageStatus}`);
  res.sendStatus(200);
});
```

### 3. Two-Way SMS

Receive SMS replies:

```javascript
// Set webhook for incoming SMS
// Twilio Console → Phone Numbers → Your Number → Messaging
// Webhook: https://your-api.com/twilio/incoming

app.post('/twilio/incoming', (req, res) => {
  const { From, Body } = req.body;
  console.log(`Received from ${From}: ${Body}`);
  
  // Auto-reply
  const twiml = new Twilio.twiml.MessagingResponse();
  twiml.message('Thank you! We received your message.');
  res.type('text/xml').send(twiml.toString());
});
```

---

## Best Practices

### 1. Use Direct WhatsApp Links for Free Messages
```javascript
// FREE - No API cost
openWhatsAppDirect('+919876543210', 'Hello from SVCDA!');
```

### 2. SMS for Critical Notifications
- Payment confirmations
- Premium card generation
- OTP verification

### 3. WhatsApp for Rich Content
- Marketing messages
- Product catalogs
- Customer support

### 4. Rate Limiting
```javascript
// Don't send too many messages at once
async function sendBulkSMS(recipients, message) {
  for (const phone of recipients) {
    await sendSMS(phone, message);
    await new Promise(r => setTimeout(r, 1000)); // 1 second delay
  }
}
```

### 5. Error Handling
```javascript
const result = await sendSMS(phone, message);

if (!result.success) {
  // Log error
  console.error('SMS failed:', result.error);
  
  // Fallback to WhatsApp direct link
  openWhatsAppDirect(phone, message);
}
```

---

## Support & Resources

- **Twilio Console:** https://console.twilio.com
- **Documentation:** https://www.twilio.com/docs
- **API Reference:** https://www.twilio.com/docs/sms/api
- **Support:** https://support.twilio.com
- **Community:** https://www.twilio.com/community

---

## Summary

**For SVCDA Platform:**

✅ **Implemented:**
- Complete Twilio SMS integration
- WhatsApp messaging support
- Direct WhatsApp links (FREE)
- Premium card notifications
- Payment confirmations

✅ **Setup Time:** ~30 minutes

✅ **Cost:** $15 free trial (300-3000 messages)
- Then ₹0.50-1.00 per SMS
- ₹0.35-1.65 per WhatsApp message

✅ **Recommended:** Use mix of:
- Direct WhatsApp links (FREE) for user   initiation
- Twilio SMS for critical notifications
- Twilio WhatsApp for marketing (optional)

**You're ready to send SMS and WhatsApp messages! 🚀**
