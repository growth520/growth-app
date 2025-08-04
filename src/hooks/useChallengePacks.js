import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';

// Feature flag for challenge packs - disable if tables don't exist
const CHALLENGE_PACKS_ENABLED = true;

export const useChallengePacks = () => {
  const { user } = useAuth();
  const { progress } = useData();
  const [challengePacks, setChallengePacks] = useState([]);
  const [userPackProgress, setUserPackProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all challenge packs
  const fetchChallengePacks = useCallback(async () => {
    if (!CHALLENGE_PACKS_ENABLED) {
      setChallengePacks([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('challenge_packs')
        .select('*')
        .order('id', { ascending: true }); // Changed from sort_order to id

      if (error) throw error;
      setChallengePacks(data || []);
    } catch (err) {
      // Silently handle table not existing
      if (err?.code === 'PGRST106' || err?.status === 400 || err?.status === 404) {
        setChallengePacks([]);
        return;
      }
      setError(err.message);
      if (!import.meta.env.PROD) console.error('Error fetching challenge packs:', err);
    }
  }, []);

  // Fetch user's pack progress - UPDATED TO REMOVE IMPLICIT JOINS
  const fetchUserPackProgress = useCallback(async () => {
    if (!user || !CHALLENGE_PACKS_ENABLED) {
      setUserPackProgress([]);
      return;
    }

    try {
      // Step 1: Fetch user pack progress without any joins
      const { data: packProgressData, error: packProgressError } = await supabase
        .from('user_pack_progress')
        .select('id, pack_id, is_completed, started_at, completion_percentage, current_day, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('is_completed', false);

      if (packProgressError) throw packProgressError;

      // Step 2: If we have pack progress data, fetch the corresponding challenge packs separately
      if (packProgressData && packProgressData.length > 0) {
        const packIds = packProgressData.map(p => p.pack_id).filter(Boolean);
        
        if (packIds.length > 0) {
          // Fetch challenge packs using the pack_ids (UUIDs)
          const { data: challengePacksData, error: challengePacksError } = await supabase
            .from('challenge_packs')
            .select('id, title, description, level_required, challenges, category, icon, duration_days')
            .in('id', packIds);

          if (challengePacksError) {
            console.error('Error fetching challenge packs:', challengePacksError);
            // Continue with just pack progress data
            setUserPackProgress(packProgressData || []);
            return;
          } else {
            // Step 3: Combine the data in JavaScript
            const combinedData = packProgressData.map(progress => {
              const pack = challengePacksData?.find(p => p.id === progress.pack_id);
              return {
                ...progress,
                challenge_packs: pack || null
              };
            });
            setUserPackProgress(combinedData);
            return;
          }
        }
      }

      // If no pack progress or error fetching challenge packs, just set the pack progress
      setUserPackProgress(packProgressData || []);
    } catch (err) {
      // Silently handle table not existing
      if (err?.code === 'PGRST106' || err?.status === 400 || err?.status === 404) {
        setUserPackProgress([]);
        return;
      }
      setError(err.message);
      if (!import.meta.env.PROD) console.error('Error fetching user pack progress:', err);
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

  // Get completed challenges for a specific pack
  const getCompletedChallenges = useCallback(async (packId) => {
    if (!user || !CHALLENGE_PACKS_ENABLED) return [];

    try {
      const { data, error } = await supabase
        .from('user_pack_challenge_progress')
        .select('challenge_index')
        .eq('user_id', user.id)
        .eq('pack_id', packId) // Use packId directly (UUID)
        .order('challenge_index');

      if (error) throw error;
      return data?.map(item => item.challenge_index) || [];
    } catch (err) {
      console.error('Error fetching completed challenges:', err);
      return [];
    }
  }, [user]);

  // Complete a challenge in a pack - UPDATED TO HANDLE BIGINT PACK_ID
  const completePackChallenge = useCallback(async (packId, challengeIndex) => {
    if (!user || !CHALLENGE_PACKS_ENABLED) return { success: false, error: 'Feature not available' };

    try {
      // Convert packId to BIGINT since challenge_packs.id is BIGINT
      const packIdBigInt = parseInt(packId);
      
      const { data, error } = await supabase.rpc('complete_pack_challenge', {
        p_user_id: user.id,
        p_pack_id: packIdBigInt, // Convert to BIGINT for challenge_packs.id
        p_challenge_index: challengeIndex
      });

      if (error) throw error;

      // Refresh user pack progress
      await fetchUserPackProgress();
      
      return { success: true, data };
    } catch (err) {
      console.error('Error completing pack challenge:', err);
      return { success: false, error: err.message };
    }
  }, [user, fetchUserPackProgress]);

  // Get pack completion percentage - UPDATED TO HANDLE BIGINT PACK_ID
  const getPackCompletionPercentage = useCallback(async (packId) => {
    if (!user || !CHALLENGE_PACKS_ENABLED) return 0;

    try {
      // Convert packId to BIGINT since challenge_packs.id is BIGINT
      const packIdBigInt = parseInt(packId);
      
      const { data, error } = await supabase.rpc('get_pack_completion_percentage', {
        p_user_id: user.id,
        p_pack_id: packIdBigInt // Convert to BIGINT for challenge_packs.id
      });

      if (error) throw error;
      return data || 0;
    } catch (err) {
      console.error('Error getting pack completion percentage:', err);
      return 0;
    }
  }, [user]);

  // Start a challenge pack - UPDATED TO HANDLE BIGINT PACK_ID
  const startChallengePack = useCallback(async (packId) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    if (!CHALLENGE_PACKS_ENABLED) return { success: false, error: 'Feature not available' };

    try {
      // Convert packId to BIGINT since challenge_packs.id is BIGINT
      const packIdBigInt = parseInt(packId);
      
      const { data, error } = await supabase
        .from('user_pack_progress')
        .insert({
          user_id: user.id,
          pack_id: packIdBigInt, // Convert to BIGINT for challenge_packs.id
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
      // Silently handle table not existing
      if (err?.code === 'PGRST106' || err?.status === 400 || err?.status === 404) {
        return { success: false, error: 'Feature not available' };
      }
      if (!import.meta.env.PROD) console.error('Error starting challenge pack:', err);
      return { success: false, error: err.message };
    }
  }, [user, fetchUserPackProgress]);

  // Update pack progress - UPDATED TO HANDLE BIGINT PACK_ID
  const updatePackProgress = useCallback(async (packId, updates) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    if (!CHALLENGE_PACKS_ENABLED) return { success: false, error: 'Feature not available' };

    try {
      // Convert packId to BIGINT since challenge_packs.id is BIGINT
      const packIdBigInt = parseInt(packId);
      
      const { data, error } = await supabase
        .from('user_pack_progress')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('pack_id', packIdBigInt) // Convert to BIGINT for challenge_packs.id
        .select()
        .single();

      if (error) throw error;

      // Refresh user pack progress
      await fetchUserPackProgress();
      
      return { success: true, data };
    } catch (err) {
      // Silently handle table not existing
      if (err?.code === 'PGRST106' || err?.status === 400 || err?.status === 404) {
        return { success: false, error: 'Feature not available' };
      }
      if (!import.meta.env.PROD) console.error('Error updating pack progress:', err);
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
      // Provide default values for columns that might not exist
      icon: pack.icon || '🎯',
      duration_days: pack.duration_days || 7,
      category: pack.category || 'Growth',
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
        const totalChallenges = Array.isArray(pack.challenges) ? pack.challenges.length : 0;
        const completedChallenges = packProgress.completion_percentage || 0;
        return `${Math.round((completedChallenges / 100) * totalChallenges)} of ${totalChallenges} completed`;
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
    getCompletedChallenges,
    completePackChallenge,
    getPackCompletionPercentage,
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