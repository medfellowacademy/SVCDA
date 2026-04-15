/**
 * SVCDA Enhanced Features
 * - Email notifications (FREE via EmailJS)
 * - OTP verification
 * - Digital card generation
 * - Service requests
 */

// ==================== EMAIL CONFIGURATION (FREE!) ====================

/**
 * EmailJS Configuration (Get FREE at https://www.emailjs.com/)
 * NO backend needed! Works directly from browser
 * Uses environment variables for secure credential management
 */
const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE || 'service_xxxxxx',
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE || 'template_xxxxxx',
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_KEY || 'xxxxxxxxxxxxxx',
  ENABLED: import.meta.env.VITE_EMAILJS_ENABLED === 'true' || false
};

// Validate EmailJS credentials
if (EMAILJS_CONFIG.ENABLED && !import.meta.env.VITE_EMAILJS_SERVICE) {
  console.warn('⚠️ EmailJS enabled but not configured. Set VITE_EMAILJS_SERVICE, VITE_EMAILJS_TEMPLATE, and VITE_EMAILJS_KEY.');
}

/**
 * Initialize EmailJS (call once on page load)
 */
function initEmailJS() {
  if (EMAILJS_CONFIG.ENABLED && typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    console.log('✅ EmailJS initialized');
  }
}

/**
 * Send welcome email to new member
 */
async function sendWelcomeEmail(memberData) {
  if (!EMAILJS_CONFIG.ENABLED || !memberData.email) {
    console.log('⚠️ Email not configured or no email provided');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const templateParams = {
      to_email: memberData.email,
      to_name: memberData.name,
      card_number: memberData.card_number,
      plan: memberData.plan,
      valid_till: memberData.valid_till,
      payment_id: memberData.payment_id,
      amount: memberData.amount
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Email sent:', response.status);
    return { success: true, response: response };
  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false, error: error.message };
  }
}

// ==================== OTP VERIFICATION ====================

/**
 * Send OTP via MSG91
 */
async function sendOTP(phone) {
  if (!MSG91_CONFIG.AUTH_KEY || MSG91_CONFIG.AUTH_KEY === 'xxxxxxxxxxxxxxxxxxxxxxxx') {
    console.warn('⚠️ MSG91 not configured for OTP');
    return { success: false, error: 'OTP service not configured' };
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

  try {
    const url = `https://control.msg91.com/api/v5/otp?mobile=91${cleanPhone}&authkey=${MSG91_CONFIG.AUTH_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.type === 'success') {
      console.log('✅ OTP sent to:', cleanPhone);
      return { success: true, message: 'OTP sent successfully' };
    } else {
      console.error('❌ OTP failed:', data.message);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('❌ OTP error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify OTP via MSG91
 */
async function verifyOTP(phone, otp) {
  if (!MSG91_CONFIG.AUTH_KEY || MSG91_CONFIG.AUTH_KEY === 'xxxxxxxxxxxxxxxxxxxxxxxx') {
    return { success: false, error: 'OTP service not configured' };
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

  try {
    const url = `https://control.msg91.com/api/v5/otp/verify?mobile=91${cleanPhone}&otp=${otp}&authkey=${MSG91_CONFIG.AUTH_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.type === 'success') {
      console.log('✅ OTP verified');
      return { success: true, verified: true };
    } else {
      console.error('❌ Invalid OTP');
      return { success: false, error: 'Invalid OTP' };
    }
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    return { success: false, error: error.message };
  }
}

// ==================== DIGITAL CARD GENERATION ====================

/**
 * Generate digital card as image using Canvas API
 */
async function generateDigitalCard(memberData) {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 800, 500);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 500);

      // Add decorative circles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(700, 100, 150, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(100, 400, 100, 0, Math.PI * 2);
      ctx.fill();

      // Card border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 3;
      ctx.roundRect(20, 20, 760, 460, 20);
      ctx.stroke();

      // SVCDA Logo text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.fillText('SVCDA', 50, 80);

      // Premium badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.roundRect(650, 40, 120, 40, 20);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('PREMIUM', 665, 67);

      // Chip
      ctx.fillStyle = '#ffd700';
      ctx.roundRect(50, 150, 80, 60, 10);
      ctx.fill();

      // Card number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Courier New';
      const cardNum = memberData.card_number || 'SVCDA000000';
      const formatted = cardNum.match(/.{1,4}/g)?.join(' ') || cardNum;
      ctx.fillText(formatted, 50, 260);

      // Member name
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('MEMBER NAME', 50, 320);
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText((memberData.name || 'Member').toUpperCase(), 50, 355);

      // Valid till
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('VALID TILL', 550, 320);
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(memberData.valid_till || 'LIFETIME', 550, 355);

      // Footer
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('Small Village & City Development Agency', 50, 430);
      ctx.fillText('📞 +91 8978210705  |  🌐 svcda.in', 50, 455);

      // Convert to blob
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        console.log('✅ Digital card generated');
        resolve({ success: true, imageURL: url, blob: blob });
      }, 'image/png');
    } catch (error) {
      console.error('❌ Card generation error:', error);
      reject({ success: false, error: error.message });
    }
  });
}

/**
 * Download digital card
 */
async function downloadDigitalCard(memberData) {
  try {
    const result = await generateDigitalCard(memberData);
    
    if (result.success) {
      // Create download link
      const link = document.createElement('a');
      link.href = result.imageURL;
      link.download = `SVCDA_Card_${memberData.card_number}.png`;
      link.click();
      
      showNotification('✅ Card downloaded successfully!', 'success');
      return { success: true };
    }
  } catch (error) {
    showNotification('❌ Failed to download card', 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Share digital card on WhatsApp
 */
async function shareCardOnWhatsApp(memberData) {
  const message = `🌟 *SVCDA Premium Member*

Name: ${memberData.name}
Card No: ${memberData.card_number}
Plan: ${memberData.plan}
Valid Till: ${memberData.valid_till || 'Lifetime'}

✨ Premium Benefits:
• Priority Support
• 20% Discounts
• Free Health Camps
• Skill Courses

Visit: https://svcda.in
📞 +91 8978210705`;

  const phone = memberData.phone || '';
  const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  
  window.open(url, '_blank');
  showNotification('✅ WhatsApp opened - Send the message!', 'success');
}

// ==================== SERVICE REQUEST SYSTEM ====================

/**
 * Submit service request from member
 */
async function submitServiceRequest(requestData) {
  try {
    const request = {
      member_id: requestData.member_id,
      member_name: requestData.member_name,
      phone: requestData.phone,
      service_type: requestData.service_type,
      description: requestData.description,
      priority: requestData.priority || 'Normal',
      status: 'Pending'
    };

    // Save to activity log
    await db.activity.create({
      type: 'Service Request',
      member_name: request.member_name,
      phone: request.phone,
      service: request.service_type,
      payment: request.priority,
      added_by: null,
      added_by_name: 'Member Portal'
    });

    // Send SMS notification to admin
    const adminPhone = '+918978210705';
    const adminMessage = `🔔 New Service Request

Member: ${request.member_name}
Phone: ${request.phone}
Service: ${request.service_type}
Priority: ${request.priority}

Login to admin panel for details.`;

    await sendSMS(adminPhone, adminMessage);

    showNotification('✅ Service request submitted successfully!', 'success');
    return { success: true, request_id: Date.now() };
  } catch (error) {
    console.error('❌ Service request error:', error);
    showNotification('❌ Failed to submit request', 'error');
    return { success: false, error: error.message };
  }
}

// ==================== REFERRAL SYSTEM ====================

/**
 * Generate referral code for member
 */
function generateReferralCode(memberData) {
  const nameCode = memberData.name.substring(0, 3).toUpperCase();
  const phoneCode = memberData.phone.slice(-4);
  return `SVCDA${nameCode}${phoneCode}`;
}

/**
 * Track referral when new member uses code
 */
async function trackReferral(referralCode, newMemberId) {
  try {
    await db.activity.create({
      type: 'Referral',
      member_name: 'Referral Bonus',
      phone: referralCode,
      service: `New member: ${newMemberId}`,
      payment: 'Points Awarded',
      added_by: null,
      added_by_name: 'Referral System'
    });

    console.log('✅ Referral tracked:', referralCode);
    return { success: true };
  } catch (error) {
    console.error('❌ Referral tracking error:', error);
    return { success: false, error: error.message };
  }
}

// ==================== HELPER: Canvas RoundRect Polyfill ====================

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

// Make functions globally available
window.initEmailJS = initEmailJS;
window.sendWelcomeEmail = sendWelcomeEmail;
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.generateDigitalCard = generateDigitalCard;
window.downloadDigitalCard = downloadDigitalCard;
window.shareCardOnWhatsApp = shareCardOnWhatsApp;
window.submitServiceRequest = submitServiceRequest;
window.generateReferralCode = generateReferralCode;
window.trackReferral = trackReferral;

console.log('✅ SVCDA Enhanced Features Loaded');
