export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

declare global {
  interface ImportMeta {
    env: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
    };
  }
}

export interface Niche {
  id: string;
  userId: string;
  name: string;
  description?: string;
}

export interface Post {
  id: string;
  userId: string;
  image: string;
  caption?: string;
  date?: Date | string;
  type: 'feed' | 'carousel' | 'reels' | 'story';
  status: 'draft' | 'scheduled' | 'posted' | 'rascunho';
  cta?: string;
  hashtags?: string[];
  title?: string;
}

export interface CarouselSlide {
  id: string;
  postId: string;
  imageUrl: string;
  order: number;
}

export interface ScheduleConfig {
  id: string;
  userId: string;
  preferredTimes: string[];
  strategyNotes?: string;
  objectiveQ2?: string;
  objectiveQ3?: string;
  objectiveQ4?: string;
}

export interface Insight {
  id: string;
  userId: string;
  metricName: string; // ex: 'alcance', 'engajamento'
  value: number;
  date: Date;
}
