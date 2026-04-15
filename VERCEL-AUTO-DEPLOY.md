# 🚀 Vercel Auto-Deployment Setup Guide

## Why It's Not Auto-Deploying

Your code is pushed to GitHub ✅, but **Vercel doesn't know about it yet!**

You need to **connect GitHub to Vercel** for auto-deployment.

---

## 📋 Complete Setup (5 minutes)

### Step 1: Go to Vercel

1. Visit https://vercel.com
2. Click **"Sign Up"** or **"Log In"**
3. **Choose:** "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

---

### Step 2: Import Your Repository

1. After login, click **"Add New..."** → **"Project"**
2. You'll see **"Import Git Repository"** section
3. Find **`medfellowacademy/SVCDA`** in the list
4. Click **"Import"** next to it

**If you don't see your repo:**
- Click "Adjust GitHub App Permissions"
- Select your organization: `medfellowacademy`
- Click "Install" or "Configure"
- Select "All repositories" or just "SVCDA"
- Click "Install"

---

### Step 3: Configure Project Settings

Vercel will auto-detect the settings. **Verify these:**

#### Build Settings:
- **Framework Preset:** Vite (auto-detected) ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `dist` ✅
- **Install Command:** `npm install` ✅

#### Root Directory:
- Leave as **`.`** (root)

---

### Step 4: Add Environment Variables

**IMPORTANT!** Add these before deploying:

Click **"Environment Variables"** section and add:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://ugpnumgppmhtnozskxdq.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncG51bWdwcG1odG5venNreGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMzQyMDMsImV4cCI6MjA5MTgxMDIwM30.K3L88HprTX52J_xK_JmPzKCMQRCW07hhRDOHqNIxPW4` | Production, Preview, Development |
| `VITE_RAZORPAY_KEY` | `rzp_test_xxxxxxxxxxxxxx` | Production, Preview, Development |
| `VITE_MSG91_AUTH_KEY` | `your_msg91_key` | Production, Preview, Development |
| `VITE_MSG91_SENDER_ID` | `SVCDA` | Production, Preview, Development |
| `VITE_MSG91_DLT_ID` | `your_dlt_id` | Production, Preview, Development |

**Optional (EmailJS):**
| Name | Value | Environment |
|------|-------|-------------|
| `VITE_EMAILJS_SERVICE` | `service_xxxxxx` | Production, Preview, Development |
| `VITE_EMAILJS_TEMPLATE` | `template_xxxxxx` | Production, Preview, Development |
| `VITE_EMAILJS_KEY` | `xxxxxxxxxxxxxx` | Production, Preview, Development |
| `VITE_EMAILJS_ENABLED` | `false` | Production, Preview, Development |

**For each variable:**
1. Click "Add" or "Add Another"
2. Enter Name (e.g., `VITE_SUPABASE_URL`)
3. Enter Value
4. Select **all 3 environments**: Production, Preview, Development
5. Click "Add"

---

### Step 5: Deploy!

1. After adding environment variables, click **"Deploy"**
2. Wait 2-3 minutes for build
3. **Done!** 🎉

Your site will be live at: `https://svcda.vercel.app` (or similar)

---

## ✅ Auto-Deployment Now Active!

**From now on:**
- Every `git push` to `main` branch → Auto-deploys to production
- Every pull request → Creates preview deployment
- Vercel will email/notify you on each deployment

---

## 🔄 How Auto-Deployment Works

```
Your Computer → GitHub → Vercel → Live Site
     ↓              ↓         ↓
git push      Webhook   Auto Build
               ↓
            Deploy
```

**Workflow:**
1. You: `git push origin main`
2. GitHub: Sends webhook to Vercel
3. Vercel: Pulls code, runs `npm run build`
4. Vercel: Deploys `dist` folder
5. Live: Your site updates automatically!

**Time:** ~2 minutes per deployment

---

## 🧪 Test Auto-Deployment

Make a small change and test:

```bash
cd /Users/guneswaribokam/Downloads/SVCDA

# Make a small change (e.g., update README)
echo "# SVCDA - Auto Deploy Test" >> test.txt

# Commit and push
git add .
git commit -m "Test auto-deployment"
git push origin main
```

**Then:**
1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Watch the deployment progress
3. After ~2 minutes, click "Visit" to see updated site

---

## 🎛️ Vercel Dashboard Features

After connecting, you can:

### Deployments Tab:
- See all deployments (production + preview)
- View build logs
- Rollback to previous versions

### Settings Tab:
- Update environment variables
- Change domain
- Configure build settings

### Domains Tab:
- Add custom domain (e.g., svcda.com)
- Free SSL certificate

---

## 📊 Deployment Status

**Where to check:**
1. **Vercel Dashboard:** https://vercel.com/dashboard
2. **GitHub Repo:** Check "Environments" tab
3. **Email:** Vercel sends deployment notifications

**Build Status:**
- 🟢 Green checkmark = Deployed successfully
- 🟡 Yellow spinner = Building...
- 🔴 Red X = Build failed (check logs)

---

## 🐛 Troubleshooting

### Build Fails with "command not found"
**Solution:** 
- Check `package.json` has `"build": "vite build"` script
- Already done ✅

### Environment variables not working
**Solution:**
- Make sure variable names start with `VITE_`
- Must be added BEFORE first deployment
- Or redeploy after adding them

### GitHub repo not showing
**Solution:**
- Adjust GitHub App Permissions in Vercel
- Grant access to `medfellowacademy` organization

### Build succeeds but site broken
**Solution:**
- Check browser console for errors
- Verify environment variables are set correctly
- Check Vercel deployment logs

---

## 🔐 Environment Variables Reference

**Quick Copy-Paste:**

```env
# Supabase (Already configured)
VITE_SUPABASE_URL=https://ugpnumgppmhtnozskxdq.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncG51bWdwcG1odG5venNreGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMzQyMDMsImV4cCI6MjA5MTgxMDIwM30.K3L88HprTX52J_xK_JmPzKCMQRCW07hhRDOHqNIxPW4

# Razorpay (Update with your keys)
VITE_RAZORPAY_KEY=rzp_test_xxxxxxxxxxxxxx

# MSG91 (Update with your keys)
VITE_MSG91_AUTH_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
VITE_MSG91_SENDER_ID=SVCDA
VITE_MSG91_DLT_ID=xxxxxxxxxxxxxxxx

# EmailJS (Optional)
VITE_EMAILJS_SERVICE=service_xxxxxx
VITE_EMAILJS_TEMPLATE=template_xxxxxx
VITE_EMAILJS_KEY=xxxxxxxxxxxxxx
VITE_EMAILJS_ENABLED=false
```

---

## 🚀 Production Checklist

Before going live:

- [ ] Supabase tables created (run `supabase-tables.sql`)
- [ ] Vercel project imported from GitHub
- [ ] Environment variables added in Vercel
- [ ] Test deployment successful
- [ ] Update Razorpay to **live keys** (not test)
- [ ] Configure MSG91 (Auth Key, Sender ID, DLT)
- [ ] Optional: Setup EmailJS
- [ ] Test payment flow end-to-end
- [ ] Test member registration
- [ ] Add custom domain (optional)

---

## 🎯 Next Steps After Deployment

1. **Get MSG91 Credentials:**
   - See `MSG91-SETUP-GUIDE.md`
   - Update environment variables in Vercel

2. **Get Razorpay Live Keys:**
   - Login to Razorpay dashboard
   - Generate live keys
   - Update `VITE_RAZORPAY_KEY` in Vercel

3. **Optional: Setup EmailJS**
   - See `VERCEL-DEPLOYMENT.md`
   - Takes 10 minutes

4. **Test Everything:**
   - Register member
   - Process payment
   - Verify SMS/WhatsApp/Email

---

## 📞 Support

**Need help?**
- Vercel Docs: https://vercel.com/docs
- Email: info@svcdaservicehub.com
- Phone: +91 8978210705

---

## ✨ Summary

**To enable auto-deployment:**

1. Go to https://vercel.com
2. Sign in with GitHub
3. Import `medfellowacademy/SVCDA` repository
4. Add environment variables (copy from `.env` file)
5. Click "Deploy"
6. **Done!** Every `git push` now auto-deploys 🚀

**Time needed:** 5 minutes

**Your site will be live at:** `https://your-project-name.vercel.app`
