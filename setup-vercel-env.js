console.log('🚀 Setting up Vercel Environment Variables...\n');

const envVars = {
  'VITE_SUPABASE_URL': 'https://eceojrvqdsfjakprojgy.supabase.co',
  'VITE_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU'
};

console.log('📋 Environment Variables to add to Vercel:');
console.log('==========================================');

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('\n📝 Instructions:');
console.log('1. Go to https://vercel.com/dashboard');
console.log('2. Find your growth app project');
console.log('3. Go to Settings > Environment Variables');
console.log('4. Add each variable above');
console.log('5. Set Environment to "Production, Preview, Development"');
console.log('6. Save and redeploy');

console.log('\n🔧 Alternative: Use Vercel CLI');
console.log('If you have Vercel CLI installed, run these commands:');

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`vercel env add ${key} production`);
  console.log(`vercel env add ${key} preview`);
  console.log(`vercel env add ${key} development`);
});

console.log('\n✅ After adding the environment variables, your app should work!'); 