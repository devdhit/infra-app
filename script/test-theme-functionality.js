// Test script to verify theme functionality
// This script can be run in the browser console to test theme switching

console.log('Testing theme functionality...');

// Test 1: Check if ThemeProvider is properly configured
const htmlElement = document.documentElement;
console.log('HTML element has theme attribute:', htmlElement.hasAttribute('class'));

// Test 2: Check if theme can be changed
const initialTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light';
console.log('Initial theme:', initialTheme);

// Toggle theme
if (initialTheme === 'dark') {
  htmlElement.classList.remove('dark');
  console.log('Switched to light theme');
} else {
  htmlElement.classList.add('dark');
  console.log('Switched to dark theme');
}

// Wait a bit and check if the change persisted
setTimeout(() => {
  const newTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light';
  console.log('New theme:', newTheme);
  
  // Revert to initial theme
  if (initialTheme === 'dark') {
    htmlElement.classList.add('dark');
  } else {
    htmlElement.classList.remove('dark');
  }
  
  console.log('Theme test completed. Reverted to initial theme.');
}, 1000);

// Test 3: Check if CSS variables are properly defined
const computedStyle = getComputedStyle(document.body);
const backgroundColor = computedStyle.getPropertyValue('--background');
const foregroundColor = computedStyle.getPropertyValue('--foreground');

console.log('Background color variable:', backgroundColor);
console.log('Foreground color variable:', foregroundColor);

if (backgroundColor && foregroundColor) {
  console.log('✓ CSS variables are properly defined');
} else {
  console.log('✗ CSS variables are missing');
}

console.log('Theme functionality test completed.');