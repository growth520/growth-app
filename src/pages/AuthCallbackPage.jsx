import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthCallbackPage = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback started');
        
        // Wait a moment for auth state to be properly set
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Get session error:', error);
          throw error;
        }

        console.log('Session found:', !!session?.user);

        if (session?.user) {
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
          console.log('No session found, redirecting to login');
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
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
      toast({
        title: "Authentication Timeout",
        description: "Please try signing in again.",
        variant: "destructive"
      });
      navigate('/login');
    }, 15000); // 15 second timeout

    handleAuthCallback();

    return () => clearTimeout(timeoutId);
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sun-beige">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-green mx-auto"></div>
          <p className="text-charcoal-gray">Completing sign-in...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallbackPage; 