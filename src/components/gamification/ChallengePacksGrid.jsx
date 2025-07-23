import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChallengePackCard from './ChallengePackCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter, Grid, List } from 'lucide-react';
import { useChallengePacks } from '@/hooks/useChallengePacks';
import { useToast } from '@/components/ui/use-toast';

const ChallengePacksGrid = ({ 
  title = "Challenge Packs",
  showFilters = true,
  maxPacks = null,
  layout = "grid", // "grid", "list", "carousel"
  onPackStart,
  onPackContinue,
  onPackView
}) => {
  const { 
    getPacksWithStatus, 
    startChallengePack, 
    loading, 
    error 
  } = useChallengePacks();
  
  const { toast } = useToast();
  const [filter, setFilter] = useState('all'); // 'all', 'unlocked', 'started', 'completed'
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended', 'level', 'duration'

  const packs = getPacksWithStatus();

  // Filter packs based on selected filter
  const filteredPacks = React.useMemo(() => {
    let filtered = [...packs];

    switch (filter) {
      case 'unlocked':
        filtered = filtered.filter(pack => pack.isUnlocked && !pack.isStarted);
        break;
      case 'started':
        filtered = filtered.filter(pack => pack.isStarted && !pack.progress?.is_completed);
        break;
      case 'completed':
        filtered = filtered.filter(pack => pack.progress?.is_completed);
        break;
      default:
        // 'all' - no filtering
        break;
    }

    // Sort packs
    switch (sortBy) {
      case 'level':
        filtered.sort((a, b) => a.level_required - b.level_required);
        break;
      case 'duration':
        filtered.sort((a, b) => a.duration_days - b.duration_days);
        break;
      case 'recommended':
      default:
        // Sort by unlock status, then started status, then level
        filtered.sort((a, b) => {
          if (a.isUnlocked && !b.isUnlocked) return -1;
          if (!a.isUnlocked && b.isUnlocked) return 1;
          if (a.isStarted && !b.isStarted) return -1;
          if (!a.isStarted && b.isStarted) return 1;
          return a.level_required - b.level_required;
        });
        break;
    }

    return maxPacks ? filtered.slice(0, maxPacks) : filtered;
  }, [packs, filter, sortBy, maxPacks]);

  const handlePackStart = async (pack) => {
    const result = await startChallengePack(pack.id);
    if (result.success) {
      toast({
        title: "Pack Started! 🚀",
        description: `You've started ${pack.title}. Your journey begins now!`,
      });
      onPackStart?.(pack);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to start pack. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getFilterCount = (filterType) => {
    switch (filterType) {
      case 'unlocked':
        return packs.filter(p => p.isUnlocked && !p.isStarted).length;
      case 'started':
        return packs.filter(p => p.isStarted && !p.progress?.is_completed).length;
      case 'completed':
        return packs.filter(p => p.progress?.is_completed).length;
      default:
        return packs.length;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading challenge packs: {error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-forest-green">{title}</h2>
          <p className="text-gray-600 text-sm">
            Complete themed challenges to accelerate your growth
          </p>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2">
            {['all', 'unlocked', 'started', 'completed'].map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterOption)}
                className="capitalize"
              >
                {filterOption}
                <Badge 
                  variant="secondary" 
                  className="ml-2 text-xs"
                >
                  {getFilterCount(filterOption)}
                </Badge>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Sort Options */}
      {showFilters && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="recommended">Recommended</option>
            <option value="level">Level Required</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      )}

      {/* Packs Grid */}
      <AnimatePresence mode="wait">
        {filteredPacks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 mb-4">
              <Grid className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No packs found
            </h3>
            <p className="text-gray-500">
              {filter === 'unlocked' && "Complete more challenges to unlock new packs!"}
              {filter === 'started' && "Start a challenge pack to see it here."}
              {filter === 'completed' && "Complete challenge packs to see them here."}
              {filter === 'all' && "Challenge packs will appear here once loaded."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`grid gap-6 ${
              layout === 'list' 
                ? 'grid-cols-1' 
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {filteredPacks.map((pack, index) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <ChallengePackCard
                  pack={pack}
                  onStart={handlePackStart}
                  onContinue={onPackContinue}
                  onView={onPackView}
                  size={layout === 'list' ? 'compact' : 'default'}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChallengePacksGrid; 