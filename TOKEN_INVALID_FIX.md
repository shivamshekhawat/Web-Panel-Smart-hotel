# Token Invalid Error Fix

## Problem
When a new admin logs in with OTP and tries to create a hotel, they get a "token invalid" error in the console.

## Root Cause
The issue occurs because:
1. The 2FA login system (`admin2faApi`) uses `/api/v1/admin/auth/` endpoints
2. The hotel creation system (`adminApi`) uses `/api/hotels/signup` endpoint
3. These systems might expect different token formats or have different authentication requirements

## Solution Applied

### 1. Enhanced Token Logging
- Added detailed logging in `getAuthToken()` to track token retrieval
- Added logging in `buildHeaders()` to show token usage
- Added logging in `createHotel()` to track the entire flow

### 2. Token Validation
- Added `validateToken()` method to check if current token is valid before hotel creation
- Added pre-validation in Hotels component before attempting hotel creation

### 3. Better Error Handling
- Enhanced error handling in `createHotel()` with specific 401 handling
- Added automatic redirect to login on token expiration
- Improved error messages for better user experience

### 4. Debugging Steps
To debug the token issue:

1. **Check Console Logs**: Look for these log messages:
   - `🔐 No auth token found in localStorage`
   - `🔐 Auth token found: [token preview]`
   - `🏨 Validating token before hotel creation...`
   - `🏨 Token is valid, proceeding with hotel creation...`
   - `🏨 Create hotel response status: [status]`

2. **Verify Token Storage**: Check if token is properly stored after OTP verification:
   ```javascript
   console.log('Stored token:', localStorage.getItem('auth_token'));
   ```

3. **Check API Endpoints**: Verify that both systems use the same base URL and compatible endpoints

## Next Steps if Issue Persists

If the token invalid error still occurs:

1. **Check Backend Logs**: Verify what the backend receives and why it rejects the token
2. **Token Format**: Compare token format between 2FA system and hotel creation system
3. **API Compatibility**: Ensure both endpoints accept the same token format
4. **Token Expiration**: Check if token expires too quickly after OTP verification

## Testing
1. Login with OTP
2. Check console for token validation logs
3. Try creating a hotel
4. Monitor console for detailed error information