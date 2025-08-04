import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';

const growthAreas = {
  Confidence: { description: "Build unshakable self-belief and assertiveness.", emoji: "💪" },
  'Self-Worth': { description: "Recognize your value and cultivate self-love.", emoji: "💎" },
  Mindfulness: { description: "Stay present, reduce stress, and find inner peace.", emoji: "🧘" },
  Communication: { description: "Express yourself clearly and build stronger connections.", emoji: "🗣️" },
  Resilience: { description: "Bounce back from adversity and handle stress effectively.", emoji: "⚡" },
  'Self-Control': { description: "Master your impulses and make conscious choices.", emoji: "🎯" },
  Discipline: { description: "Build strong habits and consistently work towards your goals.", emoji: "📚" },
  Fitness: { description: "Improve your physical health and boost your energy levels.", emoji: "🏋️" },
  Purpose: { description: "Find meaning and direction in your life.", emoji: "🌟" },
  Humility: { description: "Embrace modesty and learn from others.", emoji: "🙏" },
  Gratitude: { description: "Appreciate the good in your life and others.", emoji: "🙏" },
};

const questions = [
  {
    id: 1,
    question: "When you're under stress, what do you usually do?",
    options: [
      { text: "Take a few deep breaths and refocus", scores: { Mindfulness: 2 } },
      { text: "Push through and keep going", scores: { Resilience: 2 } },
      { text: "Talk to someone about it", scores: { Communication: 2 } },
      { text: "Plan out what to do next", scores: { Discipline: 2 } },
      { text: "Other", scores: { Purpose: 1, Discipline: 1 }, allowInput: true }
    ]
  },
  {
    id: 2,
    question: "What do you find most challenging?",
    options: [
      { text: "Staying focused on one thing", scores: { Discipline: -2 } },
      { text: "Controlling impulses", scores: { "Self-Control": -2 } },
      { text: "Believing in yourself", scores: { Confidence: -2 } },
      { text: "Feeling good about who you are", scores: { "Self-Worth": -2 } },
      { text: "Other", scores: { Purpose: 1, Discipline: 1 }, allowInput: true }
    ]
  },
  {
    id: 3,
    question: "What makes you feel most proud?",
    options: [
      { text: "Helping someone else succeed", scores: { Gratitude: 2 } },
      { text: "Achieving a personal fitness goal", scores: { Fitness: 2 } },
      { text: "Staying calm in a hard moment", scores: { Mindfulness: 2 } },
      { text: "Speaking up for yourself", scores: { Confidence: 2 } },
      { text: "Other", scores: { Purpose: 1, Discipline: 1 }, allowInput: true }
    ]
  },
  {
    id: 4,
    question: "What motivates you the most?",
    options: [
      { text: "Living a meaningful life", scores: { Purpose: 2 } },
      { text: "Becoming the best version of yourself", scores: { "Self-Worth": 2 } },
      { text: "Appreciating what you have", scores: { Gratitude: 2 } },
      { text: "Learning from challenges", scores: { Resilience: 2 } },
      { text: "Other", scores: { Purpose: 1, Discipline: 1 }, allowInput: true }
    ]
  },
  {
    id: 5,
    question: "How do you usually react when you make a mistake?",
    options: [
      { text: "Forgive yourself quickly", scores: { "Self-Worth": 2 } },
      { text: "Look for the lesson in it", scores: { Resilience: 2 } },
      { text: "Feel embarrassed or doubt yourself", scores: { Confidence: -1, Humility: 1 } },
      { text: "Move on without overthinking", scores: { Discipline: 2 } },
      { text: "Other", scores: { Purpose: 1, Discipline: 1 }, allowInput: true }
    ]
  },
  {
    id: 6,
    question: "In social situations, what feels most like you?",
    options: [
      { text: "Listen more than talk", scores: { Humility: 2 } },
      { text: "Share your thoughts clearly", scores: { Communication: 2 } },
      { text: "Feel nervous about speaking", scores: { Confidence: -2 } },
      { text: "Try to make people feel good", scores: { Gratitude: 2 } },
      { text: "Other", scores: { Purpose: 1, Discipline: 1 }, allowInput: true }
    ]
  },
  {
    id: 7,
    question: "When setting goals, what's your style?",
    options: [
      { text: "Make a clear plan", scores: { Discipline: 2 } },
      { text: "Stay focused until it's done", scores: { "Self-Control": 2 } },
      { text: "Lose interest easily", scores: { Purpose: -2 } },
      { text: "Jump into action without thinking much", scores: { Mindfulness: 1, Discipline: -1 } },
      { text: "Other", scores: { Purpose: 1, Discipline: 1 }, allowInput: true }
    ]
  },
  {
    id: 8,
    question: "What's part of your daily life now?",
    options: [
      { text: "Some kind of exercise or movement", scores: { Fitness: 2 } },
      { text: "Reflection or mindfulness practice", scores: { Mindfulness: 2 } },
      { text: "Doing something kind for someone", scores: { Gratitude: 2 } },
      { text: "Planning or reviewing your day", scores: { Discipline: 2 } },
      { text: "Other", scores: { Purpose: 1, Discipline: 1 }, allowInput: true }
    ]
  },
  {
    id: 9,
    question: "What makes you feel most fulfilled?",
    options: [
      { text: "Helping someone else grow", scores: { Humility: 2 } },
      { text: "Reaching a new personal best", scores: { Confidence: 2 } },
      { text: "Staying calm under pressure", scores: { Mindfulness: 2 } },
      { text: "Sticking to a commitment", scores: { Discipline: 2 } },
      { text: "Other", scores: { Purpose: 1, Discipline: 1 }, allowInput: true }
    ]
  },
  {
    id: 10,
    question: "When you're tempted by something, what happens?",
    options: [
      { text: "Resist and stay on track", scores: { "Self-Control": 2 } },
      { text: "Give in sometimes", scores: { "Self-Control": -1 } },
      { text: "Distract yourself with something positive", scores: { Mindfulness: 2 } },
      { text: "Ask someone for help", scores: { Communication: 1 } },
      { text: "Other", scores: { Purpose: 1, Discipline: 1 }, allowInput: true }
    ]
  }
];

const AssessmentPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [otherText, setOtherText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const { user } = useAuth();
  const { refreshAllData } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  const calculateResultsFromAnswers = (answersObj) => {
    const scores = {
      Mindfulness: 0,
      Resilience: 0,
      Communication: 0,
      Discipline: 0,
      Purpose: 0,
      "Self-Control": 0,
      Confidence: 0,
      "Self-Worth": 0,
      Gratitude: 0,
      Fitness: 0,
      Humility: 0
    };

    // Calculate scores from all answers
    Object.values(answersObj).forEach((answer) => {
      const option = answer.option;
      if (option && option.scores) {
        Object.entries(option.scores).forEach(([category, points]) => {
          scores[category] = (scores[category] || 0) + points;
        });
      }
    });

    // Find areas with LOWEST scores (areas that need improvement)
    // Filter out areas with positive scores and sort by lowest scores first
    const areasNeedingImprovement = Object.entries(scores)
      .filter(([, score]) => score <= 0) // Areas with negative or zero scores need improvement
      .sort(([,a], [,b]) => a - b) // Sort by lowest scores first
      .slice(0, 1); // Take only the TOP area needing improvement

    // If no areas have negative scores, take the 1 lowest scoring area
    const topRecommendation = areasNeedingImprovement.length >= 1 
      ? areasNeedingImprovement[0]
      : Object.entries(scores)
          .sort(([,a], [,b]) => a - b) // Sort by lowest scores first
          .slice(0, 1)[0];

    const result = {
      scores,
      topRecommendation: { category: topRecommendation[0], score: topRecommendation[1] },
      // Don't set primaryGrowthArea here - it should be set by user selection
      allAreas: Object.entries(scores).map(([category, score]) => ({ category, score }))
    };
    
    console.log('Areas needing improvement:', areasNeedingImprovement);
    console.log('Top recommendation:', topRecommendation);
    console.log('Final result:', result);
    
    return result;
  };

  const calculateResults = () => {
    return calculateResultsFromAnswers(answers);
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setOtherText('');
    // Auto-advance to next question after a short delay for all options
    setTimeout(() => {
      handleNextWithOption(option);
    }, 300);
  };

  const handleNextWithOption = (option) => {
    if (!option) return;

    const answer = {
      questionId: questions[currentQuestion].id,
      question: questions[currentQuestion].question,
      option: option,
      otherText: null // No longer using text input for "Other" options
    };

    const newAnswers = {
      ...answers,
      [currentQuestion]: answer
    };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setOtherText('');
    } else {
      // Last question - calculate results using the updated answers
      const calculatedResults = calculateResultsFromAnswers(newAnswers);
      setResults(calculatedResults);
      setShowResults(true);
    }
  };

  const handleNext = () => {
    if (!selectedOption) return;
    handleNextWithOption(selectedOption);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      const prevAnswer = answers[currentQuestion - 1];
      if (prevAnswer) {
        setSelectedOption(prevAnswer.option);
        setOtherText(prevAnswer.otherText || '');
      }
    }
  };

  const handleSelectGrowthArea = async (area) => {
    
    if (!user || !results) {
      console.error('Early return - missing user or results:', { user: !!user, results: !!results });
      toast({
        title: "Error",
        description: "Missing user data or assessment results. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const assessmentData = {
      answers,
      scores: results.scores,
      topRecommendation: results.topRecommendation,
      primaryGrowthArea: area, // Use the user's selection, not the calculated recommendation
      userSelection: area,
    };

    // First check if user has a profile
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileCheckError || !existingProfile) {
      console.error('Profile check error:', profileCheckError);
      console.log('Existing profile:', existingProfile);
      
      // Try to create profile if it doesn't exist
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || 'User',
          has_completed_assessment: false
        });

      if (createError) {
        console.error('Profile creation error:', createError);
        toast({
          title: "Error Creating Profile",
          description: createError.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        assessment_results: assessmentData,
        growth_area: area, // Update the growth_area field with user's selection
        has_completed_assessment: true,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Update error:', error);
      toast({
        title: "Error Saving Assessment",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    } else {
      await refreshAllData();
      toast({
        title: "Let the journey begin! 🎉",
        description: `You've chosen to focus on ${area}.`,
      });
      navigate('/challenge', { replace: true });
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-sun-beige text-charcoal-gray font-lato">
        <div className="container mx-auto px-4 pt-8 pb-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white/50 border-black/10 shadow-lg rounded-2xl max-w-2xl mx-auto">
              <CardHeader className="text-center p-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
                  <CheckCircle className="w-16 h-16 text-forest-green mx-auto mb-4" />
                </motion.div>
                <CardTitle className="font-poppins text-3xl font-bold text-forest-green mb-2">
                  Your Growth Profile
                </CardTitle>
                <CardDescription className="text-lg text-charcoal-gray/80">
                  Based on your responses, here are your top growth areas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-semibold text-charcoal-gray mb-4">Your Recommended Focus Area</h3>
                    <div className="bg-gradient-to-r from-forest-green/10 to-leaf-green/10 border-2 border-forest-green/30 rounded-2xl p-8 mb-6">
                      <div className="text-6xl mb-4">{growthAreas[results.topRecommendation.category]?.emoji}</div>
                      <h4 className="text-3xl font-bold text-forest-green mb-3">{results.topRecommendation.category}</h4>
                      <p className="text-lg text-charcoal-gray/80 mb-6">
                        {growthAreas[results.topRecommendation.category]?.description}
                      </p>
                      <Button
                        onClick={() => {
                          console.log('Main button clicked for:', results.topRecommendation.category);
                          handleSelectGrowthArea(results.topRecommendation.category);
                        }}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-forest-green to-leaf-green text-white font-bold py-4 px-8 text-lg rounded-xl min-h-[60px] touch-manipulation"
                      >
                        Continue with {results.topRecommendation.category}
                      </Button>
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-charcoal-gray mb-4">Or Choose a Different Focus Area</h3>
                    <p className="text-charcoal-gray/70 mb-6">Want to focus on something else? Select any area below:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(growthAreas)
                        .filter(([area]) => area !== results.topRecommendation.category) // Exclude the recommended area
                        .map(([area, { emoji, description }]) => (
                        <Card
                          key={area}
                          onClick={() => {
                            console.log('Card clicked for area:', area);
                            handleSelectGrowthArea(area);
                          }}
                          className="bg-white/40 border-black/10 hover:border-warm-orange hover:bg-white/80 cursor-pointer transition-all duration-300 p-4"
                        >
                          <div className="text-center">
                            <div className="text-3xl mb-2">{emoji}</div>
                            <h4 className="font-bold text-forest-green text-sm mb-1">{area}</h4>
                            <p className="text-xs text-charcoal-gray/70 leading-tight">{description}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="text-center p-6 bg-warm-orange/10 rounded-lg">
                    <p className="text-charcoal-gray font-medium">
                      🌟 Remember: Growth happens one small step at a time. You're about to embark on a journey of positive change!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sun-beige text-charcoal-gray font-lato">
      <div className="container mx-auto px-4 pt-8 pb-24">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button onClick={() => navigate('/challenge')} variant="ghost" className="mb-6 text-charcoal-gray">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8">
              <Progress value={progress} className="h-3 mb-4" />
              <p className="text-center text-charcoal-gray/70">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/50 border-black/10 shadow-lg rounded-2xl">
                  <CardHeader className="p-8">
                    <CardTitle className="font-poppins text-2xl font-bold text-forest-green">
                      {currentQ.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <div className="space-y-4">
                      {currentQ.options.map((option, index) => (
                        <Button
                          key={index}
                          onClick={() => handleOptionSelect(option)}
                          variant={selectedOption === option ? "default" : "outline"}
                          className={`w-full text-left justify-start p-6 h-auto min-h-[60px] touch-manipulation transition-all duration-200 ${
                            selectedOption === option
                              ? "bg-forest-green text-white"
                              : "bg-white/80 text-charcoal-gray hover:bg-leaf-green/20 hover:text-charcoal-gray border-charcoal-gray/20"
                          }`}
                        >
                          <span className="text-base leading-relaxed">{option.text}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;