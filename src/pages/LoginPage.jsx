import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Apple, Chrome, Target, Users, Trophy, TrendingUp, Heart, Zap } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { getAuthCallbackUrl, getBaseUrl } from '@/lib/config';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getBaseUrl()}/challenge`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error('Google login error:', error);
        toast({
          title: "Sign in Failed",
          description: error.message || "Could not sign in with Google. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Unexpected Google login error:', error);
      toast({
        title: "Sign in Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  // Function to create profile for confirmed users
  const createProfileForUser = async (userId, fullName) => {
    try {
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('has_completed_assessment')
        .eq('id', userId)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // Profile doesn't exist, create new one
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: fullName,
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
            full_name: fullName
          })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Profile update error:', updateError);
        }
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${getBaseUrl()}/challenge`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error('Apple login error:', error);
        toast({
          title: "Sign in Failed",
          description: error.message || "Could not sign in with Apple. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Unexpected Apple login error:', error);
      toast({
        title: "Sign in Failed",
        description: "Could not sign in with Apple. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!error) {
          toast({ title: "Welcome back! 🎉" });
          navigate('/challenge');
        } else {
          toast({
            title: "Sign in Failed",
            description: error.message || "Could not sign in. Please check your credentials.",
            variant: "destructive"
          });
        }
      } else {
        const { data, error } = await supabase.auth.signUp(
          { email, password },
          { 
            data: { full_name: fullName },
            emailRedirectTo: getAuthCallbackUrl()
          }
        );
        
        if (!error && data.user) {
          // Wait a moment for the user to be fully created in auth.users
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Create profile immediately after successful signup
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: fullName,
              has_completed_assessment: false
            });
          
          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Don't fail the signup if profile creation fails
          }
          
          // Let the existing trigger handle user_progress creation
          // (if it exists) - if not, it will be created when needed
          
          toast({ 
            title: "Account created! 🚀", 
            description: "Please check your email to verify your account." 
          });
        } else {
          toast({
            title: "Sign up Failed",
            description: error.message || "Could not create account. Please try again.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full-screen background with gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          background: `
            linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%),
            url('/images/welcome-bg.jpg')
          `,
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center, center',
        }}
      >
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header & Tagline */}
        <motion.div 
          className="text-center pt-12 pb-8 px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="https://storage.googleapis.com/hostinger-horizons-assets-prod/3576ad99-fbe5-4d76-95b8-b9445d3273c9/f248d90957aab1199c7db78e9c6d6c49.png" 
              alt="Growth App Logo" 
              className="h-12 w-12"
            />
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              Growth
            </h1>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white drop-shadow-lg max-w-4xl mx-auto leading-relaxed">
            This is more than an app. It's a journey towards the best version of you!
          </p>
        </motion.div>

        {/* Feature Highlights Section */}
        <motion.div 
          className="flex-1 flex flex-col items-center justify-center px-4 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Badge */}
          <motion.div 
            className="mb-8 bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Target className="w-4 h-4" />
            <Trophy className="w-4 h-4" />
            <Users className="w-4 h-4" />
            <span>Unlock 100+ badges as you grow</span>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-12">
            {[
              {
                icon: <Target className="w-8 h-8 text-green-600" />,
                title: "Personalized Challenges",
                subtitle: "Achieve your unique goals",
                bgGradient: "from-green-400 to-emerald-400"
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-orange-600" />,
                title: "Track Progress",
                subtitle: "See how far you've come",
                bgGradient: "from-orange-400 to-red-400"
              },
              {
                icon: <Users className="w-8 h-8 text-blue-600" />,
                title: "Community Support",
                subtitle: "Grow together with others",
                bgGradient: "from-blue-400 to-purple-400"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
              >
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Login Section */}
          <motion.div
            className="w-full max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
              <CardHeader className="text-center space-y-2 pb-6">
                <CardTitle className="text-2xl font-bold text-orange-500">
                  WELCOME BACK
                </CardTitle>
                <div className="flex items-center justify-center">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
                <CardDescription className="text-white/90 text-base">
                  Continue your growth journey
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Social Login Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleGoogleLogin}
                    className="w-full h-12 bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 font-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800 mr-3"></div>
                        Connecting...
                      </div>
                    ) : (
                      <>
                        <Chrome className="w-5 h-5 mr-3" />
                        Continue with Google
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleAppleLogin}
                    className="w-full h-12 bg-black text-white hover:bg-gray-900 font-medium"
                    disabled={loading}
                  >
                    <Apple className="w-5 h-5 mr-3" />
                    Continue with Apple
                  </Button>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {!isLogin && (
                    <Input 
                      type="text" 
                      placeholder="Full name" 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      className="h-12 bg-white/80 border-gray-200 text-gray-800 placeholder:text-gray-500 rounded-lg" 
                      required
                    />
                  )}
                  <Input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="h-12 bg-white/80 border-gray-200 text-gray-800 placeholder:text-gray-500 rounded-lg" 
                    required
                  />
                  <Input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="h-12 bg-white/80 border-gray-200 text-gray-800 placeholder:text-gray-500 rounded-lg" 
                    required
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                        {isLogin ? 'Signing in...' : 'Creating account...'}
                      </div>
                    ) : (
                      isLogin ? 'Start Your Growth Journey' : 'Create Account'
                    )}
                  </Button>
                </form>

                {/* Sign Up Link */}
                <div className="text-center pt-2">
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-white/80 hover:text-orange-400 transition-colors"
                  >
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span className="text-orange-400 underline font-medium">
                      {isLogin ? "Sign up" : "Sign in"}
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;