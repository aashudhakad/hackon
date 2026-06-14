# Authentication System Setup Guide

This guide explains how to use the newly implemented authentication system for signup and login.

## Backend Setup

### 1. Environment Variables

Add these variables to your `.env` file (based on `.env.example`):

```env
# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
```

**IMPORTANT**: Generate a secure JWT secret for production:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Start the Backend

```bash
cd backend
npm run dev
```

The authentication endpoints will be available at:
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login existing user
- `GET /api/auth/me` - Get current user profile (requires authentication)

## Frontend Setup

### 1. Start the Frontend

```bash
cd frontend
npm run dev
```

### 2. Access the Auth Pages

- **Signup**: http://localhost:3000/signup
- **Login**: http://localhost:3000/login

## Features Implemented

### Backend ✅

1. **User Model** (`backend/src/models/User.ts`)
   - Email and password fields
   - Automatic password hashing with bcrypt
   - Email validation and uniqueness
   - Timestamps (createdAt, updatedAt)

2. **Authentication Service** (`backend/src/services/authService.ts`)
   - User signup with duplicate email check
   - User login with secure password comparison
   - JWT token generation (7-day expiration)
   - Token verification and validation
   - User profile retrieval

3. **Auth Controller** (`backend/src/controllers/authController.ts`)
   - Signup endpoint handler
   - Login endpoint handler
   - Profile endpoint handler

4. **Auth Middleware** (`backend/src/middlewares/auth.ts`)
   - JWT token extraction from Authorization header
   - Token validation
   - User info attachment to request object
   - Error handling for invalid/expired tokens

5. **Rate Limiting** (`backend/src/middlewares/rateLimit.ts`)
   - Signup: 5 requests per hour per IP
   - Login: 10 requests per 15 minutes per IP
   - Redis-based rate limiting

6. **Input Validation** (`backend/src/controllers/authSchemas.ts`)
   - Email format validation
   - Password complexity requirements:
     - Minimum 8 characters
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
     - At least one special character (@$!%*?&)

7. **User Repository** (`backend/src/repositories/userRepository.ts`)
   - User creation
   - Email lookup with/without password
   - User ID lookup
   - Email existence check

### Frontend ✅

1. **Auth Context** (`frontend/src/lib/auth.tsx`)
   - Global authentication state management
   - Login/signup/logout functions
   - Token storage in localStorage
   - User persistence across page refreshes

2. **API Client** (`frontend/src/lib/api.ts`)
   - Auth API integration (signup, login, profile)
   - Automatic JWT token attachment to requests
   - Auto-redirect on 401 (token expired)

3. **Login Component** (`frontend/src/components/LoginForm.tsx`)
   - Email and password inputs
   - Form validation
   - Error display
   - Loading states
   - Switch to signup link

4. **Signup Component** (`frontend/src/components/SignupForm.tsx`)
   - Email and password inputs
   - Password confirmation
   - Real-time password requirements indicator
   - Client-side validation
   - Error display
   - Loading states
   - Switch to login link

5. **Login Page** (`frontend/src/app/login/page.tsx`)
   - Redirect authenticated users to home
   - Login form with navigation

6. **Signup Page** (`frontend/src/app/signup/page.tsx`)
   - Redirect authenticated users to home
   - Signup form with navigation

7. **User Menu** (`frontend/src/components/UserMenu.tsx`)
   - Display current user email
   - Logout button
   - Login/Signup buttons for unauthenticated users

## Security Features

### Password Security
- ✅ Bcrypt hashing with configurable salt rounds (default: 10)
- ✅ Password complexity requirements enforced
- ✅ Constant-time password comparison (timing attack prevention)
- ✅ Passwords never logged or exposed

### Authentication Security
- ✅ JWT tokens with HS256 signing
- ✅ 7-day token expiration
- ✅ Token validation on every protected request
- ✅ Secure token storage (Authorization header)

### API Security
- ✅ Rate limiting on auth endpoints
- ✅ Generic error messages (no account enumeration)
- ✅ Input validation with Zod schemas
- ✅ CORS configuration
- ✅ Request body sanitization

## Usage Examples

### Protecting Routes

To protect a backend route, add the `authenticate` middleware:

```typescript
import { authenticate } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/asyncHandler';

// Protected route example
apiRouter.get('/protected', authenticate, asyncHandler(async (req, res) => {
  // req.user will contain { userId, email }
  const user = await userRepository.findById(req.user!.userId);
  res.json({ user });
}));
```

### Using Auth in Frontend Components

```typescript
import { useAuth } from '@/lib/auth';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.email}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Adding UserMenu to Your App

Add the `UserMenu` component to your navigation:

```typescript
import { UserMenu } from '@/components/UserMenu';

function Navigation() {
  return (
    <nav>
      {/* Other nav items */}
      <UserMenu />
    </nav>
  );
}
```

## Testing

### Manual Testing

1. **Signup Flow**:
   - Go to http://localhost:3000/signup
   - Enter email and password (meeting requirements)
   - Click "Sign Up"
   - Should redirect to home page
   - Token stored in localStorage

2. **Login Flow**:
   - Logout if logged in
   - Go to http://localhost:3000/login
   - Enter credentials
   - Click "Login"
   - Should redirect to home page

3. **Protected Route**:
   - Make a request to `/api/auth/me` with the token
   - Should return user profile
   - Remove token and try again
   - Should return 401

### API Testing with curl

```bash
# Signup
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Get Profile (replace TOKEN with actual JWT)
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Troubleshooting

### "JWT_SECRET is required" Error
- Make sure you've added `JWT_SECRET` to your `.env` file
- Restart the backend server after adding environment variables

### "Redis connection failed" Warning
- Rate limiting will be disabled if Redis is unavailable
- Ensure Redis is running: `redis-server`
- Check `REDIS_URL` in `.env`

### "Email already registered" Error
- The email is already in the database
- Use a different email or check MongoDB to remove the user

### Tokens Not Persisting
- Check browser localStorage for `auth_token` and `user` keys
- Ensure cookies/localStorage are not blocked
- Check browser console for errors

## Next Steps

- [ ] Add password reset functionality
- [ ] Add email verification
- [ ] Add OAuth providers (Google, GitHub)
- [ ] Add refresh tokens
- [ ] Add two-factor authentication
- [ ] Add session management (view active sessions)
- [ ] Add password strength meter
- [ ] Add "Remember me" functionality

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── env.ts (JWT configuration added)
│   ├── controllers/
│   │   ├── authController.ts (NEW)
│   │   └── authSchemas.ts (NEW)
│   ├── middlewares/
│   │   ├── auth.ts (NEW)
│   │   └── rateLimit.ts (NEW)
│   ├── models/
│   │   └── User.ts (NEW)
│   ├── repositories/
│   │   └── userRepository.ts (NEW)
│   ├── routes/
│   │   └── index.ts (auth routes added)
│   └── services/
│       └── authService.ts (NEW)

frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx (AuthProvider added)
│   │   ├── login/
│   │   │   └── page.tsx (NEW)
│   │   └── signup/
│   │       └── page.tsx (NEW)
│   ├── components/
│   │   ├── LoginForm.tsx (NEW)
│   │   ├── SignupForm.tsx (NEW)
│   │   └── UserMenu.tsx (NEW)
│   └── lib/
│       ├── api.ts (auth API added)
│       └── auth.tsx (NEW)
```
