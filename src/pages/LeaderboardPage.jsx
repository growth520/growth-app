import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Trophy, 
  Flame, 
  Target, 
  Users,
  Crown,
  TrendingUp,
  Award,
  Star
} from 'lucide-react';
import Leaderboard from '@/components/gamification/Leaderboard';
import { useData } from '@/contexts/DataContext';

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { progress } = useData();
  const [selectedTab, setSelectedTab] = useState('overall');

  const tabs = [
    {
      key: 'overall',
      label: 'Overall Rankings',
      description: 'See the top performers across all metrics',
      icon: Trophy
    },
    {
      key: 'xp',
      label: 'XP Leaders',
      description: 'Users with the highest experience points',
      icon: Crown
    },
    {
      key: 'challenges',
      label: 'Challenge Masters',
      description: 'Most challenges completed',
      icon: Target
    },
    {
      key: 'streaks',
      label: 'Streak Champions',
      description: 'Longest current streaks',
      icon: Flame
    }
  ];

  const currentTab = tabs.find(tab => tab.key === selectedTab);

  return (
    <div className="min-h-screen p-4 bg-sun-beige pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-forest-green hover:bg-forest-green/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-forest-green">Leaderboard</h1>
            <p className="text-gray-600">See how you rank among the growth community</p>
          </div>
        </div>

        {/* Quick Stats */}
        {progress && (
          <Card className="bg-gradient-to-r from-forest-green to-leaf-green text-white">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{progress.level || 1}</div>
                  <div className="text-sm opacity-90">Your Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{progress.xp || 0}</div>
                  <div className="text-sm opacity-90">Total XP</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{progress.streak || 0}</div>
                  <div className="text-sm opacity-90">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {progress.completed_challenges_count || 0}
                  </div>
                  <div className="text-sm opacity-90">Challenges</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {currentTab && <currentTab.icon className="w-5 h-5" />}
                  {currentTab?.label || 'Rankings'}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {currentTab?.description}
                </p>
              </div>
            </div>
            
            {/* Tab Buttons */}
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.key}
                    variant={selectedTab === tab.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTab(tab.key)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent>
            {/* Overall Rankings Tab */}
            {selectedTab === 'overall' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      XP Leaders
                    </h3>
                    <Leaderboard 
                      title=""
                      maxUsers={5}
                      showPagination={false}
                      showUserRank={false}
                      defaultRankBy="xp"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      Challenge Masters
                    </h3>
                    <Leaderboard 
                      title=""
                      maxUsers={5}
                      showPagination={false}
                      showUserRank={false}
                      defaultRankBy="challenges"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      Streak Champions
                    </h3>
                    <Leaderboard 
                      title=""
                      maxUsers={5}
                      showPagination={false}
                      showUserRank={false}
                      defaultRankBy="streak"
                    />
                  </div>
                </div>

                {/* Recent Activity */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Growth Community Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          <Users className="w-8 h-8 mx-auto mb-2" />
                        </div>
                        <div className="text-sm font-medium">Active Members</div>
                        <div className="text-xs text-gray-600">Growing daily</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          <Target className="w-8 h-8 mx-auto mb-2" />
                        </div>
                        <div className="text-sm font-medium">Challenges</div>
                        <div className="text-xs text-gray-600">Completed today</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">
                          <Flame className="w-8 h-8 mx-auto mb-2" />
                        </div>
                        <div className="text-sm font-medium">Active Streaks</div>
                        <div className="text-xs text-gray-600">Burning bright</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">
                          <Award className="w-8 h-8 mx-auto mb-2" />
                        </div>
                        <div className="text-sm font-medium">Badges</div>
                        <div className="text-xs text-gray-600">Earned this week</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Individual Leaderboards */}
            {selectedTab !== 'overall' && (
              <Leaderboard 
                title=""
                maxUsers={20}
                showPagination={true}
                showUserRank={true}
                defaultRankBy={selectedTab === 'streaks' ? 'streak' : selectedTab}
              />
            )}
          </CardContent>
        </Card>

        {/* Achievement Motivation */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Keep Climbing the Leaderboard!
            </h3>
            <p className="text-gray-600 mb-4">
              Complete challenges, maintain your streak, and level up to rise in the rankings.
              Every step of growth matters!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="border-yellow-400 text-yellow-700">
                💪 Complete Daily Challenges
              </Badge>
              <Badge variant="outline" className="border-orange-400 text-orange-700">
                🔥 Maintain Your Streak
              </Badge>
              <Badge variant="outline" className="border-green-400 text-green-700">
                📈 Level Up
              </Badge>
              <Badge variant="outline" className="border-blue-400 text-blue-700">
                🎯 Join Challenge Packs
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaderboardPage; 