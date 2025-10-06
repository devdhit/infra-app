function validatePassword(password) {
  if (password.length < 12) {
    return { isValid: false, message: 'Password must be at least 12 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  // Check for common password patterns
  const commonPatterns = [
    /password/i,
    /123456/i,
    /qwerty/i,
    /abc123/i
  ];
  
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      return { isValid: false, message: 'Password contains common weak patterns' };
    }
  }
  
  return { isValid: true, message: 'Password is valid' };
}

console.log('Testing password: SecurePass123!');
console.log(JSON.stringify(validatePassword('SecurePass123!')));