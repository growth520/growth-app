import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const BackchatWidget = () => {
  const location = useLocation();
  const [widgetFailed, setWidgetFailed] = useState(false);
  
  // Define pages where the backchat widget should appear
  const allowedPages = ['/challenge', '/progress', '/community', '/leaderboard'];
  
  // Check if current page is in the allowed list
  const shouldShowWidget = allowedPages.includes(location.pathname);

  useEffect(() => {
    if (widgetFailed || !shouldShowWidget) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 10; // Maximum 10 attempts (5 seconds total)
    let timeoutId;

    // Wait for the widget to be available with timeout
    const checkAndToggleWidget = () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        console.warn('Backchat widget failed to load after multiple attempts');
        setWidgetFailed(true);
        return;
      }

      if (window.backchatWidget && typeof window.backchatWidget === 'function') {
        try {
          if (shouldShowWidget) {
            window.backchatWidget("show");
          } else {
            window.backchatWidget("hide");
          }
          return; // Success, stop trying
        } catch (error) {
          console.warn('Error controlling backchat widget:', error);
          // Continue trying
        }
      }
      
      // Widget not ready, try again in 500ms
      timeoutId = setTimeout(checkAndToggleWidget, 500);
    };

    // Start checking after a short delay
    timeoutId = setTimeout(checkAndToggleWidget, 1000);

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [shouldShowWidget, location.pathname, widgetFailed]);

  // This component doesn't render anything visible
  return null;
};

export default BackchatWidget; 