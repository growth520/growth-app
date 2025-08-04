import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Smile,
  Filter
} from 'lucide-react';

const CommunityFilters = ({
  activeFilter,
  onFilterChange,
  selectedGrowthArea,
  onGrowthAreaChange,
  activeTab,
  onTabChange
}) => {
  const filterOptions = [
    { id: 'trending', label: 'Trending', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'new', label: 'New', icon: <Clock className="h-4 w-4" /> },
    { id: 'growth-like-me', label: 'Growth Like Me', icon: <Target className="h-4 w-4" /> },
    { id: 'most-uplifting', label: 'Most Uplifting', icon: <Smile className="h-4 w-4" /> }
  ];

  const tabOptions = [
    { id: 'all', label: 'All Posts' },
    { id: 'my-posts', label: 'My Posts' },
    { id: 'liked', label: 'Liked' },
    { id: 'commented', label: 'Commented' },
    { id: 'friends', label: 'Friends' }
  ];

  const growthAreas = [
    'Self-Control',
    'Patience', 
    'Kindness',
    'Humility',
    'Gratitude',
    'Generosity',
    'Honesty',
    'Forgiveness',
    'Compassion',
    'Perseverance'
  ];

  return (
    <div className="space-y-3">
      {/* Filter Tabs */}
      <div className="flex space-x-1">
        {tabOptions.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className="flex items-center space-x-2"
          >
            <span>{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Horizontal Filter Bar */}
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
        {filterOptions.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            className="whitespace-nowrap flex items-center space-x-1"
          >
            {filter.icon}
            <span>{filter.label}</span>
          </Button>
        ))}
      </div>

      {/* Growth Area Dropdown */}
      <div className="flex items-center space-x-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <Select value={selectedGrowthArea} onValueChange={onGrowthAreaChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Growth Areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Growth Areas</SelectItem>
            {growthAreas.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CommunityFilters;