# Cart State Preservation After Login

## Overview
Users who attempt to checkout without being logged in will be redirected to the login page. After logging in (or signing up), they will be automatically returned to their cart with all items intact and the payment modal ready.

## How It Works

### 1. **User Attempts Checkout While Not Logged In**

When an unauthenticated user clicks "Proceed to Payment":

1. **Cart State is Saved to localStorage** with key `pendingCheckout`:
   ```json
   {
     "cart": [...],
     "submittedIntent": "...",
     "categories": [...],
     "rows": [...],
     "tiers": {...},
     "flashTier": "Balanced",
     "crossSell": [...],
     "unfulfilled": [...],
     "mode": "quick"
   }
   ```

2. **User is Redirected to Login Page** with query parameter:
   - URL: `/login?redirect=checkout`
   - A helpful message appears: "Please log in to continue with your order"

### 2. **User Logs In or Signs Up**

- User enters credentials and logs in
- OR user switches to signup page (redirect parameter is preserved)
- After successful authentication, user is redirected to home page (`/`)

### 3. **Cart State is Automatically Restored**

When the home page loads and detects the user is authenticated:

1. **Checks localStorage** for `pendingCheckout` data
2. **Restores all cart state**:
   - Shopping cart items with quantities
   - Submitted intent text
   - Product categories and rows
   - Tier selections (for Flash mode)
   - Cross-sell products
   - Current mode (Quick or Flash)
3. **Switches to shopping screen** automatically
4. **Opens payment modal** immediately
5. **Clears saved state** from localStorage

## User Flow Diagram

```
User adds items to cart
         ↓
User clicks "Proceed to Payment"
         ↓
    Authenticated?
         ↓
    NO ─────→ Save cart state to localStorage
              Redirect to /login?redirect=checkout
              Show message: "Please log in to continue"
                   ↓
              User logs in / signs up
                   ↓
              Redirect to home page (/)
                   ↓
              Detect pendingCheckout in localStorage
                   ↓
              Restore cart state
              Switch to shopping screen
              Open payment modal
              Clear pendingCheckout
                   ↓
    YES ──────────→ Open payment modal directly
                   ↓
              User completes payment
                   ↓
              Order placed
```

## Implementation Details

### Files Modified

#### 1. `frontend/src/app/page.tsx`
- **Import**: Added `useEffect` to React imports
- **State Restoration**: Added `useEffect` hook that runs when `isAuthenticated` changes
- **Checkout Handler**: Modified `handleCheckout` to save cart state before redirecting

**Key Code**:
```typescript
// Restore cart state after login
useEffect(() => {
  if (isAuthenticated) {
    const pendingCheckout = localStorage.getItem('pendingCheckout');
    if (pendingCheckout) {
      try {
        const cartState = JSON.parse(pendingCheckout);
        setCart(cartState.cart);
        setSubmittedIntent(cartState.submittedIntent);
        setCategories(cartState.categories);
        setRows(cartState.rows);
        setTiers(cartState.tiers);
        setFlashTier(cartState.flashTier);
        setCrossSell(cartState.crossSell);
        setUnfulfilled(cartState.unfulfilled);
        setMode(cartState.mode);
        setScreen('shopping');
        setShowPayment(true);
        
        // Clear the saved state
        localStorage.removeItem('pendingCheckout');
      } catch (err) {
        console.error('Failed to restore cart state:', err);
        localStorage.removeItem('pendingCheckout');
      }
    }
  }
}, [isAuthenticated]);

const handleCheckout = useCallback(() => {
  if (!isAuthenticated) {
    // Save cart state to localStorage before redirecting to login
    const cartState = {
      cart,
      submittedIntent,
      categories,
      rows,
      tiers,
      flashTier,
      crossSell,
      unfulfilled,
      mode,
    };
    localStorage.setItem('pendingCheckout', JSON.stringify(cartState));
    
    // Redirect to login page with return URL
    router.push('/login?redirect=checkout');
    return;
  }
  setShowPayment(true);
}, [isAuthenticated, router, cart, ...]);
```

#### 2. `frontend/src/app/login/page.tsx`
- **Import**: Added `useSearchParams` from `next/navigation`
- **Redirect Parameter**: Reads `redirect` query parameter
- **User Message**: Shows helpful message when `redirect=checkout`

**Key Code**:
```typescript
const searchParams = useSearchParams();
const redirect = searchParams.get('redirect');

{redirect === 'checkout' && (
  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 text-center">
    Please log in to continue with your order
  </div>
)}

<LoginForm
  onSuccess={() => router.push('/')}
  onSwitchToSignup={() => router.push('/signup?redirect=' + (redirect || ''))}
/>
```

#### 3. `frontend/src/app/signup/page.tsx`
- **Import**: Added `useSearchParams` from `next/navigation`
- **Redirect Parameter**: Reads `redirect` query parameter
- **User Message**: Shows helpful message when `redirect=checkout`

**Key Code**:
```typescript
const searchParams = useSearchParams();
const redirect = searchParams.get('redirect');

{redirect === 'checkout' && (
  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 text-center">
    Create an account to continue with your order
  </div>
)}

<SignupForm
  onSuccess={() => router.push('/')}
  onSwitchToLogin={() => router.push('/login?redirect=' + (redirect || ''))}
/>
```

## Data Stored in localStorage

### Key: `pendingCheckout`

The following cart state is preserved:

| Field | Type | Description |
|-------|------|-------------|
| `cart` | `CartLine[]` | Array of cart items with products and quantities |
| `submittedIntent` | `string` | User's original shopping intent text |
| `categories` | `string[]` | Product categories from the search |
| `rows` | `CategoryRow[]` | Quick mode product rows with alternatives |
| `tiers` | `Record<TierName, BasketTier>` | Flash mode tier baskets |
| `flashTier` | `TierName` | Currently selected Flash tier |
| `crossSell` | `Product[]` | Cross-sell product recommendations |
| `unfulfilled` | `string[]` | Components that couldn't be fulfilled |
| `mode` | `Mode` | Shopping mode ('quick' or 'flash') |

### Data Lifecycle

1. **Created**: When user clicks checkout without being logged in
2. **Read**: When authenticated user lands on home page
3. **Deleted**: Immediately after successful restoration OR if parsing fails

## Error Handling

### Scenarios Handled:

1. **Corrupted localStorage Data**:
   - Wrapped in try-catch block
   - Logs error to console
   - Removes corrupted data
   - User starts fresh (no cart restored)

2. **Missing Cart State**:
   - Simply does nothing
   - Normal home page flow continues

3. **User Closes Browser**:
   - Cart state persists in localStorage
   - Will be restored when user returns and logs in

4. **User Already Logged In**:
   - No state saving occurs
   - Payment modal opens directly
   - No localStorage interaction

## Security Considerations

### What's Stored:
- ✅ Product IDs and quantities
- ✅ Shopping intent (public data)
- ✅ UI state (mode, tier selection)

### What's NOT Stored:
- ❌ User credentials
- ❌ JWT tokens (stored separately)
- ❌ Payment information
- ❌ Personal information

### Storage Duration:
- Temporary (cleared after restoration)
- Survives browser close (localStorage persists)
- Cleared on successful checkout
- Cleared on restoration failure

## Testing Scenarios

### Scenario 1: Happy Path
1. Browse products without logging in
2. Add items to cart (e.g., 3 items)
3. Click "Proceed to Payment"
4. **Expected**: Redirected to login with message
5. Log in with valid credentials
6. **Expected**: 
   - Returned to shopping screen
   - All 3 items still in cart
   - Payment modal opens automatically
7. Complete payment
8. **Expected**: Order placed successfully

### Scenario 2: Sign Up Instead of Login
1. Add items to cart without login
2. Click "Proceed to Payment"
3. Redirected to login page
4. Click "Sign up" link
5. **Expected**: Redirected to signup with message and redirect parameter
6. Create new account
7. **Expected**: Cart restored with all items

### Scenario 3: Browser Closed During Login
1. Add items to cart
2. Click "Proceed to Payment"
3. Close browser before logging in
4. Reopen browser and navigate to site
5. Log in
6. **Expected**: Cart is still restored with all items

### Scenario 4: User Cancels Login
1. Add items to cart
2. Click "Proceed to Payment"
3. See login page
4. Navigate back to home manually
5. **Expected**: 
   - Cart state remains in localStorage
   - If user logs in later, cart will be restored

### Scenario 5: Multiple Checkout Attempts
1. Add items to cart
2. Click "Proceed to Payment" (not logged in)
3. Cancel and go back
4. Add more items
5. Click "Proceed to Payment" again
6. Log in
7. **Expected**: Latest cart state is restored (not first one)

## User Experience Benefits

1. **No Lost Progress**: Users don't lose their cart when redirected to login
2. **Seamless Flow**: After login, immediately ready to checkout
3. **Clear Communication**: Helpful messages explain why login is needed
4. **Flexible**: Works for both login and signup flows
5. **Persistent**: Cart survives browser close/refresh
6. **Smart**: Automatically opens payment modal after restoration

## Browser Compatibility

Uses standard Web APIs available in all modern browsers:
- `localStorage` - Supported by all modern browsers
- `JSON.parse` / `JSON.stringify` - Standard JavaScript
- `useEffect` - React hook
- `useSearchParams` - Next.js 13+ hook

## Future Enhancements

Potential improvements:
1. **Expiration**: Add timestamp and expire saved cart after 24 hours
2. **Multiple Carts**: Support saving multiple cart states with IDs
3. **Sync to Server**: Save cart to database for cross-device access
4. **Visual Indicator**: Show notification when cart is restored
5. **Cart Recovery**: Allow users to manually recover abandoned carts

## Troubleshooting

### Cart Not Restoring After Login

**Possible Causes**:
1. localStorage was cleared by browser/user
2. User logged in from different tab/window before returning
3. Data corruption in localStorage

**Solution**: User can rebuild cart manually (data is lost)

### Payment Modal Not Opening

**Possible Causes**:
1. Authentication state not updated yet (race condition)
2. localStorage data incomplete

**Solution**: User can click "Proceed to Payment" again

### State Partially Restored

**Possible Causes**:
1. New cart state structure added but restoration code not updated
2. Data corruption during save

**Solution**: Update `useEffect` hook to handle missing fields gracefully
