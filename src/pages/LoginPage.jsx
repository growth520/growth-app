import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Apple, Chrome, Target, Users, Trophy } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-sun-beige">
      {/* Background animations */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-leaf-green/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-warm-orange/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-center lg:text-left space-y-8"
        >
          <div className="space-y-4">
            <motion.div
              className="inline-flex items-center gap-3 text-6xl font-bold"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img src="https://storage.googleapis.com/hostinger-horizons-assets-prod/3576ad99-fbe5-4d76-95b8-b9445d3273c9/f248d90957aab1199c7db78e9c6d6c49.png" alt="Growth App Logo" className="h-20" />
              <span className="gradient-text">Growth</span>
            </motion.div>
            <motion.p
              className="text-xl text-charcoal-gray/80 max-w-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              This is more than an app. It's a journey towards the best version of you!
            </motion.p>
          </div>

          {/* Feature cards */}
          <motion.div
            className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, staggerChildren: 0.1 }}
          >
            {[
              { icon: <Target className="w-6 h-6 text-leaf-green" />, title: "Personalized Challenges" },
              { icon: <Trophy className="w-6 h-6 text-warm-orange" />, title: "Track Progress" },
              { icon: <Users className="w-6 h-6 text-forest-green" />, title: "Community Support" },
            ].map((feature, index) => (
              <motion.div key={index} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="flex-1">
                <Card className="bg-white/40 border-black/10 shadow-md h-full">
                  <CardContent className="p-3 flex flex-col items-center text-center space-y-2">
                    {feature.icon}
                    <span className="text-xs font-medium text-charcoal-gray/80">{feature.title}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right side - Auth form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="bg-white/50 border-black/10 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <CardTitle className="text-3xl font-bold text-forest-green">
                {isLogin ? 'Welcome Back' : 'Join Growth'}
              </CardTitle>
              <CardDescription className="text-charcoal-gray/70">
                {isLogin ? 'Continue your growth journey' : 'Start your transformation today'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Button 
                  onClick={handleGoogleLogin}
                  variant="outline" 
                  className="w-full h-12 bg-white/80 border-black/10 text-charcoal-gray hover:bg-white transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-charcoal-gray mr-3"></div>
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
                  variant="outline" 
                  className="w-full h-12 bg-white/80 border-black/10 text-charcoal-gray hover:bg-white transition-all duration-300"
                  disabled={loading}
                >
                  <Apple className="w-5 h-5 mr-3" />
                  Continue with Apple
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-black/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-sun-beige px-2 text-charcoal-gray/60">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {!isLogin && (
                  <Input 
                    type="text" 
                    placeholder="Enter your full name" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    className="h-12 bg-white/80 border-black/10 text-charcoal-gray placeholder:text-charcoal-gray/50" 
                    required
                  />
                )}
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="h-12 bg-white/80 border-black/10 text-charcoal-gray placeholder:text-charcoal-gray/50" 
                  required
                />
                <Input 
                  type="password" 
                  placeholder="Enter your password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="h-12 bg-white/80 border-black/10 text-charcoal-gray placeholder:text-charcoal-gray/50" 
                  required
                />
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-forest-green to-leaf-green text-white font-bold py-6 text-base rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </div>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-charcoal-gray/70 hover:text-forest-green transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;