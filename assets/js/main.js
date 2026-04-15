/* ======================== SVCDA Core Scripts ======================== */

// 1. Preloader and scroll toggles
window.addEventListener('load', () => { setTimeout(() => { var pl = document.getElementById('pl'); if(pl) pl.classList.add('h'); }, 500) });
var hdr = document.getElementById('hdr');
if (hdr) window.addEventListener('scroll', () => { hdr.classList.toggle('sc', window.scrollY > 40) });

const obs = new IntersectionObserver(e => { e.forEach(el => { if (el.isIntersecting) { el.target.classList.add('vis'); obs.unobserve(el.target) } }) }, { threshold: .06, rootMargin: '0px 0px -20px 0px' });
document.querySelectorAll('.rv').forEach(el => obs.observe(el));

// 2. Mobile Menu
const mb = document.getElementById('mb'), mp = document.getElementById('mp'), mo = document.getElementById('mo'), mx = document.getElementById('mx');
function mO() { if(mp) mp.classList.add('on'); if(mo) mo.classList.add('on') } 
function mC() { if(mp) mp.classList.remove('on'); if(mo) mo.classList.remove('on') }
if (mb) { mb.onclick = mO; if(mx) mx.onclick = mC; if(mo) mo.onclick = mC; if(mp) mp.querySelectorAll('a').forEach(a => a.onclick = mC) }

document.querySelectorAll('a[href^="#"]').forEach(a => { a.addEventListener('click', function (e) { const t = document.querySelector(this.getAttribute('href')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }) } }) });

// Data layer for member/admin tracking
var SVCDA_STORE_KEYS = {
  members: 'svcda_members',
  activity: 'svcda_activity',
  smsWebhook: 'svcda_sms_webhook'
};

function sRead(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function sWrite(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function phoneDigits(v) {
  return String(v || '').replace(/\D/g, '');
}

function normalizePhone(v) {
  var d = phoneDigits(v);
  if (!d) return '';
  if (d.length === 10) return '91' + d;
  return d;
}

function genCardNumber() {
  var n = Math.floor(100000 + Math.random() * 900000);
  return 'SVCDA-PREM-' + n;
}

function getMembers() {
  return sRead(SVCDA_STORE_KEYS.members, []);
}

function getActivity() {
  return sRead(SVCDA_STORE_KEYS.activity, []);
}

function saveMember(member) {
  var list = getMembers();
  var p = normalizePhone(member.phone);
  var idx = -1;
  if (p) idx = list.findIndex(function (m) { return normalizePhone(m.phone) === p; });
  if (idx === -1) {
    member.id = member.id || ('M' + Date.now());
    member.createdAt = member.createdAt || new Date().toISOString();
    list.unshift(member);
  } else {
    member.id = list[idx].id;
    member.createdAt = list[idx].createdAt;
    if (!member.cardNumber) member.cardNumber = list[idx].cardNumber || '';
    list[idx] = Object.assign({}, list[idx], member);
  }
  sWrite(SVCDA_STORE_KEYS.members, list);
  return member;
}

function logActivity(entry) {
  var logs = getActivity();
  logs.unshift(Object.assign({ id: 'A' + Date.now(), at: new Date().toISOString() }, entry));
  if (logs.length > 1000) logs = logs.slice(0, 1000);
  sWrite(SVCDA_STORE_KEYS.activity, logs);
}

function sendSMSViaWebhook(payload) {
  var url = localStorage.getItem(SVCDA_STORE_KEYS.smsWebhook);
  if (!url) return Promise.resolve(false);
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(function () { return true; }).catch(function () { return false; });
}

function sendMembershipNotifications(member, paymentId) {
  var card = member.cardNumber || genCardNumber();
  var msg = 'Welcome to SVCDA Premium!\\n\\nName: ' + (member.name || 'Member') + '\\nPhone: ' + (member.phone || '-') + '\\nMembership: Premium\\nCard ID: ' + card + '\\nPayment ID: ' + (paymentId || '-') + '\\n\\nThanks for registering with SVCDA.';
  member.cardNumber = card;
  member.lastNotificationAt = new Date().toISOString();
  saveMember(member);

  var mPhone = normalizePhone(member.phone);
  if (mPhone) {
    window.open('https://wa.me/' + mPhone + '?text=' + encodeURIComponent(msg), '_blank');
  }

  sendSMSViaWebhook({
    phone: member.phone,
    message: msg,
    type: 'membership_confirmation'
  });

  logActivity({
    type: 'membership_notification',
    memberName: member.name || '',
    phone: member.phone || '',
    cardNumber: card,
    paymentId: paymentId || ''
  });
}

function askMemberIdentity() {
  var name = window.prompt('Enter member full name for Premium Card:');
  if (!name) return null;
  var phone = window.prompt('Enter member phone number (10 digits):');
  if (!phoneDigits(phone)) return null;
  return { name: name.trim(), phone: phone.trim() };
}

function openPremiumApplication() {
  var modal = document.getElementById('premiumApplicationModal');
  if (!modal) {
    payPremiumCard();
    return;
  }
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closePremiumApplication() {
  var modal = document.getElementById('premiumApplicationModal');
  if (!modal) return;
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

function submitPremiumApplication(e) {
  e.preventDefault();
  var f = e.target;
  var agreed = f.querySelector('#panAgree') ? f.querySelector('#panAgree').checked : true;
  var identity = {
    name: f.querySelector('#panName') ? f.querySelector('#panName').value.trim() : '',
    phone: f.querySelector('#panPhone') ? f.querySelector('#panPhone').value.trim() : '',
    email: f.querySelector('#panEmail') ? f.querySelector('#panEmail').value.trim() : '',
    district: f.querySelector('#panDistrict') ? f.querySelector('#panDistrict').value.trim() : '',
    city: f.querySelector('#panCity') ? f.querySelector('#panCity').value.trim() : ''
  };

  if (!identity.name || !phoneDigits(identity.phone)) {
    alert('Please enter valid name and phone number.');
    return;
  }

  if (!agreed) {
    alert('Please agree to the membership terms before payment.');
    return;
  }

  closePremiumApplication();
  payPremiumCard(identity);
}

function handleRegistration(e) {
  e.preventDefault();
  var f = e.target;
  var name = f.querySelector('#wn') ? f.querySelector('#wn').value : '';
  var phone = f.querySelector('#wp') ? f.querySelector('#wp').value : '';
  var service = f.querySelector('#ws') ? f.querySelector('#ws').value : 'General Inquiry';

  saveMember({
    name: name,
    phone: phone,
    plan: 'registered',
    source: 'register-form',
    lastService: service,
    lastSeenAt: new Date().toISOString()
  });

  logActivity({
    type: 'registration',
    memberName: name,
    phone: phone,
    service: service,
    page: location.pathname
  });

  submitWA(e, 'New Registration');
}

window.handleRegistration = handleRegistration;
window.openPremiumApplication = openPremiumApplication;
window.closePremiumApplication = closePremiumApplication;
window.submitPremiumApplication = submitPremiumApplication;
window.SVCDAAdminData = {
  getMembers: getMembers,
  getActivity: getActivity,
  setSMSWebhook: function (url) { localStorage.setItem(SVCDA_STORE_KEYS.smsWebhook, url || ''); },
  getSMSWebhook: function () { return localStorage.getItem(SVCDA_STORE_KEYS.smsWebhook) || ''; }
};

// 3. Scroll to top button
window.addEventListener('scroll', function() {
    var btn = document.getElementById('fdtop');
    if(btn) {
        if (window.scrollY > 300) btn.classList.add('show');
        else btn.classList.remove('show');
    }
});
var btnTop = document.getElementById('fdtop');
if(btnTop) {
    btnTop.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// 4. Hero carousel
(function () {
    var slides = document.querySelectorAll('.hero-sl');
    var dc = document.getElementById('heroDots');
    if (!slides.length || !dc) return;
    
    // Clear out existing dots just in case
    dc.innerHTML = '';
    
    var cur = 0, ap;
    slides.forEach(function (_, i) { 
        var d = document.createElement('div'); 
        d.className = 'hero-dot' + (i === 0 ? ' active' : ''); 
        d.onclick = function () { go(i) }; 
        dc.appendChild(d);
    });
    var dots = dc.querySelectorAll('.hero-dot');
    function go(n) { 
        slides[cur].classList.remove('active'); 
        dots[cur].classList.remove('active'); 
        cur = n; 
        slides[cur].classList.add('active'); 
        dots[cur].classList.add('active');
    }
    function next() { go((cur + 1) % slides.length) }
    function startA() { ap = setInterval(next, 5000) } 
    function stopA() { clearInterval(ap) }
    startA();
    var hero = document.querySelector('.hero-home');
    if (hero) { hero.addEventListener('mouseenter', stopA); hero.addEventListener('mouseleave', startA) }
})();

// 5. Global WhatsApp Form Submitter
function submitWA(e, sec) { 
    e.preventDefault(); 
    var f = e.target; 
    
    // Checkboxes
    var cbElements = document.querySelectorAll(".item-check:checked");
    var items = "Not selected";
    if (cbElements.length) {
        var selected = [].slice.call(cbElements).map(function(i){return i.value});
        items = selected.join(", ");
    }
    
    var vn = f.querySelector('#wn') ? f.querySelector('#wn').value : '';
    if (!vn && f.querySelector('[name="name"]')) vn = f.querySelector('[name="name"]').value;
    var vp = f.querySelector('#wp') ? f.querySelector('#wp').value : '';
    if (!vp && f.querySelector('[name="phone"]')) vp = f.querySelector('[name="phone"]').value;
    
    var dist = f.querySelector("#wdist") ? f.querySelector("#wdist").value : "";
    var mand = f.querySelector("#wmand") ? f.querySelector("#wmand").value : "";
    var vill = f.querySelector("#wvill") ? f.querySelector("#wvill").value : "";
    var pin = f.querySelector("#wpin") ? f.querySelector("#wpin").value : "";
    
    var loc = dist ? "\n*Location:* "+vill+", "+mand+", "+dist+" - "+pin : "";
    
    var selServ = f.querySelector("#ws");
    var sVal = selServ ? selServ.value : "General Inquiry";
    
    var msg = f.querySelector("#wm") ? f.querySelector("#wm").value : "";
    
    logActivity({
      type: 'service_request',
      memberName: vn,
      phone: vp,
      sector: sec,
      service: sVal,
      selectedItems: items,
      location: [vill, mand, dist, pin].filter(Boolean).join(', '),
      details: msg,
      page: location.pathname
    });

    if (vn || vp) {
      saveMember({
        name: vn,
        phone: vp,
        plan: 'registered',
        lastService: sVal,
        lastSector: sec,
        lastSeenAt: new Date().toISOString()
      });
    }

    var t = "Hello SVCDA!\n\n*Name:* " + vn + "\n*Phone:* " + vp + "\n*Sector:* " + sec + "\n*Service:* " + sVal + "\n*Selected Items:* " + items + loc + "\n*Details:* " + msg + "\n\nLooking forward to your response!"; 
    window.open('https://wa.me/918978210705?text=' + encodeURIComponent(t), '_blank');
}

// 6. Payment Scripts
function payGroceryAdvance() {
    var key = 'rzp_test_REPLACE_WITH_YOUR_KEY';
    if (typeof Razorpay === 'undefined') { alert('Razorpay failed to load. Please refresh and try again.'); return; }
    if (key.indexOf('REPLACE_WITH_YOUR_KEY') > -1) { alert('Please set your Razorpay Key ID in grocery.html before going live.'); return; }
    var opts = {
        key: key,
        amount: 19900,
        currency: 'INR',
        name: 'SVCDA Grocery',
        description: 'Advance payment for grocery order',
        image: (location.pathname.includes('/pages/') ? '../assets/images/LOGO.png' : 'assets/images/LOGO.png'),
        handler: function (resp) {
            alert('Payment successful. Payment ID: ' + resp.razorpay_payment_id);
            window.open('https://wa.me/918978210705?text=' + encodeURIComponent('Hi SVCDA, I paid grocery advance. Payment ID: ' + resp.razorpay_payment_id), '_blank');
        },
        prefill: { contact: '' },
        theme: { color: '#0D9488' }
    };
    new Razorpay(opts).open();
}

function payPremiumCard(identityInput) {
    var key = 'rzp_test_REPLACE_WITH_YOUR_KEY';
  var identity = identityInput || askMemberIdentity();
  if (!identity) { alert('Premium purchase cancelled. Name and phone are required.'); return; }
    if (typeof Razorpay === 'undefined') { alert('Razorpay failed to load. Please refresh and try again.'); return; }
    if (key.indexOf('REPLACE_WITH_YOUR_KEY') > -1) { alert('Please set your Razorpay Key ID in premium-card.html before going live.'); return; }
    var opts = {
        key: key,
        amount: 49900,
        currency: 'INR',
        name: 'SVCDA Premium Card',
        description: 'Annual premium membership',
        image: (location.pathname.includes('/pages/') ? '../assets/images/LOGO.png' : 'assets/images/LOGO.png'),
        handler: function (resp) {
          var member = saveMember({
            name: identity.name,
            phone: identity.phone,
            email: identity.email || '',
            district: identity.district || '',
            city: identity.city || '',
            plan: 'premium',
            membershipStatus: 'active',
            paymentId: resp.razorpay_payment_id,
            cardNumber: genCardNumber(),
            membershipStartAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString()
          });

          logActivity({
            type: 'premium_purchase',
            memberName: member.name,
            phone: member.phone,
            paymentId: resp.razorpay_payment_id,
            cardNumber: member.cardNumber,
            page: location.pathname
          });

          sendMembershipNotifications(member, resp.razorpay_payment_id);
            alert('Payment successful. Payment ID: ' + resp.razorpay_payment_id);
            window.open('https://wa.me/918978210705?text=' + encodeURIComponent('Hi SVCDA, I purchased Premium Card. Payment ID: ' + resp.razorpay_payment_id), '_blank');
        },
        prefill: { name: identity.name, contact: identity.phone },
        theme: { color: '#F97316' }
    };
    new Razorpay(opts).open();
}

// 7. Premium popup
(function () {
    var pp = document.getElementById('premPopup'); if (!pp) return;
    var closed = sessionStorage.getItem('vcda_popup_closed');
    if (closed) return;
    setTimeout(function () { pp.classList.add('show') }, 4000);
    function closePopup() { pp.classList.remove('show'); sessionStorage.setItem('vcda_popup_closed', '1') }
    var closeBtn = pp.querySelector('.popup-close'); if (closeBtn) closeBtn.onclick = closePopup;
    var skipBtn = pp.querySelector('.popup-skip'); if (skipBtn) skipBtn.onclick = closePopup;
    pp.addEventListener('click', function (e) { if (e.target === pp) closePopup() });
})();

// 8. Sector Layout Hydration
(function(){
  var heroMap={
    'education.html':'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=80',
    'grocery.html':'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80',
    'business.html':'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80',
    'health.html':'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=1600&q=80',
    'electronics.html':'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
    'women-empowerment.html':'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80',
    'services.html':'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80',
    'skill-development.html':'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80',
    'employment.html':'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1600&q=80',
    'agriculture.html':'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80',
    'order-service.html':'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1600&q=80'
  };
  var icons=[
    'https://img.icons8.com/color/96/product.png',
    'https://img.icons8.com/color/96/checklist.png',
    'https://img.icons8.com/color/96/service.png',
    'https://img.icons8.com/color/96/inspection.png'
  ];
  var file=(location.pathname.split('/').pop()||'').toLowerCase();
  var hero=document.querySelector('.phero');
  if(hero && heroMap[file]){
    hero.style.backgroundImage='linear-gradient(rgba(11,17,32,.62),rgba(11,17,32,.62)),url("'+heroMap[file]+'")';
    hero.style.backgroundSize='cover';
    hero.style.backgroundPosition='center';
  }
  document.querySelectorAll('.sp-sv').forEach(function(card,idx){
    var icon=card.querySelector('.sp-sv-i');
    if(icon){ icon.innerHTML='<img src="'+icons[idx%icons.length]+'" alt="Service image">'; }
    var d=card.querySelector('.sp-sv-d');
    if(!d) return;
    var items=d.textContent.split(',').map(function(x){return x.trim();}).filter(Boolean);
    if(!items.length) return;
    var wrap=document.createElement('div'); wrap.className='sp-items';
    items.forEach(function(item){
      var id='it-'+idx+'-'+item.replace(/[^a-z0-9]+/ig,'-').toLowerCase();
      var label=document.createElement('label');
      label.innerHTML='<input type="checkbox" class="item-check" id="'+id+'" value="'+item.replace(/"/g,'')+'"> <span>'+item+'</span>';
      wrap.appendChild(label);
    });
    d.insertAdjacentElement('afterend',wrap);
  });
})();

// 9. Extra Info Block
(function(){
  var wrap=document.querySelector('.sp-sg');
  if(!wrap) return;
  var info=document.createElement('div');
  info.className='sp-extra-info rv';
  info.style.marginTop='18px';
  info.style.padding='18px';
  info.style.border='1px solid var(--bdr)';
  info.style.borderRadius='12px';
  info.style.background='var(--w)';
  info.innerHTML='<h3 style="color:var(--n);font-size:1.05rem;margin-bottom:8px">More Field-Specific Support</h3><p style="font-size:.88rem;color:var(--sm);line-height:1.7">Select multiple items above to build your requirement. Our team verifies local providers, confirms availability, and shares best options with expected cost and service timeline.</p>';
  wrap.insertAdjacentElement('afterend',info);
})();

// 10. Health Provider Search
document.addEventListener('DOMContentLoaded', function() {
  const healthcareData = [
    {type: 'doctor', name: 'Dr. Ramesh Kumar', spec: 'General Physician', location: 'Hyderabad, Telangana - 500001', contact: '+91 9876 543 210'},
    {type: 'doctor', name: 'Dr. Sunita Reddy', spec: 'Pediatrician', location: 'Warangal, Telangana - 506001', contact: '+91 9876 543 211'},
    {type: 'doctor', name: 'Dr. Abdul Kalam', spec: 'Cardiologist', location: 'Hyderabad, Telangana - 500032', contact: '+91 9876 543 212'},
    {type: 'doctor', name: 'Dr. Meena Rao', spec: 'Gynecologist', location: 'Nizamabad, Telangana - 503001', contact: '+91 9876 543 213'},
    {type: 'doctor', name: 'Dr. Suresh Babu', spec: 'Orthopedic', location: 'Karimnagar, Telangana - 505001', contact: '+91 9876 543 214'},
    {type: 'doctor', name: 'Dr. Kavitha', spec: 'Dermatologist', location: 'Khammam, Telangana - 507001', contact: '+91 9876 543 215'},
    {type: 'hospital', name: 'Apollo Hospitals', spec: 'Multi-Specialty', location: 'Jubilee Hills, Hyderabad, Telangana - 500033', contact: '040-12345678'},
    {type: 'hospital', name: 'MGM Hospital', spec: 'Government Hospital', location: 'Warangal, Telangana - 506002', contact: '0870-1234567'},
    {type: 'hospital', name: 'Care Hospitals', spec: 'Multi-Specialty', location: 'Banjara Hills, Hyderabad, Telangana - 500034', contact: '040-87654321'},
    {type: 'hospital', name: 'Prathima Hospital', spec: 'Multi-Specialty', location: 'Kachiguda, Hyderabad, Telangana - 500027', contact: '040-23456789'},
    {type: 'hospital', name: 'Chalmeda Anand Rao Hospital', spec: 'General & Multi-Specialty', location: 'Karimnagar, Telangana - 505001', contact: '0878-1234567'},
    {type: 'hospital', name: 'KIMS Hospital', spec: 'Multi-Specialty', location: 'Secunderabad, Telangana - 500003', contact: '040-98765432'},
    {type: 'hospital', name: 'Government General Hospital', spec: 'Government Hospital', location: 'Nizamabad, Telangana - 503001', contact: '08462-123456'},
    {type: 'hospital', name: 'Mamata General Hospital', spec: 'Multi-Specialty', location: 'Khammam, Telangana - 507002', contact: '08742-123456'}
  ];
  const searchInput = document.getElementById('locSearchInput');
  const btnSearch = document.getElementById('btnSearchLoc');
  const locTabs = document.querySelectorAll('.loc-tab');
  const locResults = document.getElementById('locResults');
  let currentLocType = 'doctor';
  if (searchInput && locResults) {
    locTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        locTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentLocType = this.getAttribute('data-type');
        renderLocResults();
      });
    });
    btnSearch.addEventListener('click', renderLocResults);
    searchInput.addEventListener('keyup', function(e) {
      if(e.key === 'Enter') renderLocResults();
    });
    function renderLocResults() {
      const query = searchInput.value.toLowerCase().trim();
      if (!query) {
        locResults.innerHTML = '<div style="grid-column: 1 / -1;text-align:center;padding:40px;color:rgba(255,255,255,0.5);font-weight:500;font-size:1.05rem;background:rgba(255,255,255,0.03);border-radius:var(--r);border:1px dashed rgba(255,255,255,0.1);">Please enter a location to search for nearby ' + currentLocType + 's.</div>';
        return;
      }
      const filtered = healthcareData.filter(item => 
        item.type === currentLocType && item.location.toLowerCase().includes(query)
      );
      if (filtered.length === 0) {
        locResults.innerHTML = '<div style="grid-column: 1 / -1;text-align:center;padding:40px;color:rgba(255,255,255,0.8);background:rgba(249,115,22,0.1);border-radius:var(--rl);font-weight:600;border:1px solid rgba(249,115,22,0.25);">No results found for this location. Please try searching for major cities like <span style="color:var(--w);">Hyderabad</span>, <span style="color:var(--w);">Warangal</span>, or <span style="color:var(--w);">Karimnagar</span>.</div>';
        return;
      }
      locResults.innerHTML = filtered.map(item => `
        <div class="res-card">
          <div style="font-weight:800;font-size:1.1rem;color:var(--n);margin-bottom:6px;letter-spacing:-0.3px;">${item.name}</div>
          <div style="margin-bottom:14px;"><span style="display:inline-block;padding:4px 12px;background:var(--p50);color:var(--pd);font-size:.74rem;font-weight:700;border-radius:50px;">${item.spec}</span></div>
          <div style="font-size:.84rem;color:var(--sm);margin-bottom:8px;display:flex;gap:8px;align-items:flex-start;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-top:2px;color:var(--a);flex-shrink:0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <span style="line-height:1.5">${item.location}</span></div>
          <div style="font-size:.84rem;color:var(--s);font-weight:600;display:flex;gap:8px;align-items:center;margin-top:auto;padding-top:12px;border-top:1px solid rgba(0,0,0,0.06);"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--p);flex-shrink:0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> <span>${item.contact}</span></div>
        </div>
      `).join('');
    }
    renderLocResults();
  }
});