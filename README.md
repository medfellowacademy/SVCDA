# SVCDA Platform

**State Village Community Development Association** - Complete digital platform for member management, services, and premium card system.

## 🎯 Project Overview

A modern web platform for SVCDA to manage:
- Member registrations (Free & Premium)
- Employee management system
- Service requests tracking
- Premium card generation with Razorpay payments
- Automated SMS & WhatsApp notifications via Twilio
- Admin dashboard with analytics

## 📁 Project Structure

```
SVCDA/
├── index.html                  # Homepage
├── sitemap.xml                 # SEO sitemap
│
├── supabase-config.js          # Supabase database configuration
├── twilio-integration.js       # Twilio SMS/WhatsApp integration
│
├── assets/
│   ├── css/
│   │   └── main.css           # Main stylesheet
│   ├── js/
│   │   ├── main.js            # Main JavaScript
│   │   └── admin-supabase.js  # Admin panel logic
│   └── images/                # All images/logos
│
├── pages/
│   ├── about.html             # About page
│   ├── contact.html           # Contact page
│   ├── services.html          # Services overview
│   ├── sectors.html           # Sectors we serve
│   ├── vision.html            # Vision & Mission
│   │
│   ├── register.html          # Public registration
│   ├── premium-card.html      # Premium card info
│   ├── order-service.html     # Service order form
│   │
│   ├── employee-login.html    # Employee authentication
│   ├── employee-dashboard.html # Employee workspace
│   └── admin.html             # Admin panel
│
└── Documentation/
    ├── SUPABASE-SETUP.md      # Database setup guide
    ├── TWILIO-SETUP.md        # SMS/WhatsApp setup
    └── DEPLOYMENT.md          # Production deployment guide
```

## 🚀 Quick Start

### 1. **Setup Supabase Database** (30 minutes)
```bash
# Follow instructions in SUPABASE-SETUP.md
# - Create free account at supabase.com
# - Run SQL scripts to create tables
# - Get SUPABASE_URL and SUPABASE_ANON_KEY
# - Update supabase-config.js
```

### 2. **Setup Twilio Notifications** (15 minutes)
```bash
# Follow instructions in TWILIO-SETUP.md
# - Create account at twilio.com
# - Get credentials (Account SID, Auth Token, Phone Number)
# - Configure in admin panel
```

### 3. **Configure Razorpay** (10 minutes)
```bash
# Update in employee-dashboard.html:
# - Replace TEST key with production key
# - Update webhook endpoints
```

### 4. **Deploy to Production** (15 minutes)
```bash
# Follow DEPLOYMENT.md for:
# - Vercel deployment (recommended)
# - Netlify deployment
# - GitHub Pages deployment
```

## 🔑 Key Features

### Public Features
- ✅ Member registration (Free/Premium)
- ✅ Service requests submission
- ✅ Sector information pages
- ✅ Contact form

### Employee Features
- ✅ Secure login system
- ✅ Register premium members with payment
- ✅ View all registered members
- ✅ Dashboard with statistics
- ✅ Auto-send SMS + WhatsApp notifications

### Admin Features
- ✅ View all members, employees, activity
- ✅ Search and filter data
- ✅ Export to CSV
- ✅ Add/remove employees
- ✅ Configure Twilio settings
- ✅ Update admin PIN
- ✅ Real-time statistics

## 💰 Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| **Supabase** | Free Tier | ₹0/month (500MB database) |
| **Hosting** | Vercel/Netlify | ₹0/month (100GB bandwidth) |
| **Twilio SMS** | Pay-as-go | ₹0.50-1 per message |
| **Twilio WhatsApp** | Pay-as-go | ₹0.35-1.65 per message |
| **Razorpay** | Payment Gateway | 2% per transaction |
| **Total Base** | - | **₹0/month** + notification costs |

## 🛠 Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL database)
- **Authentication**: Supabase Auth
- **Payment**: Razorpay
- **Notifications**: Twilio (SMS + WhatsApp)
- **Hosting**: Vercel/Netlify/GitHub Pages

## 📱 Integrations

### Supabase Database
- 4 tables: members, employees, activity, settings
- Row Level Security enabled
- Auto-generated REST API
- Real-time subscriptions

### Twilio Notifications
- Automatic SMS after premium registration
- Automatic WhatsApp message with card details
- Payment confirmations
- OTP support (future)

### Razorpay Payments
- Premium card: ₹750
- Test mode enabled (use test keys for local development)
- Production mode for live deployments

## 🔐 Default Credentials

### Admin Panel
- **URL**: `/pages/admin.html`
- **PIN**: `admin123` (change after first login)

### Employee Login
- **URL**: `/pages/employee-login.html`
- **Email**: `default@svcda.org`
- **Password**: `emp123`
- **Note**: Create new employees in admin panel

## 📖 Documentation

| Guide | Purpose |
|-------|---------|
| [SUPABASE-SETUP.md](SUPABASE-SETUP.md) | Complete database setup with SQL scripts |
| [TWILIO-SETUP.md](TWILIO-SETUP.md) | SMS/WhatsApp integration guide |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment instructions |

## 🧪 Testing

### Local Testing
1. Open `index.html` in browser
2. Test public registration
3. Login to employee dashboard
4. Test premium registration flow (use Razorpay test mode)
5. Verify notifications (configure Twilio first)

### Production Testing
1. Test all payment flows with real credentials
2. Verify SMS/WhatsApp delivery
3. Check database entries in Supabase
4. Test on mobile devices

## 🚨 Important Notes

1. **Never commit credentials** to version control
2. **Update Razorpay keys** before going live
3. **Configure Twilio** for WhatsApp production numbers
4. **Enable HTTPS** for production (required by Razorpay)
5. **Backup database** regularly via Supabase dashboard

## 🆘 Support & Help

For issues:
1. Check documentation files (SUPABASE-SETUP.md, TWILIO-SETUP.md)
2. Review Supabase logs for database errors
3. Check browser console for JavaScript errors
4. Verify all API credentials are configured

## 📈 Future Enhancements

- [ ] Email notifications (SendGrid)
- [ ] PDF card generation (jsPDF)
- [ ] Member portal login
- [ ] Bulk SMS campaigns
- [ ] Advanced analytics dashboard
- [ ] Mobile app (PWA)

## 📝 License

© 2026 State Village Community Development Association. All rights reserved.

---

**Last Updated**: April 15, 2026  
**Version**: 2.0  
**Built with**: ❤️ for SVCDA
