import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthCallbackPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback started');
        
        // Check for URL parameters that might indicate OAuth completion
        const urlParams = new URLSearchParams(window.location.search);
        const hasCode = urlParams.get('code');
        const hasError = urlParams.get('error');
        
        // Check for hash fragment tokens (common on mobile)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasAccessToken = hashParams.get('access_token');
        const hasRefreshToken = hashParams.get('refresh_token');
        
        console.log('URL params:', { hasCode, hasError });
        console.log('Hash params:', { hasAccessToken: !!hasAccessToken, hasRefreshToken: !!hasRefreshToken });
        
        if (hasError) {
          console.error('OAuth error in URL:', hasError);
          throw new Error(`OAuth error: ${hasError}`);
        }
        
        // If we have tokens in hash, set them manually
        if (hasAccessToken && hasRefreshToken) {
          console.log('Found tokens in hash, setting session manually');
          
          // Decode the JWT access token to get user info
          let userInfo = {
            id: 'unknown',
            email: 'unknown@example.com',
            user_metadata: {
              full_name: 'User'
            }
          };
          
          try {
            // Decode JWT token (base64 decode the payload part)
            const tokenParts = hasAccessToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('Decoded JWT payload:', payload);
              
              userInfo = {
                id: payload.sub || 'unknown',
                email: payload.email || 'unknown@example.com',
                user_metadata: {
                  full_name: payload.user_metadata?.full_name || payload.name || 'User',
                  avatar_url: payload.user_metadata?.avatar_url,
                  picture: payload.user_metadata?.picture
                }
              };
            }
          } catch (decodeError) {
            console.error('Error decoding JWT token:', decodeError);
          }
          
          const session = {
            access_token: hasAccessToken,
            refresh_token: hasRefreshToken,
            expires_at: parseInt(hashParams.get('expires_at') || '0'),
            token_type: hashParams.get('token_type') || 'bearer',
            user: userInfo
          };
          
          // Set the session manually
          const { error: setSessionError } = await supabase.auth.setSession(session);
          
          if (setSessionError) {
            console.error('Error setting session:', setSessionError);
            throw setSessionError;
          }
          
          console.log('Session set manually from hash tokens');
        }
        
        // For mobile, try to get session immediately, then retry after a short delay
        let session = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
          console.log(`Attempt ${attempts + 1} to get session`);
          
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Get session error:', sessionError);
            throw sessionError;
          }
          
          if (currentSession?.user) {
            session = currentSession;
            console.log('Session found on attempt', attempts + 1);
            break;
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            console.log('No session yet, waiting...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          }
        }

        if (session?.user) {
          console.log('Session found:', session.user.email);
          
          // Persist session to localStorage for mobile compatibility
          localStorage.setItem('supabase.auth.token', JSON.stringify(session));
          
          // Check if profile already exists and preserve assessment status
          const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('has_completed_assessment')
            .eq('id', session.user.id)
            .single();

          if (checkError && checkError.code === 'PGRST116') {
            // Profile doesn't exist, create new one
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || 'User',
                has_completed_assessment: false
              });
            
            if (profileError) {
              console.error('Profile creation error:', profileError);
            }
          } else if (existingProfile) {
            console.log('Profile already exists, preserving assessment status:', existingProfile.has_completed_assessment);
            // Update name if needed but preserve assessment status
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                full_name: session.user.user_metadata?.full_name || 'User'
              })
              .eq('id', session.user.id);
            
            if (updateError) {
              console.error('Profile update error:', updateError);
            }
          }

          toast({
            title: "Welcome! 🎉",
            description: "You've been successfully signed in to Growth!"
          });

          // Redirect to progress page for all users (OAuth flow)
          navigate('/progress', { replace: true });
        } else {
          console.log('No session found after all attempts, redirecting to login');
          setError('No session found');
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setError(error.message);
        toast({
          title: "Authentication Error",
          description: "There was an issue with your sign-in. Please try again.",
          variant: "destructive"
        });
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Auth callback timeout, redirecting to login');
      setError('Authentication timeout');
      toast({
        title: "Authentication Timeout",
        description: "Please try signing in again.",
        variant: "destructive"
      });
      navigate('/login');
    }, 10000); // 10 second timeout (reduced from 15)

    handleAuthCallback();

    return () => clearTimeout(timeoutId);
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sun-beige">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-green mx-auto"></div>
          <p className="text-charcoal-gray">Completing sign-in...</p>
          {error && (
            <p className="text-red-500 text-sm">Error: {error}</p>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallbackPage; 