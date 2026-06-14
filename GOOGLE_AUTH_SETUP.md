# 🔐 Google OAuth Login Setup Guide

## ✅ What's Been Implemented

I've added **Google OAuth Login** to your authentication system! Users can now sign up and log in with their Google accounts.

### New Features:
- ✅ "Continue with Google" button on login page
- ✅ "Continue with Google" button on signup page
- ✅ Automatic user creation for new Google users
- ✅ Seamless account linking for existing email users
- ✅ Profile picture and display name from Google
- ✅ Secure JWT token generation after Google auth
- ✅ Automatic redirect back to your app

---

## 🆓 Google OAuth is 100% FREE!

Google OAuth is **completely free** to use with no limits for authentication. You just need to create a project in Google Cloud Console.

---

## 📋 Step-by-Step Setup (Takes 5 minutes)

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account (any Gmail account works)

### Step 2: Create a New Project

1. Click on the project dropdown at the top
2. Click "New Project"
3. Enter project name: `hackon-auth` (or anything you like)
4. Click "Create"
5. Wait a few seconds for the project to be created
6. Make sure your new project is selected in the dropdown

### Step 3: Enable Google+ API

1. In the search bar at the top, type "Google+ API"
2. Click on "Google+ API" in the results
3. Click "Enable" button
4. Wait for it to enable (about 10 seconds)

### Step 4: Configure OAuth Consent Screen

1. In the left sidebar, click "OAuth consent screen"
2. Select "External" (allows anyone with Google account to sign in)
3. Click "Create"

**Fill in the required fields:**
- **App name**: `Hackon App` (or your app name)
- **User support email**: Select your email from dropdown
- **Developer contact email**: Enter your email

4. Click "Save and Continue"
5. On "Scopes" page, click "Save and Continue" (no changes needed)
6. On "Test users" page, click "Save and Continue" (no changes needed)
7. Click "Back to Dashboard"

### Step 5: Create OAuth Credentials

1. In the left sidebar, click "Credentials"
2. Click "+ CREATE CREDENTIALS" at the top
3. Select "OAuth client ID"

**Configure the OAuth client:**
- **Application type**: Select "Web application"
- **Name**: `Hackon Web Client`

**Authorized JavaScript origins:**
- Click "+ ADD URI"
- Enter: `http://localhost:4000`
- Click "+ ADD URI" again
- Enter: `http://localhost:3000`

**Authorized redirect URIs:**
- Click "+ ADD URI"
- Enter: `http://localhost:4000/api/auth/google/callback`

4. Click "CREATE"

### Step 6: Copy Your Credentials

A popup will appear with your credentials:

1. **Copy the Client ID** (looks like: `123456789-abcdefg.apps.googleusercontent.com`)
2. **Copy the Client Secret** (looks like: `GOCSPX-abcd1234...`)

**IMPORTANT**: Keep these safe! Don't share them publicly.

### Step 7: Update Your .env File

Open your backend `.env` file and replace the placeholders:

```env
# ---- Google OAuth (FREE) ----
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

**Example (DO NOT use these - they won't work):**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-a1b2c3d4e5f6g7h8i9j0
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

### Step 8: Restart Your Backend

```bash
# Stop the backend (Ctrl+C in the terminal)
# Or if using my process manager, I'll restart it for you

# Start it again
cd backend
npm run dev
```

---

## 🎉 You're Done! Test It Out

1. Go to http://localhost:3000/login
2. Click "Continue with Google"
3. Select your Google account
4. Grant permissions
5. You'll be redirected back and logged in!

---

## 🌐 For Production Deployment

When you're ready to deploy:

### 1. Update Google Cloud Console

Go back to Google Cloud Console → Credentials → Edit your OAuth client:

**Add production URLs:**

**Authorized JavaScript origins:**
- `https://yourdomain.com`
- `https://api.yourdomain.com`

**Authorized redirect URIs:**
- `https://api.yourdomain.com/api/auth/google/callback`

### 2. Update Production .env

```env
GOOGLE_CLIENT_ID=your-same-client-id
GOOGLE_CLIENT_SECRET=your-same-client-secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback
FRONTEND_URL=https://yourdomain.com
```

---

## 📁 Files Created/Modified

### Backend:
- ✅ `src/config/passport.ts` - Google OAuth strategy
- ✅ `src/models/User.ts` - Added Google fields
- ✅ `src/services/authService.ts` - Added Google auth method
- ✅ `src/controllers/authController.ts` - Added Google callback handler
- ✅ `src/routes/index.ts` - Added Google OAuth routes
- ✅ `src/app.ts` - Initialized Passport
- ✅ `.env` - Added Google OAuth config

### Frontend:
- ✅ `src/components/GoogleLoginButton.tsx` - Google button component
- ✅ `src/app/auth/callback/page.tsx` - OAuth callback handler
- ✅ `src/components/LoginForm.tsx` - Added Google button
- ✅ `src/components/SignupForm.tsx` - Added Google button

---

## 🔧 Troubleshooting

### "Redirect URI mismatch" error

**Problem**: The callback URL doesn't match what's in Google Console

**Solution**:
1. Make sure you added `http://localhost:4000/api/auth/google/callback` to Authorized redirect URIs
2. Make sure there are no extra spaces or typos
3. Wait a few minutes for Google changes to propagate

### "Access blocked: This app's request is invalid"

**Problem**: OAuth consent screen not properly configured

**Solution**:
1. Go back to "OAuth consent screen" in Google Console
2. Make sure all required fields are filled
3. Click "Publish App" if you see that button

### "Google OAuth not configured" in logs

**Problem**: Environment variables not set

**Solution**:
1. Check your `.env` file has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Restart the backend server
3. Make sure there are no extra quotes or spaces in the values

### Button doesn't redirect

**Problem**: Frontend URL hardcoded

**Solution**:
- The Google button uses `http://localhost:4000` - if your backend runs on a different port, update `GoogleLoginButton.tsx`:
```typescript
window.location.href = 'http://YOUR_BACKEND_URL:PORT/api/auth/google';
```

---

## 🎨 Customization

### Change Button Text

Edit `frontend/src/components/GoogleLoginButton.tsx`:
```typescript
<span className="text-sm font-medium text-gray-700">
  Sign in with Google  {/* Change this text */}
</span>
```

### Change Button Style

The button uses Tailwind CSS. Modify the className in `GoogleLoginButton.tsx`.

### Add More OAuth Providers

Want to add GitHub, Facebook, or other providers?
1. Install the passport strategy: `npm install passport-github2`
2. Follow the same pattern as Google OAuth
3. Add to `config/passport.ts`

---

## 🔐 Security Notes

- ✅ Client secrets are stored server-side only (never exposed to frontend)
- ✅ JWT tokens are generated after successful Google auth
- ✅ User data synced with your MongoDB database
- ✅ Email verification handled by Google
- ✅ No password needed for Google users

---

## 📊 Database Changes

Users who sign up with Google will have:
```javascript
{
  email: "user@gmail.com",
  googleId: "1234567890",
  displayName: "John Doe",
  profilePicture: "https://...",
  authProvider: "google",
  password: undefined  // No password for Google users
}
```

Users who sign up with email/password:
```javascript
{
  email: "user@example.com",
  googleId: undefined,
  displayName: undefined,
  profilePicture: undefined,
  authProvider: "local",
  password: "hashed_password"
}
```

---

## ✨ Benefits

1. **Faster signup** - Users don't need to remember another password
2. **Higher conversion** - People trust Google authentication
3. **Better security** - Google handles 2FA, password resets, etc.
4. **Profile data** - Get user's name and picture automatically
5. **No verification** - Google emails are already verified

---

## 📞 Need Help?

If you run into issues:
1. Check the backend logs for error messages
2. Verify all URLs match exactly (no trailing slashes)
3. Make sure the project is selected in Google Console
4. Try creating a new OAuth client if stuck

---

**That's it! Your app now supports Google Login! 🎉**
