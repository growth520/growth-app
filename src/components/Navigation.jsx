import React, { useState, useRef, useEffect } from 'react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const touchStartTimeRef = useRef(null);

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

  // Enhanced mobile touch handling
  const handleTouchStart = () => {
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchEnd = (callback) => {
    const touchDuration = Date.now() - (touchStartTimeRef.current || 0);
    // Ensure it's a quick tap, not a scroll
    if (touchDuration < 500) {
      callback();
    }
  };

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      setIsDropdownOpen(false);
    };
  }, []);

  return (
    <>
      {/* Top Navigation for Mobile */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-sun-beige/95 backdrop-blur-md border-b border-black/10 shadow-sm w-full overflow-hidden"
      >
        <div className="container mx-auto px-4 max-w-full">
          <div className="flex items-center justify-between h-16 w-full">
            <motion.div
              className="flex items-center gap-3 cursor-pointer flex-shrink-0"
              onClick={() => navigate('/challenge')}
              whileHover={{ scale: 1.05 }}
              onTouchStart={handleTouchStart}
              onTouchEnd={() => handleTouchEnd(() => navigate('/challenge'))}
              style={{ touchAction: 'manipulation' }}
            >
              <img src="https://storage.googleapis.com/hostinger-horizons-assets-prod/3576ad99-fbe5-4d76-95b8-b9445d3273c9/f248d90957aab1199c7db78e9c6d6c49.png" alt="Growth App Logo" className="h-8" />
              <span className="text-2xl font-bold gradient-text">Growth</span>
            </motion.div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                onClick={() => navigate('/notifications')} 
                variant="ghost" 
                size="icon" 
                className="relative"
                onTouchStart={handleTouchStart}
                onTouchEnd={() => handleTouchEnd(() => navigate('/notifications'))}
                style={{ touchAction: 'manipulation' }}
              >
                <Heart className="w-6 h-6 text-charcoal-gray/70" />
                {hasNewNotifications && <div className="absolute top-2 right-2 w-2 h-2 bg-leaf-green rounded-full" />}
              </Button>
              
              {/* Fixed Dropdown Menu */}
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 cursor-pointer rounded-full p-1 hover:bg-black/5 transition-colors"
                    style={{ 
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onTouchStart={handleTouchStart}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || profile?.email} />
                      <AvatarFallback className="bg-gradient-to-r from-forest-green to-leaf-green text-white text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-white/95 backdrop-blur-sm border border-black/10 shadow-lg"
                  sideOffset={8}
                >
                  <DropdownMenuItem 
                    onClick={() => navigate('/profile')} 
                    className="cursor-pointer hover:bg-black/5 focus:bg-black/5"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={() => handleTouchEnd(() => navigate('/profile'))}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>View Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate('/settings')} 
                    className="cursor-pointer hover:bg-black/5 focus:bg-black/5"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={() => handleTouchEnd(() => navigate('/settings'))}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 hover:text-red-700 focus:text-red-700"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={() => handleTouchEnd(handleLogout)}
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
              
              {/* Desktop Dropdown */}
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 cursor-pointer rounded-lg p-2 hover:bg-black/5 transition-colors">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || profile?.email} />
                      <AvatarFallback className="bg-gradient-to-r from-forest-green to-leaf-green text-white text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-charcoal-gray text-sm">{profile?.full_name}</span>
                  </button>
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
                    className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50"
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

      {/* Bottom Navigation for Mobile - Enhanced Touch */}
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-sun-beige/95 backdrop-blur-xl border-t border-black/10 md:hidden w-full overflow-hidden"
      >
        <div className="flex justify-around items-center h-16 w-full max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  if (!active) {
                    navigate(item.path, { replace: true });
                  }
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={() => {
                  if (!active) {
                    handleTouchEnd(() => navigate(item.path, { replace: true }));
                  }
                }}
                className={`flex flex-col items-center justify-center h-full transition-all duration-200 flex-1 min-w-0 rounded-none ${
                  active 
                    ? 'text-forest-green bg-forest-green/5' 
                    : 'text-charcoal-gray/60 hover:text-forest-green hover:bg-black/5'
                }`}
                style={{ 
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '64px',
                  minWidth: '44px'
                }}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs truncate px-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
};

export default Navigation;