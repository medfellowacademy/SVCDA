# 🚀 SVCDA Vercel Deployment Guide

## ✅ Prerequisites Complete

- ✅ Vite build system installed
- ✅ Environment variables configured
- ✅ `vercel.json` created
- ✅ `.gitignore` set up
- ✅ Package scripts ready

---

## 📋 Vercel Environment Variables Setup

### Step 1: Go to Vercel Dashboard

1. Visit https://vercel.com/new
2. Import your GitHub repository: `medfellowacademy/SVCDA`
3. **Before deploying**, click "Environment Variables"

### Step 2: Add These Variables

Copy and paste each variable name and value:

| Variable Name | Value | Required |
|--------------|-------|----------|
| `VITE_SUPABASE_URL` | `https://ugpnumgppmhtnozskxdq.supabase.co` | ✅ Yes |
| `VITE_SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncG51bWdwcG1odG5venNreGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMzQyMDMsImV4cCI6MjA5MTgxMDIwM30.K3L88HprTX52J_xK_JmPzKCMQRCW07hhRDOHqNIxPW4` | ✅ Yes |
| `VITE_RAZORPAY_KEY` | Your Razorpay key (e.g., `rzp_live_xxxxx`) | ✅ Yes |
| `VITE_MSG91_AUTH_KEY` | Your MSG91 Auth Key | ✅ Yes |
| `VITE_MSG91_SENDER_ID` | `SVCDA` | ✅ Yes |
| `VITE_MSG91_DLT_ID` | Your DLT Template ID | ✅ Yes |
| `VITE_EMAILJS_SERVICE` | Your EmailJS Service ID | ⚪ Optional |
| `VITE_EMAILJS_TEMPLATE` | Your EmailJS Template ID | ⚪ Optional |
| `VITE_EMAILJS_KEY` | Your EmailJS Public Key | ⚪ Optional |
| `VITE_EMAILJS_ENABLED` | `true` or `false` | ⚪ Optional |

### Step 3: Where to Get Credentials

#### 🔐 Razorpay Key (REQUIRED)
1. Login to https://dashboard.razorpay.com
2. Go to **Settings** → **API Keys**
3. Click **Generate Live Keys**
4. Copy the **Key ID** (starts with `rzp_live_`)
5. Use this as `VITE_RAZORPAY_KEY`

#### 📱 MSG91 Credentials (REQUIRED)
1. Login to https://control.msg91.com
2. **Auth Key**: Settings → API Keys → Auth Key
3. **Sender ID**: Settings → Sender ID (use `SVCDA` if approved)
4. **DLT Template ID**: DLT → Templates → Copy Template ID

#### 📧 EmailJS Credentials (OPTIONAL - FREE Emails)
1. Go to https://dashboard.emailjs.com
2. **Service ID**: Email Services → Copy Service ID
3. **Template ID**: Email Templates → Copy Template ID
4. **Public Key**: Account → API Keys → Public Key
5. Set `VITE_EMAILJS_ENABLED` to `true`

---

## 🚀 Quick Deploy Steps

### Option A: Deploy via Vercel Dashboard

1. **Push to GitHub** (already done ✅)
   ```bash
   git add .
   git commit -m "Add Vite build system with env vars"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Click **Import Git Repository**
   - Select `medfellowacademy/SVCDA`

3. **Configure Build**
   - Framework Preset: **Vite** (auto-detected)
   - Build Command: `npm run build` (auto-filled)
   - Output Directory: `dist` (auto-filled)

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add all variables from table above
   - Select: **Production, Preview, Development** (all three)

5. **Deploy**
   - Click **Deploy**
   - Wait 2-3 minutes
   - Done! 🎉

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project directory)
cd /Users/guneswaribokam/Downloads/SVCDA
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? svcda
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add VITE_SUPABASE_URL
# Paste value, select all environments

vercel env add VITE_SUPABASE_KEY
# Paste value, select all environments

# Repeat for all other variables...

# Deploy to production
vercel --prod
```

---

## 🧪 Test Locally Before Deploy

```bash
# Install dependencies
npm install

# Create .env file (already created)
# Edit .env and add your real credentials

# Run development server
npm run dev
# Opens at http://localhost:3000

# Test payment flow
# Test SMS/WhatsApp functionality
# Verify all features work

# Build for production
npm run build

# Preview production build
npm run preview
# Opens at http://localhost:4173

# If all good, deploy to Vercel!
```

---

## 📂 Project Structure

```
SVCDA/
├── .env                    # Local environment variables (gitignored)
├── .env.example            # Example env vars for reference
├── .gitignore              # Git ignore rules
├── package.json            # NPM dependencies and scripts
├── vite.config.js          # Vite build configuration
├── vercel.json             # Vercel deployment settings
├── index.html              # Main entry point
├── pages/                  # All HTML pages
├── assets/                 # CSS, JS, images
├── *.js                    # JavaScript modules
└── dist/                   # Build output (created after npm run build)
```

---

## ⚙️ Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## 🔒 Security Notes

✅ **Safe to expose** (public keys):
- `VITE_SUPABASE_URL` - Public Supabase URL
- `VITE_SUPABASE_KEY` - Anon key (protected by Row Level Security)
- `VITE_RAZORPAY_KEY` - Public API key (not the secret)
- `VITE_MSG91_AUTH_KEY` - Auth key (rate-limited by IP)
- `VITE_EMAILJS_*` - Public keys (domain-restricted)

❌ **NEVER expose**:
- Razorpay Key Secret
- MSG91 account password
- Supabase service_role key

All frontend environment variables are visible in the browser. This is normal and expected. They are protected by:
- Supabase: Row Level Security policies
- Razorpay: Server-side verification
- MSG91: IP restrictions and rate limits
- EmailJS: Domain restrictions

---

## 🐛 Troubleshooting

### Build fails with "import.meta.env is undefined"
- Make sure all variables are prefixed with `VITE_`
- Check `.env` file exists and has correct values
- Restart dev server after changing `.env`

### Environment variables not loading
- In Vercel: Check you selected all environments (Production, Preview, Development)
- Locally: Make sure `.env` file is in root directory
- Restart build process after adding variables

### "Missing credentials" error
- Check variable names match exactly (case-sensitive)
- Verify values are correct in Vercel dashboard
- Trigger a new deployment after adding variables

---

## 📞 Support

**Need help?**
- Check `FEATURES-LIST.md` for feature documentation
- Check `MSG91-SETUP-GUIDE.md` for SMS setup
- Check `WHATSAPP-SOLUTION.md` for WhatsApp integration

**Contact:**
- Email: info@svcdaservicehub.com
- Phone: +91 8978210705

---

## ✨ What's Next?

After successful deployment:

1. ✅ Get custom domain (optional)
   - Vercel Dashboard → Domains → Add Domain
   
2. ✅ Configure MSG91
   - Register DLT templates
   - Get sender ID approved
   
3. ✅ Setup EmailJS (optional)
   - Create free account
   - Add email service
   - Update environment variables
   
4. ✅ Switch to Razorpay Live Mode
   - Generate live keys
   - Update `VITE_RAZORPAY_KEY`
   - Redeploy
   
5. ✅ Test end-to-end
   - Register member
   - Process payment
   - Verify SMS/WhatsApp/Email
   
6. ✅ Go live! 🚀

---

**Your SVCDA platform is production-ready!** 🎉
