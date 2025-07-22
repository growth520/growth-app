import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Apple, Chrome, Target, Users, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, signInWithProvider } = useAuth();

  const generateUsername = async (fullName) => {
    let base = (fullName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!base) base = 'user';
    let username = base;
    let suffix = 1;
    let exists = true;
    while (exists) {
      const { data } = await supabase.from('profiles').select('id').eq('username', username).single();
      exists = !!data;
      if (exists) {
        username = base + suffix;
        suffix++;
      }
    }
    return username;
  };

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (!error) {
        toast({ title: "Welcome back! 🎉" });
        navigate('/challenge');
      }
    } else {
      const { error } = await signUp(email, password, { 
        data: { full_name: fullName } 
      });
      if (!error) {
        // After sign up, generate and save username
        const username = await generateUsername(fullName);
        // Get the user id (wait for session)
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id;
          if (userId) {
            await supabase.from('profiles').update({ username }).eq('id', userId);
          }
        }, 1000);
        toast({ title: "Account created! 🚀", description: "Please check your email to verify your account." });
        // Don't navigate immediately, wait for verification or auto-login
      }
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    const { error } = await signInWithProvider(provider);
    if (error) {
      setLoading(false);
    }
    // No need to navigate here, onAuthStateChange will handle it.
  };

  const featureCards = [
    {
      icon: <Target className="w-6 h-6 text-leaf-green" />,
      title: "Personalized Challenges",
    },
    {
      icon: <Trophy className="w-6 h-6 text-warm-orange" />,
      title: "Track Progress",
    },
    {
      icon: <Users className="w-6 h-6 text-forest-green" />,
      title: "Community Support",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-sun-beige">
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
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
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

          <motion.div
            className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, staggerChildren: 0.1 }}
          >
            {featureCards.map((feature, index) => (
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
                <Button onClick={() => handleSocialLogin('google')} variant="outline" className="w-full h-12 bg-white/80 border-black/10 text-charcoal-gray hover:bg-white transition-all duration-300">
                  <Chrome className="w-5 h-5 mr-3" />
                  Continue with Google
                </Button>
                <Button onClick={() => handleSocialLogin('apple')} variant="outline" className="w-full h-12 bg-white/80 border-black/10 text-charcoal-gray hover:bg-white transition-all duration-300">
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

              <form onSubmit={handleAuthAction} className="space-y-4">
                {!isLogin && (
                    <div>
                        <Input 
                            type="text" 
                            placeholder="Enter your full name" 
                            value={fullName} 
                            onChange={e => setFullName(e.target.value)} 
                            className="h-12 bg-white/80 border-black/10 text-charcoal-gray placeholder:text-charcoal-gray/50" 
                            required
                        />
                    </div>
                )}
                <div>
                  <Input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 bg-white/80 border-black/10 text-charcoal-gray placeholder:text-charcoal-gray/50" required />
                </div>
                <div>
                  <Input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 bg-white/80 border-black/10 text-charcoal-gray placeholder:text-charcoal-gray/50" required />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-forest-green to-leaf-green hover:from-forest-green/90 hover:to-leaf-green/90 text-white font-semibold transition-all duration-300 pulse-glow">
                  <Mail className="w-5 h-5 mr-2" />
                  {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                </Button>
              </form>

              <div className="text-center">
                <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-charcoal-gray/70 hover:text-forest-green transition-colors">
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