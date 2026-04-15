/**
 * SVCDA Complete Payment & Notification System
 * Integrates: Razorpay + Supabase + Twilio (SMS & WhatsApp)
 * 
 * WORKFLOW:
 * 1. User fills premium card form
 * 2. Razorpay payment gateway opens
 * 3. On successful payment:
 *    - Save member to Supabase
 *    - Send SMS notification
 *    - Send WhatsApp message with card details
 *    - Log activity
 *    - Redirect to success page
 */

// ==================== CONFIGURATION ====================

// Razorpay Configuration (from environment variables)
const RAZORPAY_CONFIG = {
  KEY_ID: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_xxxxxxxxxxxxxx',
  CURRENCY: 'INR',
  COMPANY_NAME: 'SVCDA',
  COMPANY_LOGO: 'https://svcda.in/assets/images/LOGO.png',
  THEME_COLOR: '#0B1120'
};

// Validate Razorpay key
if (!import.meta.env.VITE_RAZORPAY_KEY) {
  console.warn('⚠️ Using test Razorpay key. Set VITE_RAZORPAY_KEY for production.');
}

// MSG91 Configuration (from environment variables)
const MSG91_CONFIG = {
  AUTH_KEY: import.meta.env.VITE_MSG91_AUTH_KEY || 'xxxxxxxxxxxxxxxxxxxxxxxx',
  SENDER_ID: import.meta.env.VITE_MSG91_SENDER_ID || 'SVCDA',
  ROUTE: '4', // 4 = Transactional, 1 = Promotional
  COUNTRY_CODE: '91', // India country code
  WHATSAPP_NUMBER: '', // Your MSG91 WhatsApp number (optional)
  DLT_TE_ID: import.meta.env.VITE_MSG91_DLT_ID || ''
};

// Validate MSG91 credentials
if (!import.meta.env.VITE_MSG91_AUTH_KEY) {
  console.warn('⚠️ MSG91 not configured. Set VITE_MSG91_AUTH_KEY, VITE_MSG91_SENDER_ID, and VITE_MSG91_DLT_ID.');
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate unique card number
 */
function generateCardNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SVCDA${timestamp}${random}`;
}

/**
 * Format phone number to E.164 format (+91XXXXXXXXXX)
 */
function formatPhoneNumber(phone) {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 91, add +
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  // If 10 digits, add +91
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  
  // If already has +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  return '+91' + cleaned.slice(-10);
}

/**
 * Send SMS via MSG91 API
 */
async function sendSMS(phone, message) {
  if (!MSG91_CONFIG.AUTH_KEY || MSG91_CONFIG.AUTH_KEY === 'xxxxxxxxxxxxxxxxxxxxxxxx') {
    console.warn('⚠️ MSG91 not configured');
    return { success: false, error: 'MSG91 not configured' };
  }

  // Clean phone number (remove +91 if present)
  const cleanPhone = phone.replace(/^\+?91/, '');

  try {
    const url = 'https://control.msg91.com/api/v5/flow/';
    
    const payload = {
      sender: MSG91_CONFIG.SENDER_ID,
      route: MSG91_CONFIG.ROUTE,
      country: MSG91_CONFIG.COUNTRY_CODE,
      sms: [
        {
          message: message,
          to: [cleanPhone]
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authkey': MSG91_CONFIG.AUTH_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok && data.type === 'success') {
      console.log('✅ SMS sent via MSG91:', data.message);
      return { success: true, message_id: data.request_id };
    } else {
      console.error('❌ SMS failed:', data.message);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('❌ SMS error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send WhatsApp message using Click-to-Chat (NO API NEEDED!)
 * This opens WhatsApp with pre-filled message - works with regular WhatsApp!
 */
async function sendWhatsApp(phone, message) {
  // Clean phone number (remove + and spaces)
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  try {
    // Create WhatsApp Click-to-Chat URL
    const whatsappURL = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // Option 1: Auto-open WhatsApp in new tab (works immediately)
    window.open(whatsappURL, '_blank');
    
    // Option 2: Send via SVCDA WhatsApp number (business account)
    // This sends from your business WhatsApp to the customer
    const svcda_whatsapp = '918978210705'; // Your SVCDA WhatsApp number
    const adminURL = `https://wa.me/${svcda_whatsapp}?text=${encodeURIComponent(
      `🤖 AUTO-SEND TO: ${phone}\n\n${message}`
    )}`;
    
    console.log('✅ WhatsApp link generated:', whatsappURL);
    console.log('📱 Admin can send via:', adminURL);
    
    // Store for manual sending if needed
    sessionStorage.setItem('pendingWhatsApp', JSON.stringify({
      phone: phone,
      message: message,
      url: whatsappURL,
      timestamp: new Date().toISOString()
    }));
    
    return { 
      success: true, 
      url: whatsappURL,
      method: 'click-to-chat',
      note: 'WhatsApp link opened in new tab. User will receive message when you send.'
    };
  } catch (error) {
    console.error('❌ WhatsApp error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ALTERNATIVE: Send WhatsApp via your business number manually
 * This creates a notification for admin to send the message
 */
async function notifyWhatsAppPending(memberData) {
  const message = createWhatsAppMessage(memberData);
  const phone = memberData.phone;
  
  // Save to database for admin to process
  await db.activity.create({
    type: 'WhatsApp Pending',
    member_name: memberData.name,
    phone: phone,
    service: 'WhatsApp Card Delivery',
    payment: 'Pending Send',
    added_by: null,
    added_by_name: 'System'
  });
  
  // Show notification to admin (if logged in)
  console.log('📬 WhatsApp message queued for:', phone);
  
  return {
    success: true,
    queued: true,
    message: 'WhatsApp message queued. Admin will send manually.'
  };
}

/**
 * Create SMS message template
 */
function createSMSMessage(memberData) {
  return `🎉 Welcome to SVCDA Premium!

Name: ${memberData.name}
Card No: ${memberData.card_number}
Plan: ${memberData.plan}
Valid Till: ${memberData.valid_till}

Access your digital card anytime at:
https://svcda.in/premium-card.html

Thank you for joining SVCDA!
- Team SVCDA`;
}

/**
 * Create WhatsApp message template with card details
 */
function createWhatsAppMessage(memberData) {
  return `🌟 *SVCDA Premium Membership Activated!*

Congratulations ${memberData.name}! Your premium membership is now active.

📇 *Card Details:*
━━━━━━━━━━━━━━━
Card Number: *${memberData.card_number}*
Member Name: ${memberData.name}
Plan: *${memberData.plan} Membership*
Amount Paid: ₹${memberData.amount}
Valid Until: ${memberData.valid_till}
Payment ID: ${memberData.payment_id}
━━━━━━━━━━━━━━━

✨ *Premium Benefits:*
• Priority customer support
• 20% discount on all services
• Free health camps access
• Exclusive skill development courses
• Fast-track service processing

📱 *Access Your Digital Card:*
Visit: https://svcda.in/premium-card.html
Login with your phone number

Need help? Call: +91 8978210705
WhatsApp: wa.me/918978210705

Thank you for choosing SVCDA!
*Team SVCDA* 🙏`;
}

// ==================== MAIN PAYMENT HANDLER ====================

/**
 * Handle premium card payment
 * This is the main function to call from premium-card.html
 */
async function processPremiumPayment(memberData) {
  try {
    console.log('🚀 Starting payment process...');

    // Validate required fields
    if (!memberData.name || !memberData.phone || !memberData.email) {
      throw new Error('Please fill all required fields');
    }

    // Format phone number
    memberData.phone = formatPhoneNumber(memberData.phone);

    // Generate card number
    const cardNumber = generateCardNumber();
    const validTill = new Date();
    validTill.setFullYear(validTill.getFullYear() + 1);
    const validTillStr = validTill.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // Prepare Razorpay options
    const options = {
      key: RAZORPAY_CONFIG.KEY_ID,
      amount: memberData.amount * 100, // Convert to paise
      currency: RAZORPAY_CONFIG.CURRENCY,
      name: RAZORPAY_CONFIG.COMPANY_NAME,
      description: `${memberData.plan} Membership`,
      image: RAZORPAY_CONFIG.COMPANY_LOGO,
      prefill: {
        name: memberData.name,
        email: memberData.email,
        contact: memberData.phone
      },
      theme: {
        color: RAZORPAY_CONFIG.THEME_COLOR
      },
      handler: async function (response) {
        console.log('✅ Payment successful:', response.razorpay_payment_id);

        // Show loading
        showNotification('Processing your membership... Please wait', 'info');

        try {
          // Prepare member data for database
          const dbMemberData = {
            name: memberData.name,
            phone: memberData.phone,
            email: memberData.email,
            plan: memberData.plan,
            amount: memberData.amount,
            card_number: cardNumber,
            payment_id: response.razorpay_payment_id,
            payment_status: 'Success',
            valid_till: validTillStr,
            added_by: memberData.added_by || null,
            added_by_name: memberData.added_by_name || 'Website'
          };

          // 1. Save to Supabase database
          console.log('💾 Saving to database...');
          const savedMember = await db.members.create(dbMemberData);
          console.log('✅ Member saved:', savedMember.id);

          // 2. Log activity
          await db.activity.create({
            type: 'Premium Registration',
            member_name: memberData.name,
            phone: memberData.phone,
            service: memberData.plan + ' Membership',
            payment: '₹' + memberData.amount,
            added_by: memberData.added_by,
            added_by_name: memberData.added_by_name || 'Website'
          });

          // 3. Send SMS notification
          console.log('📱 Sending SMS...');
          const smsMessage = createSMSMessage({
            ...dbMemberData,
            valid_till: validTillStr
          });
          const smsResult = await sendSMS(memberData.phone, smsMessage);
          
          if (smsResult.success) {
            console.log('✅ SMS sent successfully');
          } else {
            console.warn('⚠️ SMS failed:', smsResult.error);
          }

          // 4. Send Email notification (if email provided and EmailJS configured)
          if (memberData.email && typeof sendWelcomeEmail !== 'undefined') {
            console.log('📧 Sending email...');
            const emailResult = await sendWelcomeEmail({
              ...dbMemberData,
              valid_till: validTillStr
            });
            if (emailResult.success) {
              console.log('✅ Email sent successfully');
            }
          }

          // 5. Generate WhatsApp message and open link
          console.log('💬 Opening WhatsApp...');
          const whatsappMessage = createWhatsAppMessage({
            ...dbMemberData,
            valid_till: validTillStr
          });
          const whatsappResult = await sendWhatsApp(memberData.phone, whatsappMessage);
          
          if (whatsappResult.success) {
            console.log('✅ WhatsApp link opened');
            // Show helper notification
            setTimeout(() => {
              showNotification('📱 WhatsApp opened in new tab. Please send the message to complete delivery!', 'info');
            }, 2000);
          } else {
            console.warn('⚠️ WhatsApp failed:', whatsappResult.error);
          }

          // 6. Show success message
          showNotification(
            `🎉 Payment successful! Card Number: ${cardNumber}. Check your messages!`,
            'success'
          );

          // Save for success page
          sessionStorage.setItem('pendingMemberData', JSON.stringify({
            card_number: cardNumber,
            name: memberData.name,
            valid_till: validTillStr
          }));

          // 7. Redirect to success page after 2 seconds
          setTimeout(() => {
            window.location.href = `payment-success.html?card=${cardNumber}&name=${encodeURIComponent(memberData.name)}&valid=${encodeURIComponent(validTillStr)}`;
          }, 2000);

        } catch (dbError) {
          console.error('❌ Post-payment processing error:', dbError);
          showNotification(
            '⚠️ Payment successful but there was an issue saving your data. Please contact support with Payment ID: ' + response.razorpay_payment_id,
            'warning'
          );
        }
      },
      modal: {
        ondismiss: function () {
          console.log('❌ Payment cancelled by user');
          showNotification('Payment cancelled', 'error');
        }
      }
    };

    // Open Razorpay payment gateway
    const razorpay = new Razorpay(options);
    razorpay.open();

  } catch (error) {
    console.error('❌ Payment process error:', error);
    showNotification('Error: ' + error.message, 'error');
  }
}

// ==================== EMPLOYEE ADD MEMBER FUNCTION ====================

/**
 * Employee adds member from dashboard
 */
async function employeeAddMember(employeeId, employeeName, memberData) {
  try {
    console.log('👤 Employee adding member...');

    // Add employee info to member data
    memberData.added_by = employeeId;
    memberData.added_by_name = employeeName;

    // If premium membership, trigger payment
    if (memberData.plan === 'Premium') {
      await processPremiumPayment(memberData);
    } else {
      // For regular registration (no payment)
      const cardNumber = generateCardNumber();
      
      const dbMemberData = {
        name: memberData.name,
        phone: formatPhoneNumber(memberData.phone),
        email: memberData.email || '',
        plan: 'Registered',
        card_number: cardNumber,
        payment_status: 'N/A',
        added_by: employeeId,
        added_by_name: employeeName
      };

      // Save to database
      const savedMember = await db.members.create(dbMemberData);
      
      // Log activity
      await db.activity.create({
        type: 'Member Registration',
        member_name: memberData.name,
        phone: memberData.phone,
        service: 'Registration',
        payment: 'Free',
        added_by: employeeId,
        added_by_name: employeeName
      });

      showNotification(`✅ Member added successfully! Card: ${cardNumber}`, 'success');
      return savedMember;
    }
  } catch (error) {
    console.error('❌ Error adding member:', error);
    showNotification('Error adding member: ' + error.message, 'error');
    throw error;
  }
}

// ==================== NOTIFICATION HELPER ====================

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
  // You can customize this to use your preferred notification library
  // For now, using simple alert
  
  const styles = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const icon = styles[type] || styles.info;
  
  // Create notification element if it doesn't exist
  let notif = document.getElementById('svcda-notification');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'svcda-notification';
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 400px;
      font-size: 14px;
      line-height: 1.5;
      display: none;
    `;
    document.body.appendChild(notif);
  }

  notif.textContent = icon + ' ' + message;
  notif.style.display = 'block';

  setTimeout(() => {
    notif.style.display = 'none';
  }, 5000);
}

// Make functions globally available
window.processPremiumPayment = processPremiumPayment;
window.employeeAddMember = employeeAddMember;
window.sendSMS = sendSMS;
window.sendWhatsApp = sendWhatsApp;
window.showNotification = showNotification;

console.log('✅ SVCDA Payment System Loaded');
