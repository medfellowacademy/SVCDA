/**
 * Twilio SMS & WhatsApp Integration for SVCDA Platform
 * 
 * Features:
 * - Send SMS notifications
 * - Send WhatsApp messages
 * - Premium card notifications
 * - Payment confirmations
 * - OTP verification
 */

// Twilio Configuration
const TWILIO_CONFIG = {
  ACCOUNT_SID: '', // Get from https://console.twilio.com
  AUTH_TOKEN: '', // Get from https://console.twilio.com
  PHONE_NUMBER: '', // Your Twilio phone number (e.g., +15551234567)
  WHATSAPP_NUMBER: '', // Your Twilio WhatsApp number (e.g., whatsapp:+14155238886)
  API_BASE: 'https://api.twilio.com/2010-04-01'
};

/**
 * Send SMS via Twilio
 * @param {string} to - Phone number with country code (e.g., +919876543210)
 * @param {string} message - SMS message content
 */
async function sendSMS(to, message) {
  if (!TWILIO_CONFIG.ACCOUNT_SID || !TWILIO_CONFIG.AUTH_TOKEN) {
    console.warn('Twilio not configured. SMS not sent.');
    return { success: false, error: 'Twilio not configured' };
  }

  // Ensure phone number has + prefix
  const phoneNumber = to.startsWith('+') ? to : '+' + to;

  try {
    const url = `${TWILIO_CONFIG.API_BASE}/Accounts/${TWILIO_CONFIG.ACCOUNT_SID}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', phoneNumber);
    formData.append('From', TWILIO_CONFIG.PHONE_NUMBER);
    formData.append('Body', message);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(TWILIO_CONFIG.ACCOUNT_SID + ':' + TWILIO_CONFIG.AUTH_TOKEN),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('SMS sent successfully:', data.sid);
      return { success: true, messageSid: data.sid, data };
    } else {
      console.error('SMS sending failed:', data);
      return { success: false, error: data.message || 'Failed to send SMS' };
    }
  } catch (error) {
    console.error('SMS API error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send WhatsApp message via Twilio
 * @param {string} to - Phone number with country code (e.g., +919876543210)
 * @param {string} message - WhatsApp message content
 */
async function sendWhatsAppMessage(to, message) {
  if (!TWILIO_CONFIG.ACCOUNT_SID || !TWILIO_CONFIG.AUTH_TOKEN) {
    console.warn('Twilio not configured. WhatsApp message not sent.');
    return { success: false, error: 'Twilio not configured' };
  }

  // Ensure phone number has + prefix and whatsapp: prefix
  const phoneNumber = to.startsWith('+') ? to : '+' + to;
  const whatsappNumber = 'whatsapp:' + phoneNumber;

  try {
    const url = `${TWILIO_CONFIG.API_BASE}/Accounts/${TWILIO_CONFIG.ACCOUNT_SID}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', whatsappNumber);
    formData.append('From', TWILIO_CONFIG.WHATSAPP_NUMBER);
    formData.append('Body', message);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(TWILIO_CONFIG.ACCOUNT_SID + ':' + TWILIO_CONFIG.AUTH_TOKEN),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('WhatsApp message sent successfully:', data.sid);
      return { success: true, messageSid: data.sid, data };
    } else {
      console.error('WhatsApp sending failed:', data);
      return { success: false, error: data.message || 'Failed to send WhatsApp message' };
    }
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Open WhatsApp Direct Link (FREE - No API required)
 * This works without Twilio API - 100% FREE
 */
function openWhatsAppDirect(phone, message) {
  // Remove + and any spaces/dashes
  const cleanPhone = phone.replace(/[^\d]/g, '');
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

/**
 * Send OTP via SMS
 * @param {string} to - Phone number
 * @param {string} otp - OTP code
 */
async function sendOTP(to, otp) {
  const message = `Your SVCDA verification code is: ${otp}\n\nValid for 10 minutes.\n\nDo not share this code with anyone.`;
  return await sendSMS(to, message);
}

/**
 * Send Premium Card Notification via SMS
 */
async function sendPremiumCardSMS(member) {
  const phone = member.phone.startsWith('+') ? member.phone : '+91' + member.phone.replace(/\D/g, '');
  
  const message = `Dear ${member.name},

Your SVCDA Premium Card is ready!

Card Number: ${member.card_number}
Amount Paid: ₹${member.amount}
Payment ID: ${member.payment_id}

Benefits:
✓ Priority support
✓ Exclusive discounts
✓ Verified digital identity

Download: https://svcda.in/card/${member.card_number}

Thank you for choosing SVCDA!`;

  return await sendSMS(phone, message);
}

/**
 * Send Premium Card Notification via WhatsApp
 */
async function sendPremiumCardWhatsApp(member) {
  const phone = member.phone.startsWith('+') ? member.phone : '+91' + member.phone.replace(/\D/g, '');
  
  const message = `🎉 *SVCDA Premium Card Activated!*

*Name:* ${member.name}
*Card Number:* ${member.card_number}
*Amount:* ₹${member.amount}

*Benefits:*
✓ Priority customer support
✓ Exclusive discounts up to 80%
✓ Verified digital identity
✓ Fast-track service

Download your card: https://svcda.in/card/${member.card_number}

Thank you for choosing SVCDA! 🙏`;

  return await sendWhatsAppMessage(phone, message);
}

/**
 * Send Payment Confirmation
 */
async function sendPaymentConfirmation(member, paymentId) {
  const phone = member.phone.startsWith('+') ? member.phone : '+91' + member.phone.replace(/\D/g, '');
  
  const message = `✅ Payment Successful!

Name: ${member.name}
Amount: ₹${member.amount}
Payment ID: ${paymentId}
Status: Confirmed

Your Premium Card will be generated shortly and sent to your WhatsApp.

SVCDA - Small Village & City Development Agency`;

  return await sendSMS(phone, message);
}

/**
 * Send both SMS and WhatsApp for Premium Card
 */
async function notifyPremiumCardComplete(member) {
  const results = {
    sms: null,
    whatsapp: null,
    directLink: false
  };

  // Send SMS notification
  try {
    results.sms = await sendPremiumCardSMS(member);
  } catch (error) {
    console.error('Failed to send SMS:', error);
    results.sms = { success: false, error: error.message };
  }

  // Send WhatsApp via Twilio API (if configured)
  if (TWILIO_CONFIG.WHATSAPP_NUMBER) {
    try {
      results.whatsapp = await sendPremiumCardWhatsApp(member);
    } catch (error) {
      console.error('Failed to send WhatsApp:', error);
      results.whatsapp = { success: false, error: error.message };
    }
  } else {
    // Fallback to direct WhatsApp link (FREE)
    const phone = member.phone.replace(/\D/g, '');
    const message = `🎉 SVCDA Premium Card Activated!\n\nName: ${member.name}\nCard: ${member.card_number}\nAmount: ₹${member.amount}\n\nDownload: https://svcda.in/card/${member.card_number}\n\nThank you!`;
    openWhatsAppDirect(phone, message);
    results.directLink = true;
  }

  return results;
}

/**
 * Send Service Enquiry Confirmation
 */
async function sendServiceEnquiry(phone, name, service) {
  const cleanPhone = phone.startsWith('+') ? phone : '+91' + phone.replace(/\D/g, '');
  
  const message = `Dear ${name},

Thank you for your enquiry about ${service}.

Our team will contact you shortly.

For urgent assistance:
📞 Call: +91 8978210705
💬 WhatsApp: https://wa.me/918978210705

SVCDA Team`;

  return await sendSMS(cleanPhone, message);
}

/**
 * Verify Twilio Configuration
 */
async function verifyTwilioConfig() {
  if (!TWILIO_CONFIG.ACCOUNT_SID || !TWILIO_CONFIG.AUTH_TOKEN) {
    return { 
      valid: false, 
      error: 'Account SID and Auth Token are required' 
    };
  }

  try {
    const url = `${TWILIO_CONFIG.API_BASE}/Accounts/${TWILIO_CONFIG.ACCOUNT_SID}.json`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + btoa(TWILIO_CONFIG.ACCOUNT_SID + ':' + TWILIO_CONFIG.AUTH_TOKEN)
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        valid: true,
        accountName: data.friendly_name,
        status: data.status
      };
    } else {
      return {
        valid: false,
        error: 'Invalid credentials'
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Load Twilio config from Supabase settings
 */
async function loadTwilioConfig() {
  if (typeof db === 'undefined') {
    console.warn('Supabase not loaded. Using default Twilio config.');
    return;
  }

  try {
    TWILIO_CONFIG.ACCOUNT_SID = await db.settings.get('twilio_account_sid') || '';
    TWILIO_CONFIG.AUTH_TOKEN = await db.settings.get('twilio_auth_token') || '';
    TWILIO_CONFIG.PHONE_NUMBER = await db.settings.get('twilio_phone_number') || '';
    TWILIO_CONFIG.WHATSAPP_NUMBER = await db.settings.get('twilio_whatsapp_number') || '';
    
    console.log('Twilio configuration loaded from Supabase');
  } catch (error) {
    console.error('Failed to load Twilio config from Supabase:', error);
  }
}

/**
 * Save Twilio config to Supabase settings
 */
async function saveTwilioConfig(config) {
  if (typeof db === 'undefined') {
    console.error('Supabase not loaded. Cannot save Twilio config.');
    return false;
  }

  try {
    await db.settings.set('twilio_account_sid', config.accountSid);
    await db.settings.set('twilio_auth_token', config.authToken);
    await db.settings.set('twilio_phone_number', config.phoneNumber);
    await db.settings.set('twilio_whatsapp_number', config.whatsappNumber || '');
    
    // Update in-memory config
    TWILIO_CONFIG.ACCOUNT_SID = config.accountSid;
    TWILIO_CONFIG.AUTH_TOKEN = config.authToken;
    TWILIO_CONFIG.PHONE_NUMBER = config.phoneNumber;
    TWILIO_CONFIG.WHATSAPP_NUMBER = config.whatsappNumber || '';
    
    console.log('Twilio configuration saved to Supabase');
    return true;
  } catch (error) {
    console.error('Failed to save Twilio config to Supabase:', error);
    return false;
  }
}

// Auto-load config on page load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    loadTwilioConfig();
  });
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendSMS,
    sendWhatsAppMessage,
    openWhatsAppDirect,
    sendOTP,
    sendPremiumCardSMS,
    sendPremiumCardWhatsApp,
    sendPaymentConfirmation,
    notifyPremiumCardComplete,
    sendServiceEnquiry,
    verifyTwilioConfig,
    loadTwilioConfig,
    saveTwilioConfig,
    TWILIO_CONFIG
  };
}
