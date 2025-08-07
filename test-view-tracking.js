// Test script to verify view tracking RPC function
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testViewTracking() {
  console.log('🧪 Testing view tracking RPC function...');
  
  try {
    // First, let's check if the function exists by looking at the posts table
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, views_count')
      .limit(1);
    
    if (postsError) {
      console.error('❌ Error fetching posts:', postsError);
      return;
    }
    
    if (!posts || posts.length === 0) {
      console.log('❌ No posts found in database');
      return;
    }
    
    const testPostId = posts[0].id;
    console.log('📝 Testing with post ID:', testPostId);
    console.log('📊 Current views count:', posts[0].views_count);
    
    // Test if the function exists
    const { data, error } = await supabase
      .rpc('increment_post_view', {
        post_id: testPostId,
        viewer_id: '00000000-0000-0000-0000-000000000000' // Test viewer ID
      });
    
    if (error) {
      console.error('❌ RPC function error:', error);
      console.log('💡 This might mean the database migration needs to be applied');
    } else {
      console.log('✅ RPC function exists and executed successfully');
      
      // Check if the view count was updated
      const { data: updatedPost, error: checkError } = await supabase
        .from('posts')
        .select('views_count')
        .eq('id', testPostId)
        .single();
      
      if (checkError) {
        console.error('❌ Error checking updated post:', checkError);
      } else {
        console.log('📊 Updated views count:', updatedPost.views_count);
        if (updatedPost.views_count > posts[0].views_count) {
          console.log('✅ View count was successfully incremented!');
        } else {
          console.log('⚠️ View count was not incremented (might be due to same user check)');
        }
      }
    }
  } catch (error) {
    console.error('❌ Exception testing RPC function:', error);
  }
}

testViewTracking(); 