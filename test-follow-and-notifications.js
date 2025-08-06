import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFollowAndNotifications() {
  console.log('Testing follow functionality and notifications...');
  
  try {
    // Test 1: Check if follows table is working
    console.log('\n1. Testing follows table...');
    const { data: followsData, error: followsError } = await supabase
      .from('follows')
      .select('*')
      .limit(5);
    
    console.log('Follows table query:', { 
      data: followsData, 
      error: followsError,
      count: followsData?.length || 0
    });
    
    // Test 2: Check if notifications table exists
    console.log('\n2. Testing notifications table...');
    const { data: notificationsData, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(5);
    
    console.log('Notifications table query:', { 
      data: notificationsData, 
      error: notificationsError,
      count: notificationsData?.length || 0
    });
    
    // Test 3: Check recent follow notifications
    console.log('\n3. Checking recent follow notifications...');
    const { data: followNotifications, error: followNotificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'follow')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('Recent follow notifications:', { 
      data: followNotifications, 
      error: followNotificationsError,
      count: followNotifications?.length || 0
    });
    
    // Test 4: Check if we can query notifications with the function
    console.log('\n4. Testing get_user_notifications function...');
    const { data: userNotifications, error: userNotificationsError } = await supabase
      .rpc('get_user_notifications', { p_user_id: '00000000-0000-0000-0000-000000000000' });
    
    console.log('User notifications function:', { 
      data: userNotifications, 
      error: userNotificationsError,
      count: userNotifications?.length || 0
    });
    
    // Test 5: Check table structures
    console.log('\n5. Checking table structures...');
    const { data: followsStructure, error: followsStructureError } = await supabase
      .from('follows')
      .select('*')
      .limit(0);
    
    const { data: notificationsStructure, error: notificationsStructureError } = await supabase
      .from('notifications')
      .select('*')
      .limit(0);
    
    console.log('Follows table structure:', { 
      columns: followsStructure ? Object.keys(followsStructure[0] || {}) : [],
      error: followsStructureError 
    });
    
    console.log('Notifications table structure:', { 
      columns: notificationsStructure ? Object.keys(notificationsStructure[0] || {}) : [],
      error: notificationsStructureError 
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFollowAndNotifications(); 