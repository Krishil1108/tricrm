# 🚨 QUICK FIX - Email Not Sending

## Problem Found
Your `.env` file has **TWO ISSUES**:

1. ❌ `EMAIL_USER=your-shahkrishil1108@gmail.com` (has "your-" prefix)
2. ❌ `EMAIL_PASSWORD=Krishil@1104` (regular password won't work with Gmail)

## Gmail Requires App Password
Gmail blocks regular passwords for third-party apps. You **MUST** use an **App Password**.

---

## 🔧 3-Minute Fix

### Step 1: Enable 2-Step Verification
```
https://myaccount.google.com/security
Click "2-Step Verification" → Follow setup
```

### Step 2: Generate App Password  
```
https://myaccount.google.com/apppasswords
Select: Mail + Windows Computer → Generate
Copy the 16-character password (like: abcd efgh ijkl mnop)
```

### Step 3: Update .env File
```env
EMAIL_USER=shahkrishil1108@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop   # Your 16-char App Password (remove spaces)
```

### Step 4: Restart Server
```bash
# Stop current server (Ctrl+C in terminal)
cd backend
node server.js
```

### Step 5: Test
```
Go to: http://localhost:3000/forgot-password
Enter: shahkrishil1108@gmail.com
Check inbox (and spam folder)
```

---

## 🎯 Alternative: Test Without Email (Works Now!)

### Option 1: Use Ethereal (Fake Email)
Just comment out email credentials in `.env`:
```env
# EMAIL_USER=shahkrishil1108@gmail.com
# EMAIL_PASSWORD=your-password
```
Server will show preview URLs in console like:
```
Preview URL: https://ethereal.email/message/xxxxx
```

### Option 2: Manual Admin Reset (No Email Needed)
Reset password directly in database:
```bash
cd backend
node scripts/resetPassword.js admin NewPassword123!
```

---

## ✅ What's Already Done

✅ Password reset system fully implemented  
✅ Email service configured  
✅ Frontend pages created  
✅ Security features added  
✅ Admin CLI tool ready  

**Only thing missing:** Gmail App Password in `.env` file

---

## 📧 Expected Email Content

Once configured, users will receive:

**Subject:** Password Reset Request

**Content:**
- Personalized greeting
- Reset button/link
- 30-minute expiration warning
- Security tips
- Professional HTML design

---

## 🆘 Still Having Issues?

### Check Backend Console For:
```
✅ "Email service initialized successfully"  
❌ "Email credentials not configured"
❌ "Invalid login: 535-5.7.8"
```

### Common Errors:

**"Invalid login: 535-5.7.8"**
→ Using regular password instead of App Password

**"Email service not configured"**
→ .env file not loaded or wrong variable names

**"No email received"**
→ Check spam folder, verify email address

---

## 📱 Contact Info

**Need Help?**
- Full guide: `PASSWORD_RESET_SETUP_GUIDE.md`
- Manual reset: `node scripts/resetPassword.js`
- Test mode: Comment out EMAIL credentials

**Quick Links:**
- 2-Step Verification: https://myaccount.google.com/security
- App Passwords: https://myaccount.google.com/apppasswords

---

**Action Required:** Generate Gmail App Password & Update .env  
**Time:** 3 minutes  
**Status:** 🟡 Configuration Pending
