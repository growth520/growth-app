// Test script to verify view tracking RPC function
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testViewTracking() {
  console.log('🧪 Testing view tracking RPC function...');
  
  try {
    // Test if the function exists
    const { data, error } = await supabase
      .rpc('increment_post_view', {
        post_id: 'test-post-id',
        viewer_id: 'test-viewer-id'
      });
    
    if (error) {
      console.error('❌ RPC function error:', error);
      console.log('💡 This might mean the database migration needs to be applied');
    } else {
      console.log('✅ RPC function exists and executed successfully');
    }
  } catch (error) {
    console.error('❌ Exception testing RPC function:', error);
  }
}

testViewTracking(); 