import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  MessageCircle, 
  Target, 
  X, 
  CheckCircle,
  RefreshCw,
  Bot,
  Heart
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/customSupabaseClient';
import { getActiveSuggestion, markSuggestionAsUsed } from '@/lib/openaiClient';
import { useToast } from '@/components/ui/use-toast';

const PersonalizedSuggestion = ({ 
  className = "",
  showHeader = true,
  compact = false,
  onSuggestionUsed,
  onDismiss
}) => {
  const { user } = useAuth();
  const { profile } = useData();
  const { toast } = useToast();
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const growthArea = profile?.assessment_results?.userSelection;

  // Fetch active suggestion
  useEffect(() => {
    const fetchSuggestion = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const result = await getActiveSuggestion(supabase, user.id);
        
        if (result.success) {
          setSuggestion(result.data);
          setError(null);
        } else {
          // Don't show error for feature not available or missing table
          if (result.error && 
              !result.error.includes('not found') && 
              !result.error.includes('PGRST116') &&
              !result.error.includes('relation') &&
              !result.error.includes('does not exist') &&
              !result.error.includes('Feature not available')) {
            setError(result.error);
          } else {
            setError(null);
            setSuggestion(null);
          }
        }
      } catch (err) {
        if (!import.meta.env.PROD) console.error('Error fetching suggestion:', err);
        // Only show error for actual problems, not missing tables or no data
        if (err.message && 
            !err.message.includes('relation') && 
            !err.message.includes('does not exist') &&
            !err.message.includes('PGRST116') &&
            !err.message.includes('not found') &&
            !err.message.includes('Feature not available')) {
          setError(err.message);
        } else {
          setError(null);
        }
        setSuggestion(null);
      }
      setLoading(false);
    };

    fetchSuggestion();
  }, [user]);

  const handleUseSuggestion = async () => {
    if (!suggestion) return;

    try {
      const result = await markSuggestionAsUsed(supabase, suggestion.id);
      
      if (result.success) {
        toast({
          title: "Challenge Accepted! 🎯",
          description: "Your personalized challenge is now active. Go make it happen!",
          duration: 4000,
        });
        
        setSuggestion(null);
        onSuggestionUsed?.(suggestion);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
              if (!import.meta.env.PROD) console.error('Error using suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to accept challenge. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    // Re-fetch suggestions
    const fetchSuggestion = async () => {
      const result = await getActiveSuggestion(supabase, user.id);
      if (result.success) {
        setSuggestion(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    fetchSuggestion();
  };

  // Don't render if dismissed or no user
  if (dismissed || !user) return null;

  // Loading state
  if (loading) {
    return (
      <Card className={`border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <Sparkles className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="h-4 bg-blue-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-blue-100 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state - only show for actual errors, not missing data
  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm text-red-700">
                Unable to load personalized suggestions
              </p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              className="text-red-600 hover:text-red-700"
              aria-label="Retry loading suggestions"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No suggestion available
  if (!suggestion) {
    return (
      <Card className={`border-gray-200 bg-gray-50 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center">
            <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              No personalized suggestions yet
            </p>
            <p className="text-xs text-gray-500">
              Complete a challenge with reflection to get AI-powered suggestions!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isAISuggestion = suggestion.ai_model && suggestion.ai_model !== 'fallback';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 overflow-hidden">
          {showHeader && (
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Sparkles className="w-5 h-5" />
                  {compact ? "AI Suggestion" : "Personalized for You"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-purple-100 text-purple-700 text-xs"
                  >
                    {isAISuggestion ? (
                      <>
                        <Bot className="w-3 h-3 mr-1" />
                        AI-Powered
                      </>
                    ) : (
                      <>
                        <Heart className="w-3 h-3 mr-1" />
                        Curated
                      </>
                    )}
                  </Badge>
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismiss}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      aria-label="Dismiss suggestion"
                      title="Dismiss suggestion"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          )}

          <CardContent className={compact ? "p-4" : "px-6 pb-6"}>
            <div className="space-y-4">
              {/* Motivational Message */}
              {suggestion.motivational_message && (
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-purple-700 mb-1">
                      Your AI Coach Says:
                    </p>
                    <p className="text-sm text-gray-700 italic">
                      "{suggestion.motivational_message}"
                    </p>
                  </div>
                </div>
              )}

              {/* Challenge Suggestion */}
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700 mb-1">
                    Your Next Challenge:
                  </p>
                  <p className="text-sm text-gray-800 font-medium">
                    {suggestion.suggestion_text}
                  </p>
                  {suggestion.growth_area && (
                    <Badge 
                      variant="outline" 
                      className="mt-2 text-xs border-blue-200 text-blue-600"
                    >
                      {suggestion.growth_area} Focus
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button 
                  onClick={handleUseSuggestion}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex-1"
                  size={compact ? "sm" : "default"}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Challenge
                </Button>
                
                <Button 
                  variant="ghost" 
                  size={compact ? "sm" : "default"}
                  onClick={handleRefresh}
                  className="text-gray-600 hover:text-gray-800"
                  aria-label="Refresh suggestions"
                  title="Get new suggestions"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-purple-100">
                <span>
                  Created {new Date(suggestion.created_at).toLocaleDateString()}
                </span>
                <span>
                  Expires {new Date(suggestion.expires_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default PersonalizedSuggestion; 