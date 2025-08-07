// Test Email Configuration
// Run this in your browser console to test email setup

import { supabase } from './src/lib/customSupabaseClient.js';

async function testEmailConfig() {
  console.log('Testing email configuration...');
  
  try {
    // Test password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail('test@example.com', {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) {
      console.error('Email test failed:', error);
      console.log('Error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
    } else {
      console.log('Email test successful:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the test
testEmailConfig(); 