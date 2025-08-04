// Refresh Progress UI Script
// Run this in your browser console to refresh the progress data

// Method 1: Refresh the page (simplest)
console.log('Refreshing page to update level display...');
window.location.reload();

// Method 2: If you want to refresh without page reload (if DataContext is available)
// Uncomment the lines below if Method 1 doesn't work:

/*
// Check if DataContext is available
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('React DevTools detected - trying to refresh progress data...');
  
  // Try to trigger a progress refresh
  const event = new CustomEvent('refreshProgress');
  window.dispatchEvent(event);
  
  console.log('Progress refresh event dispatched');
} else {
  console.log('React DevTools not detected - please refresh the page manually');
}
*/

// Method 3: Manual database check
console.log('To verify your new level, you can also:');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Navigate to Table Editor');
console.log('3. Select the "user_progress" table');
console.log('4. Check your user record - the level should now be updated');
console.log('5. Refresh your app page to see the changes'); 