// Test script to verify the RPC function exists and works
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRPCFunction() {
  console.log('🧪 Testing RPC function...');
  
  try {
    // First, let's check if the function exists by looking at the posts table
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, views_count, user_id')
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
    const testViewerId = '00000000-0000-0000-0000-000000000000'; // Test viewer ID
    console.log('📝 Testing with post ID:', testPostId);
    console.log('📊 Current views count:', posts[0].views_count);
    console.log('👤 Post author ID:', posts[0].user_id);
    
    // Test if the function exists and works
    const { data, error } = await supabase
      .rpc('increment_post_view', {
        post_id: testPostId,
        viewer_id: testViewerId,
        view_type: 'test'
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
      
      // Check if entry was added to post_views table
      const { data: postViews, error: postViewsError } = await supabase
        .from('post_views')
        .select('*')
        .eq('post_id', testPostId)
        .order('viewed_at', { ascending: false })
        .limit(1);
      
      if (postViewsError) {
        console.error('❌ Error checking post_views table:', postViewsError);
      } else {
        console.log('📊 post_views entries:', postViews);
        if (postViews && postViews.length > 0) {
          console.log('✅ Entry was added to post_views table!');
        } else {
          console.log('⚠️ No entry was added to post_views table');
        }
      }
    }
  } catch (error) {
    console.error('❌ Exception testing RPC function:', error);
  }
}

testRPCFunction(); 