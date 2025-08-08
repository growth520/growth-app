// Test script to check storage upload functionality
// Run this in the browser console on your app

import { supabase } from '@/lib/customSupabaseClient';

// Test storage upload
async function testStorageUpload() {
  console.log('=== TESTING STORAGE UPLOAD ===');
  
  try {
    // Create a simple test file
    const testContent = 'This is a test file';
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    console.log('Test file created:', testFile);
    
    // Try to upload to storage
    const { data, error } = await supabase.storage
      .from('photos')
      .upload('test/test.txt', testFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    console.log('Upload result:', { data, error });
    
    if (error) {
      console.error('Upload failed:', error);
      return false;
    }
    
    // Try to get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl('test/test.txt');
    
    console.log('Public URL:', publicUrl);
    
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

// Run the test
testStorageUpload().then(success => {
  console.log('Storage test result:', success ? 'PASSED' : 'FAILED');
}); 