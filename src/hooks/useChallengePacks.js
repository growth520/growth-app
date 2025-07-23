import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';

export const useChallengePacks = () => {
  const { user } = useAuth();
  const { progress } = useData();
  const [challengePacks, setChallengePacks] = useState([]);
  const [userPackProgress, setUserPackProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all challenge packs
  const fetchChallengePacks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('challenge_packs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setChallengePacks(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching challenge packs:', err);
    }
  }, []);

  // Fetch user's pack progress
  const fetchUserPackProgress = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_pack_progress')
        .select(`
          *,
          challenge_packs (
            title,
            description,
            icon,
            duration_days
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setUserPackProgress(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching user pack progress:', err);
    }
  }, [user]);

  // Check if pack is unlocked for current user
  const isPackUnlocked = useCallback((pack) => {
    if (!progress) return false;
    return progress.level >= pack.level_required;
  }, [progress]);

  // Check if pack is started by user
  const isPackStarted = useCallback((packId) => {
    return userPackProgress.some(p => p.pack_id === packId);
  }, [userPackProgress]);

  // Get pack progress for a specific pack
  const getPackProgress = useCallback((packId) => {
    return userPackProgress.find(p => p.pack_id === packId);
  }, [userPackProgress]);

  // Start a challenge pack
  const startChallengePack = useCallback(async (packId) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('user_pack_progress')
        .insert({
          user_id: user.id,
          pack_id: packId,
          current_day: 1,
          is_completed: false,
          completion_percentage: 0
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh user pack progress
      await fetchUserPackProgress();
      
      return { success: true, data };
    } catch (err) {
      console.error('Error starting challenge pack:', err);
      return { success: false, error: err.message };
    }
  }, [user, fetchUserPackProgress]);

  // Update pack progress
  const updatePackProgress = useCallback(async (packId, updates) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('user_pack_progress')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('pack_id', packId)
        .select()
        .single();

      if (error) throw error;

      // Refresh user pack progress
      await fetchUserPackProgress();
      
      return { success: true, data };
    } catch (err) {
      console.error('Error updating pack progress:', err);
      return { success: false, error: err.message };
    }
  }, [user, fetchUserPackProgress]);

  // Complete a pack
  const completePack = useCallback(async (packId) => {
    return await updatePackProgress(packId, {
      is_completed: true,
      completed_at: new Date().toISOString(),
      completion_percentage: 100
    });
  }, [updatePackProgress]);

  // Get recommended packs based on user's growth area and level
  const getRecommendedPacks = useCallback(() => {
    if (!progress?.profile?.assessment_results?.userSelection) return [];

    const userGrowthArea = progress.profile.assessment_results.userSelection;
    const userLevel = progress.level || 1;

    return challengePacks
      .filter(pack => {
        // Pack should be unlocked
        if (pack.level_required > userLevel) return false;
        
        // Prioritize packs in user's growth area
        if (pack.category === userGrowthArea) return true;
        
        // Include other unlocked packs
        return true;
      })
      .sort((a, b) => {
        // Sort by growth area match first, then by level requirement
        if (a.category === userGrowthArea && b.category !== userGrowthArea) return -1;
        if (b.category === userGrowthArea && a.category !== userGrowthArea) return 1;
        return a.level_required - b.level_required;
      });
  }, [challengePacks, progress]);

  // Get packs with their unlock/progress status
  const getPacksWithStatus = useCallback(() => {
    return challengePacks.map(pack => ({
      ...pack,
      isUnlocked: isPackUnlocked(pack),
      isStarted: isPackStarted(pack.id),
      progress: getPackProgress(pack.id),
      statusText: (() => {
        if (!isPackUnlocked(pack)) {
          return `Unlock at Level ${pack.level_required}`;
        }
        const packProgress = getPackProgress(pack.id);
        if (!packProgress) {
          return 'Ready to Start';
        }
        if (packProgress.is_completed) {
          return 'Completed';
        }
        return `Day ${packProgress.current_day} of ${pack.duration_days}`;
      })()
    }));
  }, [challengePacks, isPackUnlocked, isPackStarted, getPackProgress]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchChallengePacks(),
        fetchUserPackProgress()
      ]);
      
      setLoading(false);
    };

    loadData();
  }, [fetchChallengePacks, fetchUserPackProgress]);

  return {
    challengePacks,
    userPackProgress,
    loading,
    error,
    isPackUnlocked,
    isPackStarted,
    getPackProgress,
    startChallengePack,
    updatePackProgress,
    completePack,
    getRecommendedPacks,
    getPacksWithStatus,
    refresh: () => {
      fetchChallengePacks();
      fetchUserPackProgress();
    }
  };
}; 