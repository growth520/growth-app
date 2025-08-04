import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';

const AuthCallbackPage = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback started');
        
        // Check if URL contains code= (OAuth code flow)
        if (window.location.href.includes('code=')) {
          console.log('Detected OAuth code, exchanging for session');
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          
          if (error) {
            console.error('Code exchange error:', error);
            navigate('/login?error=auth_failed');
            return;
          }
          
          console.log('Session established via code exchange');
          navigate('/');
          return;
        }
        
        // Check if URL contains access_token= (hash fragment flow)
        if (window.location.href.includes('access_token=')) {
          console.log('Detected access token in hash, parsing and setting session');
          
          // Parse hash fragment
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (!accessToken || !refreshToken) {
            console.error('Missing tokens in hash');
            navigate('/login?error=auth_failed');
            return;
          }
          
          // Set session manually
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Session setting error:', error);
            navigate('/login?error=auth_failed');
            return;
          }
          
          console.log('Session established via hash tokens');
          navigate('/');
          return;
        }
        
        // No valid auth parameters found
        console.log('No valid auth parameters found');
        navigate('/login?error=auth_failed');
        
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login?error=auth_failed');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sun-beige">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-green mx-auto"></div>
          <p className="text-charcoal-gray">Signing you in...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallbackPage; 