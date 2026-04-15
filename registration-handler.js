/**
 * SVCDA Registration Handler
 * Handles user registration from register.html
 */

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Registration system loaded');
  
  // Attach form handler
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', handleRegistration);
  }
});

/**
 * Handle registration form submission
 */
async function handleRegistration(event) {
  event.preventDefault();
  
  // Get form values
  const name = document.getElementById('wn').value.trim();
  const phone = document.getElementById('wp').value.trim();
  const interest = document.getElementById('ws').value;
  const message = document.getElementById('wm').value.trim();
  
  // Validate
  if (!name || !phone || !interest) {
    showNotification('Please fill all required fields', 'error');
    return;
  }
  
  // Validate phone number
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  const cleanPhone = phone.replace(/\D/g, '');
  if (!phoneRegex.test(cleanPhone)) {
    showNotification('Please enter a valid Indian phone number', 'error');
    return;
  }
  
  // Format phone
  const formattedPhone = formatPhoneNumber(phone);
  
  // Disable submit button
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing...';
  
  try {
    console.log('📝 Registering user:', name, formattedPhone);
    
    // Check if user already exists
    const existingMembers = await db.members.getByPhone(formattedPhone);
    
    if (existingMembers && existingMembers.length > 0) {
      const existing = existingMembers[0];
      
      // If already premium member
      if (existing.plan === 'Premium' || existing.payment_status === 'Success') {
        showNotification(
          `You are already a ${existing.plan} member! Card: ${existing.card_number}`,
          'info'
        );
        
        setTimeout(() => {
          window.location.href = `premium-card.html?card=${existing.card_number}`;
        }, 2000);
        return;
      }
    }
    
    // For new registration, redirect to premium card page with pre-filled data
    const userData = {
      name: name,
      phone: formattedPhone,
      interest: interest,
      message: message
    };
    
    // Store in sessionStorage for premium card page
    sessionStorage.setItem('registrationData', JSON.stringify(userData));
    
    // Show success and redirect
    showNotification('Registration initiated! Redirecting to membership plans...', 'success');
    
    setTimeout(() => {
      window.location.href = 'premium-card.html';
    }, 1500);
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    showNotification('Registration failed: ' + error.message, 'error');
    
    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  
  if (phone.startsWith('+')) {
    return phone;
  }
  
  return '+91' + cleaned.slice(-10);
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  let notif = document.getElementById('svcda-notification');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'svcda-notification';
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 400px;
      font-size: 14px;
      display: none;
    `;
    document.body.appendChild(notif);
  }

  notif.textContent = message;
  notif.style.display = 'block';

  setTimeout(() => {
    notif.style.display = 'none';
  }, 5000);
}

console.log('✅ Registration handler loaded');
