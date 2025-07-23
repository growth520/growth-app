import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, LogOut, Settings, User, Target, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { profile, hasNewNotifications } = useData();

  const navItems = [
    { path: '/challenge', icon: Target, label: 'Challenge' },
    { path: '/progress', icon: BarChart3, label: 'Progress' },
    { path: '/community', icon: Users, label: 'Community' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const initials = (profile?.full_name && profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase())
    || (profile?.email && profile.email.split('@')[0].slice(0,2).toUpperCase())
    || 'U';

  return (
    <>
      {/* Top Navigation for Mobile */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-sun-beige/95 backdrop-blur-md border-b border-black/10 shadow-sm"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/challenge')}
              whileHover={{ scale: 1.05 }}
            >
              <img src="https://storage.googleapis.com/hostinger-horizons-assets-prod/3576ad99-fbe5-4d76-95b8-b9445d3273c9/f248d90957aab1199c7db78e9c6d6c49.png" alt="Growth App Logo" className="h-8" />
              <span className="text-2xl font-bold gradient-text">Growth</span>
            </motion.div>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate('/notifications')} variant="ghost" size="icon" className="relative">
                <Heart className="w-6 h-6 text-charcoal-gray/70" />
                {hasNewNotifications && <div className="absolute top-2 right-2 w-2 h-2 bg-leaf-green rounded-full" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="w-8 h-8 cursor-pointer">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || profile?.email} />
                    <AvatarFallback className="bg-gradient-to-r from-forest-green to-leaf-green text-white text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>View Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Desktop Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-sun-beige/80 backdrop-blur-xl border-b border-black/10"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/challenge')}
              whileHover={{ scale: 1.05 }}
            >
              <img src="https://storage.googleapis.com/hostinger-horizons-assets-prod/3576ad99-fbe5-4d76-95b8-b9445d3273c9/f248d90957aab1199c7db78e9c6d6c49.png" alt="Growth App Logo" className="h-8" />
              <span className="text-2xl font-bold gradient-text">Growth</span>
            </motion.div>
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/notifications')} variant="ghost" size="icon" className="relative">
                <Heart className="w-5 h-5 text-charcoal-gray/70" />
                {hasNewNotifications && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-leaf-green rounded-full" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || profile?.email} />
                      <AvatarFallback className="bg-gradient-to-r from-forest-green to-leaf-green text-white text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-charcoal-gray text-sm">{profile?.full_name}</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>View Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Bottom Navigation for Mobile */}
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-sun-beige/90 backdrop-blur-xl border-t border-black/10 md:hidden"
      >
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Button
                key={item.path}
                onClick={() => {
                  if (!active) {
                    navigate(item.path, { replace: true });
                  }
                }}
                variant="ghost"
                className={`flex flex-col items-center h-full rounded-none transition-all duration-300 w-full ${
                  active ? 'text-forest-green' : 'text-charcoal-gray/60'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
};

export default Navigation;