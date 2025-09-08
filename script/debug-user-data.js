// Simple script to debug user data and JWT token
const jwt = require('jsonwebtoken');

// Use the same JWT_SECRET as in the app
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

function debugToken() {
  // You would need to get the actual token from localStorage or cookies
  // This is just an example of how to decode it
  console.log('To debug user data:');
  console.log('1. Open your browser dev tools');
  console.log('2. Go to Application/Storage tab');
  console.log('3. Look for auth-token in Local Storage or Cookies');
  console.log('4. Copy the token value');
  console.log('5. Paste it below to decode:');
  
  // Example of how to decode a token (you would replace 'YOUR_TOKEN_HERE' with actual token)
  console.log('\nExample token decoding:');
  console.log('(Replace YOUR_TOKEN_HERE with actual token)');
  
  try {
    // Example token decoding - replace with actual token
    const token = 'YOUR_TOKEN_HERE';
    if (token !== 'YOUR_TOKEN_HERE') {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Decoded token:', JSON.stringify(decoded, null, 2));
    }
  } catch (error) {
    console.log('Error decoding token:', error.message);
  }
}

debugToken();