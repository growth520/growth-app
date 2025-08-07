// Test Reset Link Format
// Run this in your browser console to see what URL format Supabase uses

console.log('=== RESET LINK DEBUG ===');
console.log('Current URL:', window.location.href);
console.log('Search params:', window.location.search);
console.log('Hash:', window.location.hash);

// Parse all URL parameters
const urlParams = new URLSearchParams(window.location.search);
const hashParams = new URLSearchParams(window.location.hash.substring(1));

console.log('Search parameters:');
for (const [key, value] of urlParams.entries()) {
  console.log(`${key}: ${value.substring(0, 50)}...`);
}

console.log('Hash parameters:');
for (const [key, value] of hashParams.entries()) {
  console.log(`${key}: ${value.substring(0, 50)}...`);
}

// Check if we're on the reset password page
if (window.location.pathname === '/reset-password') {
  console.log('✅ On reset password page');
} else {
  console.log('❌ Not on reset password page, current path:', window.location.pathname);
} 