# Quick Test Guide - Cart State Preservation

## 🚀 Quick Test Steps

### Test the Complete Flow (2 minutes)

1. **Open the app**: http://localhost:3000

2. **Make sure you're NOT logged in**:
   - Check top-right corner - should show "Login | Signup" buttons
   - If you see email, click and logout first

3. **Add items to cart**:
   - Type something in the intent bar (e.g., "party supplies")
   - Click search or press Enter
   - Wait for products to load
   - Items should be in your cart

4. **Try to checkout**:
   - Scroll down to see cart summary
   - Click "Proceed to Payment" button at bottom
   - ✅ **Expected**: Redirected to login page
   - ✅ **Expected**: Blue message appears: "Please log in to continue with your order"

5. **Log in**:
   - Enter your email and password
   - Click "Log in" button
   - ✅ **Expected**: Automatically redirected to home page
   - ✅ **Expected**: Shopping screen appears
   - ✅ **Expected**: All your cart items are still there
   - ✅ **Expected**: Payment modal opens automatically

6. **Complete checkout**:
   - Select payment method (UPI/Credit Card/Cash on Delivery)
   - Click "Confirm Payment"
   - ✅ **Expected**: Order placed successfully
   - ✅ **Expected**: Order confirmation screen shows

## 🎯 What to Look For

### ✅ Success Indicators:
- Cart items preserved after login
- Payment modal opens automatically
- No errors in browser console
- Order can be completed

### ❌ Failure Indicators:
- Cart is empty after login
- Payment modal doesn't open
- Errors in console
- Stuck on loading screen

## 🔍 Debug Tips

### If cart is not restored:

1. **Open Browser Console** (F12)
2. **Go to Application tab → Local Storage**
3. **Before login**: Check if `pendingCheckout` exists
4. **After login**: Check if `pendingCheckout` was removed

### If you see errors:

1. Check browser console (F12 → Console tab)
2. Check backend logs in terminal
3. Verify both servers are running:
   - Backend: http://localhost:4000
   - Frontend: http://localhost:3000

## 📝 Alternative Test: Signup Flow

1. Add items to cart (not logged in)
2. Click "Proceed to Payment"
3. On login page, click "Sign up" link
4. ✅ **Expected**: Signup page shows with message
5. Create new account
6. ✅ **Expected**: Cart restored after signup

## 📱 Test Different Scenarios

### Scenario A: Already Logged In
1. Log in first
2. Add items to cart
3. Click "Proceed to Payment"
4. ✅ **Expected**: Payment modal opens directly (no redirect)

### Scenario B: Browser Close
1. Add items to cart (not logged in)
2. Click "Proceed to Payment"
3. Close browser completely
4. Reopen browser
5. Go to http://localhost:3000
6. Log in manually
7. ✅ **Expected**: Cart is restored

### Scenario C: Cancel and Return
1. Add items to cart
2. Click "Proceed to Payment"
3. See login page
4. Click back button
5. Add more items
6. Click "Proceed to Payment" again
7. Log in
8. ✅ **Expected**: All items (including new ones) restored

## 🛠️ Quick Fixes

### Frontend not responding:
```bash
# Restart frontend
cd c:\Users\yashr\Downloads\hackon\hackon\frontend
npm run dev
```

### Backend not responding:
```bash
# Restart backend
cd c:\Users\yashr\Downloads\hackon\hackon\backend
npm run dev
```

### Clear saved cart state:
1. Open browser console (F12)
2. Run: `localStorage.removeItem('pendingCheckout')`

## ✨ Expected User Experience

**Before** (without cart preservation):
1. User adds items → clicks checkout → redirected to login
2. User logs in → cart is empty → frustrated 😞

**After** (with cart preservation):
1. User adds items → clicks checkout → redirected to login
2. User logs in → cart restored → payment modal ready → happy! 😊

## 📊 Success Metrics

- ✅ No cart abandonment due to login redirect
- ✅ Seamless checkout flow
- ✅ Clear user communication
- ✅ Persistent across browser sessions
- ✅ Works for both login and signup

## 🎉 Ready to Test!

Both servers are running. Open http://localhost:3000 and try the flow!
