import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, Users, ThumbsUp, MessageSquare, ChevronsUpDown } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const CATEGORY_LIST = [
  'Mindfulness',
  'Self-Control',
  'Discipline',
  'Confidence',
  'Self-Worth',
  'Resilience',
  'Fitness',
  'Communication',
  'Purpose',
  'Humility',
  'Gratitude',
];

const CommunityFilters = ({ view, setView, filter, setFilter }) => {
  const [categories, setCategories] = useState(['all', ...CATEGORY_LIST]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Remove the useEffect that fetches categories from Supabase

  return (
    <div className="sticky top-16 md:top-0 bg-sun-beige/80 backdrop-blur-sm py-4 z-10 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Button variant={view === 'all-posts' ? 'default' : 'outline'} onClick={() => setView('all-posts')} className={`flex-1 ${view === 'all-posts' ? 'bg-forest-green text-white' : ''}`}>
            <Users className="w-4 h-4 mr-2"/>All Posts
          </Button>
          <Button variant={view === 'liked-posts' ? 'default' : 'outline'} onClick={() => setView('liked-posts')} className={`flex-1 ${view === 'liked-posts' ? 'bg-forest-green text-white' : ''}`}>
            <ThumbsUp className="w-4 h-4 mr-2"/>Liked
          </Button>
          <Button variant={view === 'my-comments' ? 'default' : 'outline'} onClick={() => setView('my-comments')} className={`flex-1 ${view === 'my-comments' ? 'bg-forest-green text-white' : ''}`}>
            <MessageSquare className="w-4 h-4 mr-2"/>My Comments
          </Button>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              <span>Filter: <span className="font-semibold capitalize">{filter.replace('-', ' ')}</span></span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            {loadingCategories ? (
              <div className="p-2 text-sm text-charcoal-gray/60">Loading...</div>
            ) : (
              categories.map((cat) => (
                <div key={cat} onClick={() => setFilter(cat)} className="text-sm p-2 hover:bg-accent cursor-pointer rounded-md capitalize">
                  {cat.replace('-', ' ')}
                </div>
              ))
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default CommunityFilters;