# 🔐 Google Authentication Setup

## ⚡ Quick Setup (5 minutes)

### Step 1: Enable Google Provider in Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/goupzmplowjbnnxmnvou/auth/providers)
2. Click **Authentication** → **Providers**
3. Find **Google** and click to expand
4. Toggle **Enable Sign in with Google**

### Step 2: Configure Google OAuth
You have 2 options:

#### Option A: Use Supabase's Google OAuth (Easiest)
1. In Supabase Google provider settings
2. Click **"Use Supabase's Google OAuth application"**
3. Click **Save**
4. ✅ Done! (No Google Cloud Console needed)

#### Option B: Use Your Own Google OAuth (Recommended for Production)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized redirect URIs:
   ```
   https://goupzmplowjbnnxmnvou.supabase.co/auth/v1/callback
   ```
7. Copy **Client ID** and **Client Secret**
8. Paste in Supabase Google provider settings
9. Click **Save**

### Step 3: Configure Email Domain (Optional)
To restrict to @hitam.org emails only:

1. In Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Scroll to **Advanced Settings**
3. Add to **Allowed Domains**:
   ```
   hitam.org
   ```
4. Click **Save**

### Step 4: Test
1. Restart your app: `npm run dev`
2. Click "Log in with Google"
3. Select Google account
4. Should redirect to dashboard

---

## 🔧 What Was Added

### 1. Auth Service (`src/services/SupabaseAuthService.ts`)
```typescript
- signInWithGoogle() - Google OAuth login
- signOut() - Logout
- getSession() - Get current session
- getUser() - Get current user
- onAuthStateChange() - Listen to auth changes
```

### 2. Updated AuthenticationCard
- Google login now uses Supabase OAuth
- Automatic redirect after login
- Error handling

---

## 🎯 How It Works

```
User clicks "Log in with Google"
    ↓
supabaseAuthService.signInWithGoogle()
    ↓
Redirects to Google OAuth consent screen
    ↓
User approves
    ↓
Google redirects back to: /auth/v1/callback
    ↓
Supabase creates session
    ↓
User redirected to /dashboard
```

---

## 🐛 Troubleshooting

### Error: "Invalid redirect URI"
**Fix**: Add redirect URI in Google Cloud Console:
```
https://goupzmplowjbnnxmnvou.supabase.co/auth/v1/callback
```

### Error: "Email domain not allowed"
**Fix**: 
1. Remove domain restriction in Supabase
2. OR add your email domain to allowed list

### Login button does nothing
**Fix**: 
1. Check browser console for errors
2. Verify Google provider is enabled in Supabase
3. Check redirect URI is correct

### Stuck on loading screen
**Fix**:
1. Check Supabase logs in Dashboard → Logs
2. Verify OAuth credentials are correct
3. Clear browser cache and try again

---

## 📱 Testing

### Test with Different Accounts
```typescript
// Test 1: @hitam.org email (should work)
// Test 2: @gmail.com email (should fail if domain restricted)
// Test 3: Cancel OAuth (should show error)
```

### Check Session
```typescript
// In browser console
import { supabaseAuthService } from './src/services/SupabaseAuthService';
const session = await supabaseAuthService.getSession();
console.log('Session:', session);
```

---

## 🔐 Security Notes

1. **Never commit** Google OAuth credentials to git
2. Use **environment variables** for production
3. Enable **email verification** in Supabase
4. Set **session timeout** in Supabase settings
5. Use **Row Level Security** for database access

---

## ✅ Status

- ✅ Auth service created
- ✅ Google OAuth integrated
- ✅ Error handling added
- ⏳ Enable Google provider in Supabase
- ⏳ Test login flow

**After enabling in Supabase, Google auth will work!** 🎉
