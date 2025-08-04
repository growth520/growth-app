// OpenAI API client for personalized suggestions
// Note: In production, this should be handled by a backend service for security

import { getCachedData, setCachedData } from '@/lib/performance.jsx';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Show UI warning if OpenAI API key is missing in production
if (import.meta.env.PROD && !OPENAI_API_KEY) {
  // Create a user-friendly warning banner
  if (typeof window !== 'undefined') {
    const existingWarning = document.getElementById('openai-warning');
    if (!existingWarning) {
      const warningDiv = document.createElement('div');
      warningDiv.id = 'openai-warning';
      warningDiv.innerHTML = `
        <div style="
          position: fixed; 
          top: 0; 
          left: 0; 
          right: 0; 
          background: #fef3c7; 
          color: #92400e; 
          padding: 8px 16px; 
          text-align: center; 
          font-size: 14px; 
          border-bottom: 1px solid #f59e0b;
          z-index: 9999;
          font-family: system-ui;
        ">
          ⚠️ AI features are using fallback suggestions. Add VITE_OPENAI_API_KEY to enable personalized AI coaching.
        </div>
      `;
      document.body.appendChild(warningDiv);
    }
  }
  console.warn('⚠️ OpenAI API key not configured. AI features will use fallback suggestions.');
}

// Silently handle missing API key in development - no need to spam console
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Fallback suggestions if AI fails
const FALLBACK_SUGGESTIONS = {
  Confidence: [
    "Practice power poses for 2 minutes before important conversations",
    "Write down 3 achievements from this week and reflect on your capabilities",
    "Challenge yourself to speak up once in a group setting today"
  ],
  'Self-Worth': [
    "List 5 things you appreciate about yourself right now",
    "Practice self-compassion by treating yourself as you would a good friend",
    "Set a boundary that honors your needs and worth"
  ],
  Mindfulness: [
    "Take 10 conscious breaths whenever you feel stressed",
    "Practice mindful eating with your next meal - savor each bite",
    "Do a 5-minute body scan meditation before sleep"
  ],
  Communication: [
    "Practice active listening in your next conversation",
    "Express one feeling or need clearly to someone today",
    "Ask thoughtful questions to deepen a relationship"
  ],
  Resilience: [
    "Identify one lesson learned from a recent challenge",
    "Create a personal mantra for difficult moments",
    "Practice the 5-4-3-2-1 grounding technique when overwhelmed"
  ],
  'Self-Control': [
    "Pause for 10 seconds before responding to triggers",
    "Identify your biggest temptation today and create a strategy to handle it",
    "Practice delayed gratification with one small decision"
  ],
  Discipline: [
    "Complete your most important task first thing tomorrow",
    "Set up your environment to support good habits",
    "Commit to one small daily practice for the next week"
  ],
  Fitness: [
    "Take a 10-minute walk and focus on how movement makes you feel",
    "Try one new healthy recipe this week",
    "Do 5 minutes of stretching before bed"
  ],
  Purpose: [
    "Identify one way your actions today aligned with your values",
    "Write about what gives your life meaning",
    "Take one small step toward a meaningful goal"
  ],
  Humility: [
    "Ask someone for advice in an area where they excel",
    "Practice saying 'I don't know' when you genuinely don't",
    "Acknowledge someone else's contribution to your success"
  ],
  Gratitude: [
    "Write down 3 specific things you're grateful for and why",
    "Send a thank you message to someone who impacted your life",
    "Practice gratitude meditation for 5 minutes"
  ]
};

// Growth area descriptions for AI context
const GROWTH_AREA_CONTEXT = {
  Confidence: "building unshakable self-belief and assertiveness",
  'Self-Worth': "recognizing personal value and cultivating self-love",
  Mindfulness: "staying present, reducing stress, and finding inner peace",
  Communication: "expressing oneself clearly and building stronger connections",
  Resilience: "bouncing back from adversity and handling stress effectively",
  'Self-Control': "mastering impulses and making conscious choices",
  Discipline: "building strong habits and consistently working towards goals",
  Fitness: "improving physical health and boosting energy levels",
  Purpose: "finding meaning and direction in life",
  Humility: "embracing modesty and learning from others",
  Gratitude: "appreciating the good in life and others"
};

// Feature flag for personalized suggestions - disable until database is set up
const PERSONALIZED_SUGGESTIONS_ENABLED = false;

// Helper function to check if personalized suggestions feature is available
const checkPersonalizedSuggestionsAvailable = async (supabase) => {
  // Feature is disabled for now to prevent 406 errors
  if (!PERSONALIZED_SUGGESTIONS_ENABLED) {
    return false;
  }
  
  try {
    // Simple query to check if table exists and is accessible
    const { error } = await supabase
      .from('personalized_suggestions')
      .select('id')
      .limit(0);
    
    return !error;
  } catch (error) {
    return false;
  }
};

export const generatePersonalizedSuggestion = async ({
  reflection,
  growthArea,
  userLevel = 1,
  recentChallenges = [],
  userPreferences = {}
}) => {
  // Return fallback immediately if no API key
  if (!OPENAI_API_KEY) {
    if (import.meta.env.PROD) {
      console.warn('OpenAI API key not found, using fallback suggestions');
    }
    return getFallbackSuggestion(growthArea);
  }

  // Create cache key for this request
  const cacheKey = `ai_suggestion_${btoa(reflection).slice(0, 10)}_${growthArea}_${userLevel}`;
  
  // Check cache first (avoid duplicate AI calls)
  const cachedResult = getCachedData(cacheKey);
  if (cachedResult) {
    return {
      ...cachedResult,
      cached: true
    };
  }

  try {
    const systemPrompt = `You are an AI growth coach specializing in personal development. You help people grow in specific areas through personalized, actionable challenges.

Context about the user:
- Primary growth area: ${growthArea} (${GROWTH_AREA_CONTEXT[growthArea] || 'personal development'})
- Current level: ${userLevel}
- Recent challenges completed: ${recentChallenges.length}

Your task is to analyze their reflection and provide:
1. A short, encouraging motivational message (2-3 sentences)
2. One specific, actionable challenge suggestion tailored to their reflection and growth area

Guidelines:
- Keep suggestions practical and achievable within 1-2 days
- Build on insights from their reflection
- Match their current level (simpler for beginners, more complex for advanced)
- Be encouraging and supportive
- Make challenges specific and measurable when possible
- Focus on ${growthArea} development

Response format (JSON):
{
  "motivationalMessage": "Your encouraging message here",
  "challengeSuggestion": "Your specific challenge suggestion here"
}`;

    const userPrompt = `User's reflection: "${reflection}"

Please provide a personalized motivational message and challenge suggestion based on their reflection and growth area (${growthArea}).`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use the cost-effective model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    const result = {
      success: true,
      motivationalMessage: aiResponse.motivationalMessage || "You're making great progress on your growth journey!",
      challengeSuggestion: aiResponse.challengeSuggestion || getFallbackSuggestion(growthArea).challengeSuggestion,
      source: 'openai'
    };

    // Cache the successful result
    setCachedData(cacheKey, result);

    return result;

  } catch (error) {
    console.error('Error generating AI suggestion:', error);
    
    // Return fallback suggestion
    const fallback = getFallbackSuggestion(growthArea);
    return {
      success: false,
      error: error.message,
      ...fallback,
      source: 'fallback'
    };
  }
};

// Get fallback suggestion when AI is unavailable
export const getFallbackSuggestion = (growthArea) => {
  const suggestions = FALLBACK_SUGGESTIONS[growthArea] || FALLBACK_SUGGESTIONS['Purpose'];
  const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
  
  return {
    motivationalMessage: `Great work on your ${growthArea.toLowerCase()} journey! Every step forward counts and you're building momentum.`,
    challengeSuggestion: randomSuggestion,
    source: 'fallback'
  };
};

// Validate AI response structure
export const validateAIResponse = (response) => {
  return (
    response &&
    typeof response.motivationalMessage === 'string' &&
    typeof response.challengeSuggestion === 'string' &&
    response.motivationalMessage.length > 10 &&
    response.challengeSuggestion.length > 20
  );
};

// Save personalized suggestion to database
export const savePersonalizedSuggestion = async (supabase, {
  userId,
  reflectionId,
  motivationalMessage,
  challengeSuggestion,
  growthArea,
  aiModel = 'gpt-4o-mini'
}) => {
  try {
    // First check if the feature is available
    const isAvailable = await checkPersonalizedSuggestionsAvailable(supabase);
    if (!isAvailable) {
      return { success: false, error: 'Feature not available' };
    }

    const { data, error } = await supabase
      .from('personalized_suggestions')
      .insert({
        user_id: userId,
        reflection_id: reflectionId,
        suggestion_text: challengeSuggestion,
        motivational_message: motivationalMessage,
        growth_area: growthArea,
        ai_model: aiModel,
        is_used: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    // Silently handle table not existing - feature not implemented yet
    if (error?.code === 'PGRST106' || error?.status === 406) {
      return { success: false, error: 'Feature not available' };
    }
    if (!import.meta.env.PROD) console.error('Error saving personalized suggestion:', error);
    return { success: false, error: error.message };
  }
};

// Get active suggestion for user
export const getActiveSuggestion = async (supabase, userId) => {
  try {
    // First check if the feature is available
    const isAvailable = await checkPersonalizedSuggestionsAvailable(supabase);
    if (!isAvailable) {
      return { success: true, data: null };
    }

    const { data, error } = await supabase
      .from('personalized_suggestions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return { success: true, data: data || null };
  } catch (error) {
    // Silently handle table not existing or other DB errors
    if (error?.code === 'PGRST106' || error?.status === 406) {
      return { success: true, data: null };
    }
    if (!import.meta.env.PROD) console.error('Error getting active suggestion:', error);
    return { success: false, error: error.message };
  }
};

// Mark suggestion as used
export const markSuggestionAsUsed = async (supabase, suggestionId) => {
  try {
    // First check if the feature is available
    const isAvailable = await checkPersonalizedSuggestionsAvailable(supabase);
    if (!isAvailable) {
      return { success: false, error: 'Feature not available' };
    }

    const { error } = await supabase
      .from('personalized_suggestions')
      .update({
        is_used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', suggestionId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    // Silently handle table not existing - feature not implemented yet
    if (error?.code === 'PGRST106' || error?.status === 406) {
      return { success: false, error: 'Feature not available' };
    }
    if (!import.meta.env.PROD) console.error('Error marking suggestion as used:', error);
    return { success: false, error: error.message };
  }
}; 