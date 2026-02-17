# ✅ Google OAuth Configuration

## 🔐 Your Credentials

**Client ID**: `13234769370-jfqkc49u601rmba56pjov1bo9i5egkql.apps.googleusercontent.com`
**Client Secret**: `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`
**Redirect URI**: `https://goupzmplowjbnnxmnvou.supabase.co/auth/v1/callback`

---

## 🚀 Setup Steps (1 minute)

### Step 1: Add to Supabase
1. Go to: https://supabase.com/dashboard/project/goupzmplowjbnnxmnvou/auth/providers
2. Click **Google** provider
3. Toggle **Enable Sign in with Google** to ON
4. Paste credentials:
   - **Client ID**: `13234769370-jfqkc49u601rmba56pjov1bo9i5egkql.apps.googleusercontent.com`
   - **Client Secret**: `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`
5. Click **Save**

### Step 2: Verify Redirect URI in Google Cloud Console
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, verify it includes:
   ```
   https://goupzmplowjbnnxmnvou.supabase.co/auth/v1/callback
   ```
4. If not, add it and click **Save**

### Step 3: Test
```bash
npm run dev
```
Click "Log in with Google" - should work now!

---

## ✅ What's Configured

- ✅ Google OAuth Client ID
- ✅ Google OAuth Client Secret  
- ✅ Redirect URI matches Supabase
- ✅ Auth service ready
- ✅ Login button integrated

---

## 🎯 Expected Flow

```
User clicks "Log in with Google"
    ↓
Redirects to Google OAuth
    ↓
User selects Google account
    ↓
Google redirects to: https://goupzmplowjbnnxmnvou.supabase.co/auth/v1/callback
    ↓
Supabase creates session
    ↓
User redirected to /dashboard
    ↓
✅ Logged in!
```

---

## 🔒 Optional: Restrict to @hitam.org

In Supabase Google provider settings:
1. Scroll to **Advanced Settings**
2. Add to **Allowed Domains**: `hitam.org`
3. Click **Save**

Now only @hitam.org emails can sign in.

---

## ✅ Status

- ✅ Credentials provided
- ⏳ Add to Supabase Dashboard
- ⏳ Test login

**After adding to Supabase, Google login will work!** 🎉
