# 🔍 Google Login Troubleshooting

## ✅ Google Login IS There!

The Google login button exists in your app. Here's where to find it:

### Location on Login Page:
1. **Toggle Buttons**: "Google" and "HITAM ID" (top of form)
2. **Login Button**: "Log in with Google (@hitam.org)" (when Google is selected)

---

## 🎯 How to Use Google Login

### Step 1: Select Role
- Choose: Principal, Registrar, HOD, Program Head, or Employee

### Step 2: Select Google Method
- Click the **"Google"** button (should be blue/highlighted by default)

### Step 3: Click Login
- Click **"Log in with Google (@hitam.org)"** button
- Should redirect to Google OAuth

---

## 🐛 If Button Doesn't Work

### Check 1: Browser Console
Press F12 and check for errors:
```javascript
// Look for:
- "Failed to resolve import @supabase/supabase-js" ❌
- "signInWithGoogle is not a function" ❌
- No errors ✅
```

### Check 2: Supabase Configuration
1. Go to: https://supabase.com/dashboard/project/goupzmplowjbnnxmnvou/auth/providers
2. Verify Google provider is **ENABLED** (toggle should be ON)
3. Verify credentials are saved:
   - Client ID: `13234769370-jfqkc49u601rmba56pjov1bo9i5egkql.apps.googleusercontent.com`
   - Client Secret: `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`

### Check 3: Environment Variables
Verify `.env` file exists with:
```
VITE_SUPABASE_URL=https://goupzmplowjbnnxmnvou.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Check 4: Restart Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## 🎨 Visual Guide

```
┌─────────────────────────────────────┐
│         IAOMS Login                 │
│  Hyderabad Institute of Technology  │
├─────────────────────────────────────┤
│                                     │
│  Select Your Role:                  │
│  [Choose your role... ▼]            │
│                                     │
│  ┌─────────┐  ┌─────────┐         │
│  │ Google  │  │ HITAM ID│  ← Toggle│
│  └─────────┘  └─────────┘         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Log in with Google          │   │ ← Click this
│  │ (@hitam.org)                │   │
│  └─────────────────────────────┘   │
│                                     │
│  Only @hitam.org email addresses    │
│  are allowed                        │
└─────────────────────────────────────┘
```

---

## 🔄 Expected Flow

1. **Select Role** → Button enabled
2. **Click "Log in with Google"** → Redirects to Google
3. **Select Google Account** → OAuth consent
4. **Approve** → Redirects back to app
5. **Logged In** → Dashboard appears

---

## ⚠️ Common Issues

### Issue: Button is Grayed Out
**Cause**: No role selected
**Fix**: Select a role from dropdown first

### Issue: Button Does Nothing
**Cause**: Supabase not configured
**Fix**: Enable Google provider in Supabase dashboard

### Issue: "Invalid OAuth Client"
**Cause**: Wrong credentials in Supabase
**Fix**: Re-enter Client ID and Secret

### Issue: Redirects to Error Page
**Cause**: Redirect URI mismatch
**Fix**: Add `https://goupzmplowjbnnxmnvou.supabase.co/auth/v1/callback` to Google Cloud Console

---

## ✅ Quick Test

Open browser console and run:
```javascript
// Test Supabase connection
import { supabase } from './src/lib/supabase';
console.log('Supabase:', supabase);

// Test auth service
import { supabaseAuthService } from './src/services/SupabaseAuthService';
console.log('Auth Service:', supabaseAuthService);
```

---

## 📞 Still Not Working?

1. Clear browser cache
2. Try incognito/private window
3. Check Supabase logs: Dashboard → Logs
4. Verify Google OAuth is enabled in Google Cloud Console

---

**The button IS there - it's the "Log in with Google (@hitam.org)" button!** 🎉
