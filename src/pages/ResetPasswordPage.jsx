import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');

    useEffect(() => {
    // Handle password reset flow
    const handlePasswordReset = async () => {
      try {
        console.log('Reset password page loaded');
        console.log('Current URL:', window.location.href);
        setDebugInfo('Starting authentication check...');
        
        // Check if we have a recovery token in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Look for various token formats
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const recoveryToken = urlParams.get('recovery_token') || hashParams.get('recovery_token');
        const token = urlParams.get('token') || hashParams.get('token');
        
        console.log('Found tokens:', {
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          recoveryToken: !!recoveryToken,
          token: !!token,
          fullUrl: window.location.href
        });

        setDebugInfo(`Found tokens: access=${!!accessToken}, refresh=${!!refreshToken}, recovery=${!!recoveryToken}, generic=${!!token}`);

        // If we have any token, try to set up the session
        if (accessToken && refreshToken) {
          console.log('Setting session with access and refresh tokens');
          setDebugInfo('Setting session with access and refresh tokens...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Error setting session:', error);
            setDebugInfo(`Session error: ${error.message}`);
          } else {
            console.log('Session set successfully');
            setDebugInfo('Session set successfully');
          }
        } else if (recoveryToken) {
          console.log('Found recovery token, attempting to recover session');
          setDebugInfo('Recovering session with recovery token...');
          // Try to recover the session with the recovery token
          const { data, error } = await supabase.auth.recoverSession(recoveryToken);
          
          if (error) {
            console.error('Error recovering session:', error);
            setDebugInfo(`Recovery error: ${error.message}`);
          } else {
            console.log('Session recovered successfully');
            setDebugInfo('Session recovered successfully');
          }
        } else if (token) {
          console.log('Found generic token, attempting to use it');
          setDebugInfo('Trying generic token...');
          // This might be a recovery token in a different format
          try {
            const { data, error } = await supabase.auth.recoverSession(token);
            if (error) {
              console.error('Error with generic token:', error);
              setDebugInfo(`Generic token error: ${error.message}`);
            } else {
              console.log('Session recovered with generic token');
              setDebugInfo('Session recovered with generic token');
            }
          } catch (err) {
            console.error('Error processing generic token:', err);
            setDebugInfo(`Generic token exception: ${err.message}`);
          }
        } else {
          console.log('No tokens found in URL');
          setDebugInfo('No tokens found in URL, checking existing session...');
          // Check if user is already authenticated
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('No user found, redirecting to forgot password');
            setDebugInfo('No user found, redirecting...');
            toast({
              title: "Invalid Reset Link",
              description: "This reset link is invalid or has expired. Please request a new one.",
              variant: "destructive"
            });
            navigate('/forgot-password');
            return;
          } else {
            console.log('User already authenticated:', user.email);
            setDebugInfo(`User already authenticated: ${user.email}`);
          }
        }

        // Final check - are we authenticated now?
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Final user check:', !!user);
        setDebugInfo(`Final user check: ${!!user}`);
        
        if (!user) {
          console.log('Still no user, redirecting to forgot password');
          setDebugInfo('Still no user, redirecting...');
          toast({
            title: "Invalid Reset Link",
            description: "This reset link is invalid or has expired. Please request a new one.",
            variant: "destructive"
          });
          navigate('/forgot-password');
        } else {
          console.log('User authenticated successfully:', user.email);
          setDebugInfo(`User authenticated successfully: ${user.email}`);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error in password reset flow:', error);
        setDebugInfo(`Error: ${error.message}`);
        toast({
          title: "Error",
          description: "An error occurred while processing your reset link. Please try again.",
          variant: "destructive"
        });
        navigate('/forgot-password');
      } finally {
        setIsLoading(false);
        setDebugInfo(prev => prev + ' (Loading finished)');
      }
    };

    handlePasswordReset();
    
    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('Authentication timeout - forcing completion');
        setDebugInfo('Authentication timeout - forcing completion');
        setIsLoading(false);
        setIsAuthenticated(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [navigate, toast, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter a new password.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // First, check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error('Authentication error. Please try the reset link again.');
      }

      if (!user) {
        console.error('No user found when trying to update password');
        throw new Error('You are not authenticated. Please use the reset link from your email.');
      }

      console.log('User authenticated, updating password for:', user.email);

      // Update the password
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Error updating password:', error);
        throw error;
      }

      console.log('Password updated successfully');

      setPasswordReset(true);
      toast({
        title: "Password Reset Successfully",
        description: "Your password has been updated. You can now sign in with your new password.",
      });
      
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Full-screen background with gradient overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/welcome-bg.jpg')`,
          }}
        >
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header & Tagline */}
          <div className="text-center pt-8 pb-6 px-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img 
                src="https://storage.googleapis.com/hostinger-horizons-assets-prod/3576ad99-fbe5-4d76-95b8-b9445d3273c9/f248d90957aab1199c7db78e9c6d6c49.png" 
                alt="Growth App Logo" 
                className="h-10 w-10"
              />
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                Growth
              </h1>
            </div>
            <p className="text-lg md:text-xl font-bold text-white drop-shadow-lg max-w-3xl mx-auto leading-relaxed">
              This is more than an app. It's a journey towards the best version of you!
            </p>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center px-4 pb-8">
            <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="text-center py-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600 mb-4">Verifying your reset link...</p>
                {debugInfo && (
                  <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600 text-left">
                    <p className="font-semibold mb-1">Debug Info:</p>
                    <p className="break-all">{debugInfo}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show success state after password reset
  if (passwordReset) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Full-screen background with gradient overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/welcome-bg.jpg')`,
          }}
        >
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header & Tagline */}
          <div className="text-center pt-8 pb-6 px-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img 
                src="https://storage.googleapis.com/hostinger-horizons-assets-prod/3576ad99-fbe5-4d76-95b8-b9445d3273c9/f248d90957aab1199c7db78e9c6d6c49.png" 
                alt="Growth App Logo" 
                className="h-10 w-10"
              />
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                Growth
              </h1>
            </div>
            <p className="text-lg md:text-xl font-bold text-white drop-shadow-lg max-w-3xl mx-auto leading-relaxed">
              This is more than an app. It's a journey towards the best version of you!
            </p>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center px-4 pb-8">
            <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Password Reset Successfully
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Your password has been updated. You can now sign in with your new password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleBackToLogin}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300"
                >
                  Sign In with New Password
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show form only if authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Full-screen background with gradient overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/welcome-bg.jpg')`,
          }}
        >
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header & Tagline */}
          <div className="text-center pt-8 pb-6 px-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img 
                src="https://storage.googleapis.com/hostinger-horizons-assets-prod/3576ad99-fbe5-4d76-95b8-b9445d3273c9/f248d90957aab1199c7db78e9c6d6c49.png" 
                alt="Growth App Logo" 
                className="h-10 w-10"
              />
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                Growth
              </h1>
            </div>
            <p className="text-lg md:text-xl font-bold text-white drop-shadow-lg max-w-3xl mx-auto leading-relaxed">
              This is more than an app. It's a journey towards the best version of you!
            </p>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center px-4 pb-8">
            <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="text-center py-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <Lock className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                  Invalid Reset Link
                </CardTitle>
                <CardDescription className="text-gray-600 mb-4">
                  This reset link is invalid or has expired. Please request a new one.
                </CardDescription>
                <Button 
                  onClick={() => navigate('/forgot-password')}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300"
                >
                  Request New Reset Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show the password reset form
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full-screen background with gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/welcome-bg.jpg')`,
        }}
      >
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header & Tagline */}
        <div className="text-center pt-8 pb-6 px-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="https://storage.googleapis.com/hostinger-horizons-assets-prod/3576ad99-fbe5-4d76-95b8-b9445d3273c9/f248d90957aab1199c7db78e9c6d6c49.png" 
              alt="Growth App Logo" 
              className="h-10 w-10"
            />
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
              Growth
            </h1>
          </div>
          <p className="text-lg md:text-xl font-bold text-white drop-shadow-lg max-w-3xl mx-auto leading-relaxed">
            This is more than an app. It's a journey towards the best version of you!
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Reset Your Password
              </CardTitle>
              <CardDescription className="text-gray-600">
                Enter your new password below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your new password"
                      required
                      className="w-full h-12 bg-white/80 border-gray-200 text-gray-800 placeholder:text-gray-500 rounded-lg pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      required
                      className="w-full h-12 bg-white/80 border-gray-200 text-gray-800 placeholder:text-gray-500 rounded-lg pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Updating...
                    </div>
                  ) : (
                    'Update Password'
                  )}
                </Button>
                
                <Button 
                  type="button"
                  onClick={handleBackToLogin}
                  variant="ghost" 
                  className="w-full text-gray-600 hover:text-orange-400"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 