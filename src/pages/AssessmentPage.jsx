import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, Sparkles, CheckCircle, BrainCircuit, Wind, MessageSquare, Shield, Target, Dumbbell, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useData } from '@/contexts/DataContext';

const growthAreas = {
  Confidence: { icon: <BrainCircuit />, description: "Build unshakable self-belief and assertiveness.", color: "text-blue-500", emoji: "💪" },
  'Self-Worth': { icon: "💎", description: "Recognize your value and cultivate self-love.", color: "text-pink-500", emoji: "💎" },
  Mindfulness: { icon: <Wind />, description: "Stay present, reduce stress, and find inner peace.", color: "text-teal-500", emoji: "🧘" },
  Communication: { icon: <MessageSquare />, description: "Express yourself clearly and build stronger connections.", color: "text-purple-500", emoji: "🗣️" },
  Resilience: { icon: <Shield />, description: "Bounce back from adversity and handle stress effectively.", color: "text-orange-500", emoji: "⚡" },
  'Self-Control': { icon: <Target />, description: "Master your impulses and make conscious choices.", color: "text-indigo-500", emoji: "🎯" },
  Discipline: { icon: <BookOpen />, description: "Build strong habits and consistently work towards your goals.", color: "text-yellow-500", emoji: "📚" },
  Fitness: { icon: <Dumbbell />, description: "Improve your physical health and boost your energy levels.", color: "text-red-500", emoji: "🏋️" },
  Purpose: { icon: <Sparkles />, description: "Find meaning and direction in your life.", color: "text-green-500", emoji: "🌟" },
  Humility: { icon: <ChevronLeft />, description: "Embrace modesty and learn from others.", color: "text-gray-500", emoji: "🙏" },
  Gratitude: { icon: <CheckCircle />, description: "Appreciate the good in your life and others.", color: "text-warm-orange", emoji: "🙏" },
};

const questions = [
  {
    question: "When you feel stressed, you usually...",
    options: [
      { text: "Take a few deep breaths to reset", weights: { Mindfulness: 2 } },
      { text: "Push through and keep working", weights: { Discipline: 2 } },
      { text: "Talk it out with someone you trust", weights: { Communication: 2 } },
      { text: "Remind yourself of your strengths", weights: { Confidence: 2 } },
    ],
  },
  {
    question: "You find it hardest to...",
    options: [
      { text: "Stay present in the moment", weights: { Mindfulness: -2 } },
      { text: "Resist temptations", weights: { 'Self-Control': -2 } },
      { text: "Stick to routines", weights: { Discipline: -2 } },
      { text: "Believe in yourself", weights: { Confidence: -2 } },
    ],
  },
  {
    question: "You feel most proud when you...",
    options: [
      { text: "Help someone in a meaningful way", weights: { Gratitude: 2, Humility: 1 } },
      { text: "Crush a personal fitness goal", weights: { Fitness: 2 } },
      { text: "Bounce back from a tough experience", weights: { Resilience: 2 } },
      { text: "Speak up for yourself", weights: { Confidence: 1, Communication: 1 } },
    ],
  },
  {
    question: "Your biggest motivation is...",
    options: [
      { text: "Finding purpose in your actions", weights: { Purpose: 2 } },
      { text: "Becoming the best version of yourself", weights: { 'Self-Worth': 2 } },
      { text: "Appreciating what you have", weights: { Gratitude: 2 } },
      { text: "Learning from your mistakes", weights: { Resilience: 2 } },
    ],
  },
  {
    question: "When you make a mistake, you tend to...",
    options: [
      { text: "Forgive yourself and grow", weights: { 'Self-Worth': 2 } },
      { text: "Reflect and try again", weights: { Resilience: 2 } },
      { text: "Feel unsure or down on yourself", weights: { Confidence: -1, Humility: 1 } },
      { text: "Move on quickly and refocus", weights: { Discipline: 1 } },
    ],
  },
  {
    question: "In social situations, you usually...",
    options: [
      { text: "Listen more than you speak", weights: { Humility: 2 } },
      { text: "Share your thoughts clearly", weights: { Communication: 2 } },
      { text: "Feel nervous or hold back", weights: { Confidence: -2 } },
      { text: "Try to make others feel seen", weights: { Gratitude: 1, Communication: 1 } },
    ],
  },
  {
    question: "When you set a goal, you usually...",
    options: [
      { text: "Make a step-by-step plan", weights: { Discipline: 2 } },
      { text: "Get easily distracted", weights: { 'Self-Control': -2 } },
      { text: "Stick with it to the end", weights: { 'Self-Control': 2 } },
      { text: "Lose interest partway through", weights: { Purpose: -2 } },
    ],
  },
  {
    question: "Your daily routine often includes...",
    options: [
      { text: "Movement or exercise", weights: { Fitness: 2 } },
      { text: "Reflection or journaling", weights: { Mindfulness: 2 } },
      { text: "Small acts of kindness", weights: { Gratitude: 2 } },
      { text: "Setting clear intentions", weights: { Purpose: 1 } },
    ],
  },
  {
    question: "You feel most fulfilled when you...",
    options: [
      { text: "Help someone else succeed", weights: { Humility: 2, Gratitude: 1 } },
      { text: "Reach a new personal best", weights: { Fitness: 1, Confidence: 1 } },
      { text: "Stay calm in chaos", weights: { Resilience: 2, Mindfulness: 1 } },
      { text: "Follow through on a commitment", weights: { Discipline: 2 } },
    ],
  },
  {
    question: "When faced with temptation, you...",
    options: [
      { text: "Resist and choose what’s right", weights: { 'Self-Control': 2 } },
      { text: "Sometimes give in and reflect later", weights: { 'Self-Control': -1 } },
      { text: "Redirect your attention", weights: { Mindfulness: 1 } },
      { text: "Ask for help or encouragement", weights: { Communication: 1 } },
    ],
  },
  {
    question: "You define success as...",
    options: [
      { text: "Living with purpose", weights: { Purpose: 2 } },
      { text: "Being thankful for what you have", weights: { Gratitude: 2 } },
      { text: "Growing through challenges", weights: { Resilience: 2 } },
      { text: "Staying true to yourself", weights: { 'Self-Worth': 2 } },
    ],
  },
];

const AssessmentPage = () => {
  const [step, setStep] = useState('quiz'); // 'quiz' or 'results'
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshAllData } = useData();
  const isNavigatingManually = useRef(false);

  const handleAnswer = (weights) => {
    isNavigatingManually.current = false;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = weights;
    setAnswers(newAnswers);
  };

  useEffect(() => {
    if (answers[currentQuestion] !== undefined && !isNavigatingManually.current) {
      const timer = setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
        } else {
          calculateResults();
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [answers, currentQuestion]);

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      isNavigatingManually.current = true;
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = () => {
    const scores = Object.keys(growthAreas).reduce((acc, area) => ({ ...acc, [area]: 0 }), {});
    answers.forEach(answerWeights => {
      for (const area in answerWeights) {
        scores[area] += answerWeights[area];
      }
    });

    const sortedAreas = Object.entries(scores).sort(([, a], [, b]) => a - b);
    setResults({
      topPick: sortedAreas[0][0],
      otherSuggestions: [sortedAreas[1][0], sortedAreas[2][0]],
    });
    setStep('results');
  };

  const handleSelectGrowthArea = async (area) => {
    if (!user) return;

    const assessmentData = {
      answers,
      aiRecommendation: results.topPick,
      userSelection: area,
    };

    const { error } = await supabase
      .from('profiles')
      .update({
        assessment_results: assessmentData,
        has_completed_assessment: true,
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Error Saving Assessment",
        description: error.message,
        variant: "destructive",
      });
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-sun-beige">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-leaf-green/10 via-warm-orange/10 to-forest-green/10"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      <div className="w-full max-w-4xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {step === 'quiz' && (
            <motion.div key="quiz">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <div className="flex items-center justify-center gap-3 mb-4 text-4xl">
                  <span role="img" aria-label="sparkles">✨</span>
                  <h1 className="font-bold gradient-text">Growth Assessment</h1>
                </div>
                <p className="text-charcoal-gray/80 text-lg">Let's find your focus area!</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-charcoal-gray/60">Question {currentQuestion + 1} of {questions.length}</span>
                  <span className="text-sm text-charcoal-gray/60">{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2 bg-forest-green/20 [&>div]:bg-forest-green" />
              </motion.div>

              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/50 border-black/10 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-3xl text-forest-green text-center">
                      <span className="mr-4 text-4xl">{currentQ.emoji}</span>{currentQ.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentQ.options.map((option, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleAnswer(option.weights)}
                          className={`p-6 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 ${
                            answers[currentQuestion] === option.weights
                              ? 'border-leaf-green bg-leaf-green/20 shadow-lg shadow-leaf-green/25'
                              : 'border-black/10 bg-white/30 hover:border-black/20 hover:bg-white/50'
                          }`}
                        >
                          <span className="text-lg text-charcoal-gray font-medium">{option.text}</span>
                        </motion.button>
                      ))}
                    </div>
                    <div className="flex justify-start pt-6">
                      <Button
                        onClick={prevQuestion}
                        disabled={currentQuestion === 0}
                        variant="outline"
                        className="bg-white/50 border-black/10 text-charcoal-gray hover:bg-white/80 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {step === 'results' && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-4 text-4xl">
                 <span role="img" aria-label="plant">🌱</span>
                <h1 className="font-bold gradient-text">Your Growth Plan</h1>
              </div>
              <p className="text-charcoal-gray/80 text-lg mb-8">Based on your answers, here's what we recommend.</p>

              <Card className="bg-white/50 border-2 border-leaf-green shadow-2xl shadow-leaf-green/20 mb-8">
                <CardHeader>
                  <CardDescription className="text-leaf-green font-semibold">OUR TOP RECOMMENDATION</CardDescription>
                  <CardTitle className={`text-4xl flex items-center justify-center gap-3 font-bold ${growthAreas[results.topPick].color}`}>
                    <span className="text-5xl">{growthAreas[results.topPick].emoji}</span>
                    {results.topPick}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-charcoal-gray/90 mb-6 text-lg">{growthAreas[results.topPick].description}</p>
                  <Button onClick={() => handleSelectGrowthArea(results.topPick)} size="lg" className="bg-gradient-to-r from-leaf-green to-forest-green text-white">
                    <CheckCircle className="w-5 h-5 mr-2" /> Start with {results.topPick}
                  </Button>
                </CardContent>
              </Card>

              <h2 className="text-2xl font-bold text-forest-green mb-4">Or, Choose Another Path</h2>
              <p className="text-charcoal-gray/80 mb-6">Your journey is your own. Select any area to begin.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(growthAreas).map(([area, { emoji, color, description }]) => (
                  <Card
                    key={area}
                    onClick={() => handleSelectGrowthArea(area)}
                    className="bg-white/40 border-black/10 hover:border-warm-orange hover:bg-white/80 cursor-pointer transition-all duration-300 flex flex-col text-center p-4 items-center justify-center"
                  >
                    <div className={`text-4xl ${color}`}>{emoji}</div>
                    <h3 className="font-bold text-forest-green mt-2">{area}</h3>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AssessmentPage;