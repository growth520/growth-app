// Test Token System After Pack Completion
// Run this in browser console to check token balance

console.log('🔍 Testing Token System...');

// Check current token balance
const checkTokenBalance = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No user logged in');
      return;
    }

    // Check user_tokens table
    const { data: tokensData, error: tokensError } = await supabase
      .from('user_tokens')
      .select('balance, total_earned, total_spent')
      .eq('user_id', user.id)
      .eq('token_type', 'streak_freeze')
      .single();

    if (tokensError) {
      console.log('❌ Error fetching tokens:', tokensError.message);
      return;
    }

    console.log('✅ Token Balance:', tokensData?.balance || 0);
    console.log('✅ Total Earned:', tokensData?.total_earned || 0);
    console.log('✅ Total Spent:', tokensData?.total_spent || 0);

    // Check user_progress table
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('xp, level, tokens')
      .eq('user_id', user.id)
      .single();

    if (progressError) {
      console.log('❌ Error fetching progress:', progressError.message);
      return;
    }

    console.log('✅ Current XP:', progressData?.xp || 0);
    console.log('✅ Current Level:', progressData?.level || 1);
    console.log('✅ Progress Tokens:', progressData?.tokens || 0);

    // Check recent token transactions
    const { data: transactions, error: transError } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('token_type', 'streak_freeze')
      .order('created_at', { ascending: false })
      .limit(5);

    if (transError) {
      console.log('❌ Error fetching transactions:', transError.message);
      return;
    }

    console.log('✅ Recent Token Transactions:');
    transactions?.forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.amount > 0 ? '+' : ''}${tx.amount} tokens - ${tx.description} (${new Date(tx.created_at).toLocaleString()})`);
    });

  } catch (error) {
    console.error('❌ Error in token check:', error);
  }
};

// Check if tables exist
const checkTablesExist = async () => {
  console.log('🔍 Checking if token tables exist...');
  
  try {
    // Check user_tokens table
    const { data: tokensTest, error: tokensError } = await supabase
      .from('user_tokens')
      .select('count')
      .limit(1);
    
    console.log('✅ user_tokens table exists');
  } catch (error) {
    console.log('❌ user_tokens table does not exist or is not accessible');
  }

  try {
    // Check token_transactions table
    const { data: transTest, error: transError } = await supabase
      .from('token_transactions')
      .select('count')
      .limit(1);
    
    console.log('✅ token_transactions table exists');
  } catch (error) {
    console.log('❌ token_transactions table does not exist or is not accessible');
  }
};

// Run the tests
console.log('=== Token System Test ===');
checkTablesExist().then(() => {
  setTimeout(checkTokenBalance, 1000);
});

console.log('\n📋 Expected Results:');
console.log('- If you just completed a pack: +2 tokens should appear in transactions');
console.log('- Token balance should be updated');
console.log('- Progress page should show updated token count');
console.log('- XP should be increased by (challenges × 20)');
console.log('- Level should be recalculated with quadratic formula'); 