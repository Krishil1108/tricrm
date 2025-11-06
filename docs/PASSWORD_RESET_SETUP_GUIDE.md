# 🔐 Password Reset System - Complete Setup Guide

## ✅ What We've Implemented

### Backend Components
1. **PasswordResetToken Model** - Secure token storage with expiration
2. **Email Service** - Nodemailer integration with HTML templates
3. **Password Reset Routes** - `/forgot-password`, `/reset-password`, `/verify-reset-token`
4. **Admin CLI Script** - Manual password reset tool
5. **Security Features** - Rate limiting, token hashing, validation

### Frontend Components
1. **ForgotPasswordPage** - Email submission form
2. **ResetPasswordPage** - New password form with validation
3. **Updated LoginPage** - "Forgot Password" link added
4. **App Routes** - All routes configured

---

## 🚨 CURRENT ISSUE: Email Not Sending

### Problem
Your `.env` file has incorrect Gmail configuration:
```env
EMAIL_USER=shahkrishil1108@gmail.com   # ❌ Has "your-" prefix
EMAIL_PASSWORD=Krishil@1104                  # ❌ Regular password won't work
```

### Why Regular Gmail Password Doesn't Work
Gmail blocks third-party apps from using regular passwords for security. You **MUST** use an **App Password**.

---

## 📧 SOLUTION: Set Up Gmail App Password

### Step-by-Step Guide

#### **Step 1: Enable 2-Step Verification**
1. Go to: https://myaccount.google.com/security
2. Click on **"2-Step Verification"**
3. Follow the setup wizard to enable it
4. Verify your phone number

#### **Step 2: Generate App Password**
1. Go to: https://myaccount.google.com/apppasswords
2. You'll be asked to sign in again
3. Select:
   - **App**: Mail
   - **Device**: Windows Computer (or Other)
4. Click **"Generate"**
5. **COPY the 16-character password** (looks like: `abcd efgh ijkl mnop`)

#### **Step 3: Update .env File**
```env
# Remove "your-" prefix and use App Password
EMAIL_USER=shahkrishil1108@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop   # 16-char App Password (remove spaces)
```

#### **Step 4: Restart Backend Server**
```bash
cd backend
# Stop current server (Ctrl+C)
node server.js
```

---

## 🧪 Testing the Password Reset Flow

### Test 1: Forgot Password (Send Email)
```bash
# Frontend: Go to http://localhost:3000/forgot-password
# Enter email: shahkrishil1108@gmail.com
# Click "Send Reset Link"
```

**Expected Result:**
- Success message shown
- Email received in inbox (check spam folder too)
- Console shows: "Password reset email sent to..."

### Test 2: Reset Password (Use Link)
```bash
# Click link in email OR manually go to:
# http://localhost:3000/reset-password/{token}
# Enter new password
# Confirm password
# Click "Reset Password"
```

**Expected Result:**
- Password updated successfully
- Redirected to login page
- Confirmation email received

### Test 3: Manual Admin Reset (No Email Required)
```bash
cd backend
node scripts/resetPassword.js admin NewPassword123!
```

**Expected Result:**
- Password reset directly in database
- Works even if email is not configured

---

## 🔍 Troubleshooting

### Issue 1: "Email credentials not configured"
**Cause:** `.env` file not loaded or missing variables

**Solution:**
```bash
# Verify .env file exists
ls backend/.env

# Check if variables are correct
cat backend/.env | grep EMAIL_USER
cat backend/.env | grep EMAIL_PASSWORD

# Restart server after changing .env
```

### Issue 2: "Invalid login: 535-5.7.8 Username and Password not accepted"
**Cause:** Using regular password instead of App Password

**Solution:**
- Generate App Password (see Step 2 above)
- Make sure 2-Step Verification is enabled
- Use the 16-character App Password

### Issue 3: "No email received"
**Possible Causes:**
1. Check spam/junk folder
2. Wrong email address entered
3. Email service not properly configured
4. Firewall blocking SMTP

**Debug Steps:**
```bash
# Check backend console for errors
# Look for lines like:
# [WARN] Email credentials not configured
# [ERROR] Failed to send password reset email

# Enable debug mode in emailService.js
NODE_ENV=development node server.js
# This will show Ethereal preview URLs in console
```

### Issue 4: "Token expired or invalid"
**Cause:** Token expires after 30 minutes

**Solution:**
- Request a new password reset link
- Complete reset within 30 minutes
- Check system time is correct

---

## 🔐 Security Features Implemented

### 1. Token Security
- ✅ Tokens are hashed before storage (SHA-256)
- ✅ 30-minute expiration
- ✅ One-time use only
- ✅ Automatic cleanup of expired tokens

### 2. Rate Limiting
- ✅ Strict rate limit on forgot-password: 10 requests/15 minutes
- ✅ Auth rate limit on reset-password: 5 requests/15 minutes
- ✅ Prevents brute-force attacks

### 3. Privacy Protection
- ✅ Doesn't reveal if email exists (prevents enumeration)
- ✅ Same response for existing/non-existing users
- ✅ Logs IP address and user agent

### 4. Password Requirements
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter
- ✅ At least one number
- ✅ Real-time strength indicator

---

## 📝 Quick Fix Checklist

Copy this corrected `.env` configuration:

```env
# ============================================
# EMAIL CONFIGURATION (CORRECTED)
# ============================================

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false

# IMPORTANT: Remove "your-" prefix and use App Password
EMAIL_USER=shahkrishil1108@gmail.com
EMAIL_PASSWORD=your-16-char-app-password-here

EMAIL_FROM_NAME=CRM System

FRONTEND_URL=http://localhost:3000
```

### Action Items:
1. ⬜ Enable 2-Step Verification on Gmail account
2. ⬜ Generate App Password at https://myaccount.google.com/apppasswords
3. ⬜ Update EMAIL_USER (remove "your-" prefix)
4. ⬜ Update EMAIL_PASSWORD with 16-character App Password
5. ⬜ Restart backend server
6. ⬜ Test forgot password flow
7. ⬜ Check email inbox (and spam folder)

---

## 🎯 Alternative Options

### Option A: Use Ethereal (Testing/Development)
**No configuration needed!**

1. Comment out EMAIL_USER and EMAIL_PASSWORD:
```env
# EMAIL_USER=shahkrishil1108@gmail.com
# EMAIL_PASSWORD=your-password
```

2. Backend will automatically use Ethereal (fake SMTP)
3. Console will show preview URLs like:
```
📧 Password reset email sent!
   Preview URL: https://ethereal.email/message/xxxxx
```

### Option B: Manual Admin Reset (No Email)
**Works immediately without any email setup!**

```bash
cd backend
node scripts/resetPassword.js admin NewPassword123!
```

### Option C: Use SendGrid (Production)
**Free tier: 100 emails/day**

1. Sign up at https://sendgrid.com
2. Create API key
3. Update .env:
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key-here
```

---

## 📊 Email Service Comparison

| Service | Free Tier | Setup Time | Best For |
|---------|-----------|------------|----------|
| **Gmail App Password** | Unlimited | 5 min | Development/Small Apps |
| **Ethereal** | Unlimited | 0 min | Testing Only |
| **SendGrid** | 100/day | 10 min | Production |
| **Admin CLI** | N/A | 0 min | Emergency Access |

---

## 🚀 Next Steps After Email Setup

1. **Test All Flows:**
   - Forgot password request
   - Email delivery
   - Reset password
   - Confirmation email

2. **Test Edge Cases:**
   - Expired token
   - Invalid token
   - Used token
   - Non-existent email

3. **Production Checklist:**
   - Change JWT_SECRET
   - Use SendGrid instead of Gmail
   - Set NODE_ENV=production
   - Configure proper FRONTEND_URL
   - Set up email monitoring

---

## 📞 Support

If you're still having issues:

1. **Check Backend Console:** Look for error messages
2. **Check Browser Console:** Look for API errors
3. **Verify Email Sent:** Check backend logs in `logs/` directory
4. **Use Manual Reset:** Bypass email with CLI script

---

**Created:** 2025-11-05  
**Version:** 1.0.0  
**Status:** Ready for Testing
