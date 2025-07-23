
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth as useSupabaseAuth } from './SupabaseAuthContext';
import LevelUpModal from '@/components/gamification/LevelUpModal';
import ConfettiCelebration from '@/components/gamification/ConfettiCelebration';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useSupabaseAuth();
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [levelUpInfo, setLevelUpInfo] = useState({ show: false, newLevel: 0 });
  const [showConfetti, setShowConfetti] = useState(false);


  const fetchAllData = useCallback(async (userId) => {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      setProfile(profileData);

      if (profileData.has_completed_assessment) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (progressError) throw progressError;
        setProgress(progressData);

        const { data: badgesData, error: badgesError } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', userId);

        if (badgesError) throw badgesError;
        setUserBadges(badgesData || []);

      } else {
        setProgress(null);
        setUserBadges([]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error.message);
      setProfile(null);
      setProgress(null);
      setUserBadges([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed since this is only called with user.id

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) console.error('Error fetching profile:', error);
    else setProfile(data);
  }, [user]);

  const refreshProgress = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) console.error('Error fetching progress:', error);
    else setProgress(data);
  }, [user]);

  const refreshHasNewNotifications = useCallback(async () => {
    if (!user || !progress) {
      setHasNewNotifications(false);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { data, error } = await supabase.rpc('check_new_notifications', {
      p_user_id: user.id,
      p_last_viewed: progress.last_viewed_notifications || new Date(0).toISOString()
    });

    if (error) {
      console.error('Error checking for new notifications:', error);
    } else {
      setHasNewNotifications(data);
    }
  }, [user, progress]);

  const updateLastViewedNotifications = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from('user_progress')
      .update({ last_viewed_notifications: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) console.error('Error updating last viewed notifications:', error);
    else {
      setHasNewNotifications(false);
      refreshProgress();
    }
  }, [user, refreshProgress]);

  const triggerLevelUp = (newLevel) => {
    setLevelUpInfo({ show: true, newLevel });
    setShowConfetti(true);
  };
  
  const clearLocalData = () => {
      setProfile(null);
      setProgress(null);
      setUserBadges([]);
      setHasNewNotifications(false);
      setLoading(true);
  }

  useEffect(() => {
    if (user) {
      fetchAllData(user.id);
    } else {
      clearLocalData();
      setLoading(false);
    }
  }, [user, fetchAllData]);

  useEffect(() => {
    if (progress) {
      refreshHasNewNotifications();
    }
  }, [progress, refreshHasNewNotifications]);

  useEffect(() => {
    if (!user) return;

    const handleInserts = (payload) => {
      refreshHasNewNotifications();
    };

    const likesChannel = supabase.channel('public:likes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, handleInserts)
      .subscribe();

    const commentsChannel = supabase.channel('public:comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, handleInserts)
      .subscribe();
      
    const progressListener = supabase
        .channel('public:user_progress')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_progress', filter: `user_id=eq.${user.id}` }, 
            (payload) => {
                setProgress(payload.new);
            }
        )
        .subscribe();
    
    const badgesListener = supabase
        .channel('public:user_badges')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_badges', filter: `user_id=eq.${user.id}` },
            async () => {
                const { data: badgesData, error: badgesError } = await supabase
                    .from('user_badges')
                    .select('*')
                    .eq('user_id', user.id);
                if (!badgesError) setUserBadges(badgesData || []);
            }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(progressListener);
      supabase.removeChannel(badgesListener);
    };
  }, [user, refreshHasNewNotifications]);

  const value = {
    profile,
    progress,
    userBadges,
    loading,
    hasNewNotifications,
    refreshProfile,
    refreshProgress,
    refreshAllData: () => user ? fetchAllData(user.id) : null,
    updateLastViewedNotifications,
    refreshHasNewNotifications,
    triggerLevelUp,
    clearLocalData,
    user: useSupabaseAuth().user
  };

  return (
    <DataContext.Provider value={value}>
        {children}
        {showConfetti && <ConfettiCelebration onComplete={() => setShowConfetti(false)} />}
        <LevelUpModal
            open={levelUpInfo.show}
            onOpenChange={(isOpen) => !isOpen && setLevelUpInfo({ show: false, newLevel: 0 })}
            newLevel={levelUpInfo.newLevel}
        />
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// This hook is deprecated - use useAuth from SupabaseAuthContext instead
export const useAuthFromDataContext = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within a DataProvider');
    }
    return { user: context.user };
}
