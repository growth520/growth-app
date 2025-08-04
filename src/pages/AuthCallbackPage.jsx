import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const url = window.location.href;

        // Case 1: PKCE OAuth flow
        if (url.includes('code=')) {
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) throw error;
        }
        // Case 2: Implicit OAuth flow (hash fragment)
        else if (url.includes('access_token=')) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token
            });
            if (error) throw error;
          } else {
            throw new Error('Missing tokens in callback URL');
          }
        } else {
          throw new Error('Invalid callback URL format');
        }

        // ✅ Redirect to home or dashboard
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Auth callback failed:', err.message);
        navigate('/login?error=auth_failed', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Signing you in...</div>;
} 