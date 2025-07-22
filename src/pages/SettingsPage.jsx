import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    show_streak: true,
    show_level_xp: true,
    show_badges: true,
    allow_follower_view: true,
    allow_following_view: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        toast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setSettings(data);
      }
    };

    fetchSettings();
  }, [user]);

  const handleToggle = async (key) => {
    setIsSaving(true);
    const newSettings = { ...settings, [key]: !settings[key] };
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: user.id,
          ...newSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSettings(newSettings);
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
      // Revert the toggle if save failed
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-sun-beige text-charcoal-gray font-lato">
      <div className="container mx-auto px-4 pt-8 pb-24 max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2"/>
            Back
          </Button>
          <h1 className="text-3xl font-bold text-forest-green">Settings</h1>
          <p className="text-charcoal-gray/70 mt-1">Manage your profile and privacy preferences</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Profile Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Visibility</CardTitle>
              <CardDescription>Control what others can see on your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Growth Streak</div>
                  <div className="text-sm text-charcoal-gray/70">Show your daily streak on your profile</div>
                </div>
                <Switch
                  checked={settings.show_streak}
                  onCheckedChange={() => handleToggle('show_streak')}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Level and XP</div>
                  <div className="text-sm text-charcoal-gray/70">Display your current level and XP progress</div>
                </div>
                <Switch
                  checked={settings.show_level_xp}
                  onCheckedChange={() => handleToggle('show_level_xp')}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Badges</div>
                  <div className="text-sm text-charcoal-gray/70">Show your earned badges on your profile</div>
                </div>
                <Switch
                  checked={settings.show_badges}
                  onCheckedChange={() => handleToggle('show_badges')}
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Social */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Social</CardTitle>
              <CardDescription>Manage your social connections and privacy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Followers List</div>
                  <div className="text-sm text-charcoal-gray/70">Allow others to see who follows you</div>
                </div>
                <Switch
                  checked={settings.allow_follower_view}
                  onCheckedChange={() => handleToggle('allow_follower_view')}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Following List</div>
                  <div className="text-sm text-charcoal-gray/70">Allow others to see who you follow</div>
                </div>
                <Switch
                  checked={settings.allow_following_view}
                  onCheckedChange={() => handleToggle('allow_following_view')}
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage; 