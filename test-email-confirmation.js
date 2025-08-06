// Test script to check email confirmation for password updates
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual URL
const supabaseAnonKey = 'your-anon-key'; // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Testing Email Confirmation for Password Updates...');

// Test 1: Check if user is authenticated
async function testUserAuth() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.log('❌ User not authenticated:', error.message);
      return null;
    }
    console.log('✅ User authenticated:', user.email);
    return user;
  } catch (error) {
    console.log('❌ Error getting user:', error.message);
    return null;
  }
}

// Test 2: Check current auth method
async function checkAuthMethod(user) {
  try {
    console.log('🔍 Checking user auth method...');
    console.log('User provider:', user.app_metadata?.provider);
    console.log('Has password:', user.app_metadata?.has_password);
    console.log('Email confirmed:', user.email_confirmed_at);
    
    return {
      isOAuth: user.app_metadata?.provider && ['google', 'apple'].includes(user.app_metadata.provider),
      hasPassword: user.app_metadata?.has_password || false,
      emailConfirmed: !!user.email_confirmed_at
    };
  } catch (error) {
    console.log('❌ Error checking auth method:', error.message);
    return null;
  }
}

// Test 3: Test password update with email confirmation
async function testPasswordUpdate(user) {
  try {
    console.log('🔍 Testing password update...');
    
    // Method 1: Using updateUser (current implementation)
    console.log('Testing Method 1: updateUser()');
    const { data, error } = await supabase.auth.updateUser({
      password: 'testpassword123'
    });
    
    if (error) {
      console.log('❌ updateUser error:', error.message);
    } else {
      console.log('✅ updateUser success:', data);
    }
    
    // Method 2: Using resetPasswordForEmail (alternative approach)
    console.log('Testing Method 2: resetPasswordForEmail()');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback`
    });
    
    if (resetError) {
      console.log('❌ resetPasswordForEmail error:', resetError.message);
    } else {
      console.log('✅ resetPasswordForEmail success - check email');
    }
    
  } catch (error) {
    console.log('❌ Error testing password update:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting email confirmation tests...\n');
  
  const user = await testUserAuth();
  if (!user) {
    console.log('❌ Cannot proceed without authenticated user');
    return;
  }
  
  const authInfo = await checkAuthMethod(user);
  if (authInfo) {
    console.log('📊 Auth Info:', authInfo);
  }
  
  await testPasswordUpdate(user);
  
  console.log('\n📋 Email Confirmation Troubleshooting:');
  console.log('1. Check Supabase Dashboard > Authentication > Email Templates');
  console.log('2. Verify Site URL is set correctly in Supabase settings');
  console.log('3. Check if email provider is configured (SendGrid, etc.)');
  console.log('4. Look for emails in spam/junk folder');
  console.log('5. Check Supabase logs for email delivery status');
}

// Run the tests
runTests().catch(console.error); 