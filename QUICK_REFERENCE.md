# 🚀 Quick Reference - Multi-Page App

## 📍 Routes

| Route | Protection | Purpose |
|-------|-----------|---------|
| `/` | Public | Home/Search |
| `/shop` | Public | Browse Products |
| `/cart` | Public | Review Cart |
| `/checkout` | 🔒 Protected | Payment |
| `/orders` | 🔒 Protected | Order History |
| `/orders/[id]` | 🔒 Protected | Order Details |
| `/login` | Public | Login |
| `/signup` | Public | Signup |

## 🔑 Key Features

### Cart Management
```typescript
import { useCart } from '@/lib/cart';

const { cart, total, count, addToCart, removeItem } = useCart();
```

### Authentication
```typescript
import { useAuth } from '@/lib/auth';

const { isAuthenticated, user, login, logout } = useAuth();
```

### Protected Routes
```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

<ProtectedRoute>
  <YourProtectedPage />
</ProtectedRoute>
```

## 🔗 API Endpoints

### Orders
- `GET /api/orders` - List user's orders [🔒]
- `GET /api/orders/:id` - Get order details [🔒]
- `POST /api/checkout` - Create order [🔒]

### Shopping
- `POST /api/shop` - Search products
- `POST /api/vision` - Image search
- `POST /api/cross-sell` - Get recommendations

### Auth
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get profile [🔒]

## 🧪 Quick Test

```bash
# 1. Start servers (already running)
# Backend: http://localhost:4000
# Frontend: http://localhost:3000

# 2. Test flow
1. Go to http://localhost:3000
2. Search for products
3. Add to cart on /shop
4. Go to /cart
5. Try checkout (redirects to login if not logged in)
6. Login and complete checkout
7. View orders at /orders
```

## 📂 Key Files

### Frontend
- `src/lib/cart.tsx` - Cart context
- `src/lib/auth.tsx` - Auth context  
- `src/components/ProtectedRoute.tsx` - Route protection
- `src/app/page.tsx` - Home page
- `src/app/shop/page.tsx` - Shopping
- `src/app/cart/page.tsx` - Cart
- `src/app/checkout/page.tsx` - Checkout
- `src/app/orders/page.tsx` - Orders list
- `src/app/orders/[id]/page.tsx` - Order details

### Backend
- `src/controllers/ordersController.ts` - Orders API
- `src/models/Order.ts` - Order model (with userId)
- `src/repositories/orderRepository.ts` - Order queries
- `src/routes/index.ts` - All routes

## 🔒 Security

- ✅ JWT token authentication
- ✅ Protected routes (frontend)
- ✅ Authenticate middleware (backend)
- ✅ Order ownership verification
- ✅ 401 auto-redirect to login

## 🎯 User Flow

```
Home → Shop → Cart → Login → Checkout → Order Confirmation → Orders
```

## 📊 State Management

**Cart State** (Global):
- Managed by CartContext
- Auto-saved to localStorage
- Shared across all pages

**Auth State** (Global):
- Managed by AuthContext
- Token in localStorage
- User info cached

## ⚡ Quick Commands

```bash
# Restart servers
cd backend && npm run dev
cd frontend && npm run dev

# Check diagnostics
# (use get_diagnostics tool in Kiro)

# View logs
# (use get_process_output tool in Kiro)
```

## 🆘 Troubleshooting

**Cart not saving?**
- Check localStorage in browser DevTools
- Look for `cartState` key

**Can't access /checkout?**
- Must be logged in
- Check auth token in localStorage (`auth_token`)

**Orders not showing?**
- Check backend logs
- Verify user is authenticated
- Check MongoDB connection

**Page not loading?**
- Check both servers are running
- Check browser console for errors
- Check network tab for failed requests

## 📱 Test URLs

- Home: http://localhost:3000
- Shop: http://localhost:3000/shop
- Cart: http://localhost:3000/cart
- Checkout: http://localhost:3000/checkout (requires login)
- Orders: http://localhost:3000/orders (requires login)
- Login: http://localhost:3000/login
- Signup: http://localhost:3000/signup

---

**Ready to test!** 🎉
