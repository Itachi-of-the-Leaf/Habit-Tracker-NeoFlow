
export type Category = 'Health' | 'Work' | 'Mind' | 'Social' | 'Skill';

// Module A: Energy Logic
export type EnergyReq = 'Very Easy' | 'Easy' | 'Medium' | 'Hard';
export type EnergyState = 'Critical' | 'Tired' | 'Normal' | 'Energized';

// Module B: Strategy Vault
export type ResourceType = 'PDF' | 'URL' | 'Video' | 'Text' | 'Note';

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  url?: string;     // For Links, PDFs hosted online, or file paths
  content?: string; // For .txt files or pasted notes
  associatedHabitId?: string; // Optional link to a specific habit
  metadata?: string; // e.g., "Page 154"
  createdAt: number;
}

// Module C: Wins Journal
export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  victory: string; // The "Win"
  tags: string[];
  energyLevelSnapshot: EnergyState; // Context of the win
}

// Module D: Calendar Architecture
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  isBlocked: boolean; // If true, renders as a greyed-out block on grid
}

export interface Habit {
  id: string;
  name: string;
  category: Category;
  frequency: number[]; // 0 = Sunday, 1 = Monday, etc.
  color: string;
  targetStreak: number;
  iconImage?: string; 
  energyReq: EnergyReq; // New Field for Module A
}

export interface DayLog {
  [habitId: string]: boolean; // true if completed
}

export interface History {
  [dateString: string]: DayLog; // Format: YYYY-MM-DD
}

export interface MissedLogData {
  [dateString: string]: {
    [habitId: string]: string; // The reason
  };
}

export interface UserStats {
  xp: number;
  level: number;
  totalCompleted: number;
  longestStreak: number;
}

export interface MissedLogEntry {
  date: string;
  habitId: string;
  reason: string;
}
