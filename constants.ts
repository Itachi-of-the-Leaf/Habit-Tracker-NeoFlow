
import { Habit, History, UserStats } from './types';

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'h1',
    name: 'Morning Hydration',
    category: 'Health',
    frequency: [0, 1, 2, 3, 4, 5, 6],
    color: '#06b6d4', // Cyan
    targetStreak: 21,
    energyReq: 'Very Easy',
  },
  {
    id: 'h2',
    name: 'Deep Work Session',
    category: 'Work',
    frequency: [1, 2, 3, 4, 5], // Mon-Fri
    color: '#8b5cf6', // Violet
    targetStreak: 21,
    energyReq: 'Hard',
  },
  {
    id: 'h3',
    name: 'Meditation',
    category: 'Mind',
    frequency: [0, 1, 2, 3, 4, 5, 6],
    color: '#f43f5e', // Rose
    targetStreak: 21,
    energyReq: 'Medium',
  },
];

export const INITIAL_STATS: UserStats = {
  xp: 0,
  level: 1,
  totalCompleted: 0,
  longestStreak: 0,
};

export const MOTIVATIONAL_QUOTES = [
  "Consistency is the code to success.",
  "Your future is defined by what you do today.",
  "Don't break the chain.",
  "Small steps lead to big changes.",
  "Momentum is your best friend.",
  "Focus on the process, not the outcome.",
  "Discipline is freedom.",
  "Excellence is a habit, not an act.",
  "One habit at a time.",
  "The best time to start was yesterday. The next best time is now."
];

// Generate some fake history for the past 10 days to solve Cold Start
export const generateMockHistory = (): History => {
  const history: History = {};
  const today = new Date();
  // Generate a little bit of random history for the generic habits so it looks alive
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Random completion
    history[dateStr] = {
      'h1': Math.random() > 0.4,
      'h2': Math.random() > 0.5,
      'h3': Math.random() > 0.6,
    };
  }
  return history;
};
