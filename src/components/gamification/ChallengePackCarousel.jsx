import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Rocket,
  Flower2,
  Shield,
  Heart,
  Smartphone,
  Target,
  MessageCircle,
  Dumbbell,
  Sparkles,
  Trophy,
  Star,
  Zap,
  Brain,
  Users
} from 'lucide-react';
import { useChallengePacks } from '@/hooks/useChallengePacks';

// Pack icon mapping - using only verified lucide-react icons
const getPackIcon = (title) => {
  const iconMap = {
    'Confidence Sprint': Rocket,
    'Mindful Morning': Flower2,
    'Self-Control Boost': Target,
    'Resilience Builder': Shield,
    'Gratitude Growth': Heart,
    'Purpose Path': Star,
    'Communication Upgrade': MessageCircle,
    'Humility & Perspective': Users,
    'Energy & Movement': Zap,
    'Digital Detox': Smartphone
  };
  
  return iconMap[title] || Trophy;
};

// Pack gradient mapping
const getPackGradient = (title) => {
  const gradientMap = {
    'Confidence Sprint': 'from-orange-400 via-orange-500 to-yellow-400',
    'Mindful Morning': 'from-blue-400 via-cyan-500 to-teal-400',
    'Self-Control Boost': 'from-purple-400 via-pink-500 to-red-400',
    'Resilience Builder': 'from-green-400 via-emerald-500 to-teal-500',
    'Gratitude Growth': 'from-purple-500 via-violet-500 to-pink-500',
    'Purpose Path': 'from-indigo-400 via-purple-500 to-pink-400',
    'Communication Upgrade': 'from-blue-500 via-sky-500 to-cyan-400',
    'Humility & Perspective': 'from-slate-400 via-gray-500 to-zinc-400',
    'Energy & Movement': 'from-red-400 via-pink-500 to-rose-400',
    'Digital Detox': 'from-slate-500 via-gray-600 to-neutral-500'
  };
  
  return gradientMap[title] || 'from-forest-green via-green-500 to-emerald-400';
};

const ChallengePackCard = ({ pack, isLocked, onPackClick }) => {
  const Icon = getPackIcon(pack.title);
  const gradient = getPackGradient(pack.title);
  const totalChallenges = Array.isArray(pack.challenges) ? pack.challenges.length : 0;
  const completedCount = pack.progress?.completion_percentage 
    ? Math.round((pack.progress.completion_percentage / 100) * totalChallenges)
    : 0;

  return (
    <motion.div
      whileHover={{ scale: isLocked ? 1.02 : 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="flex-shrink-0 w-72 h-48 relative"
      onClick={() => !isLocked && onPackClick(pack)}
    >
      <Card className={`w-full h-full overflow-hidden cursor-pointer transition-all duration-300 ${
        isLocked ? 'opacity-60' : 'shadow-lg hover:shadow-xl'
      }`}>
        <CardContent className={`p-0 h-full relative bg-gradient-to-br ${isLocked ? 'from-gray-300 to-gray-400' : gradient}`}>
          {/* Lock Overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white z-10">
              <Lock className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium">Unlock at Level {pack.level_required}</p>
            </div>
          )}

          {/* Content */}
          <div className="relative h-full p-6 flex flex-col justify-between text-white">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-6 h-6" />
                  {pack.isStarted && !isLocked && (
                    <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                      Started
                    </Badge>
                  )}
                  {pack.progress?.is_completed && (
                    <Badge variant="secondary" className="bg-green-500/20 text-white text-xs">
                      <Trophy className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2 leading-tight">
                  {pack.title}
                </h3>
                <p className="text-sm opacity-90 line-clamp-2">
                  {pack.description}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="space-y-3">
              {/* Progress if started */}
              {pack.isStarted && !isLocked && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{completedCount}/{totalChallenges} Challenges</span>
                  </div>
                  <Progress 
                    value={(completedCount / totalChallenges) * 100} 
                    className="h-2 bg-white/20"
                  />
                </div>
              )}

              {/* Pack Info */}
              <div className="flex items-center justify-between text-xs opacity-90">
                <span>{totalChallenges} Challenges</span>
                <span>Level {pack.level_required}+</span>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 opacity-20">
              <Icon className="w-12 h-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ChallengePackCarousel = ({ title = "Challenge Packs", onPackClick }) => {
  const navigate = useNavigate();
  const { getPacksWithStatus, loading } = useChallengePacks();
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const packs = getPacksWithStatus();

  // Update scroll buttons visibility
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [packs]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const targetScroll = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Mouse drag functionality
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handlePackClick = (pack) => {
    if (onPackClick) {
      onPackClick(pack);
    } else {
      navigate(`/challenge-pack/${pack.id}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-forest-green">{title}</h2>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72 h-48 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-forest-green">{title}</h2>
        <div className="text-center py-12 text-gray-500">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No challenge packs available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-forest-green">{title}</h2>
          <p className="text-gray-600 text-sm">
            Complete themed challenges to accelerate your growth
          </p>
        </div>

        {/* Desktop Navigation Arrows */}
        <div className="hidden md:flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-10 h-10 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-10 h-10 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', '-ms-overflow-style': 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <AnimatePresence>
            {packs.map((pack, index) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ChallengePackCard
                  pack={pack}
                  isLocked={!pack.isUnlocked}
                  onPackClick={handlePackClick}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Scroll Indicators */}
        <div className="flex justify-center mt-4 gap-1">
          {Array.from({ length: Math.ceil(packs.length / 3) }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gray-300 transition-colors duration-200"
            />
          ))}
        </div>
      </div>

      {/* Mobile Swipe Hint */}
      <div className="md:hidden text-center">
        <p className="text-xs text-gray-400">← Swipe to explore more packs →</p>
      </div>
    </div>
  );
};

export default ChallengePackCarousel; 