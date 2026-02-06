
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, Share2, Shield, Activity, Calendar as CalendarIcon, Trophy, SlidersHorizontal, ArrowDownUp, LogOut, User, Power, Home, Database, Terminal } from 'lucide-react';
import { format, isSameDay, addDays } from 'date-fns';
import HabitGrid, { ViewMode } from './components/HabitGrid';
import { DailyProgressChart, CategoryRadar } from './components/Charts';
import Confetti from './components/Confetti';
import MissedLog from './components/MissedLog';
import HabitStudio from './components/HabitStudio';
import EnergySelector from './components/EnergySelector';
import StrategyVault from './components/StrategyVault';
import { WinModal, JournalFeed } from './components/WinsJournal';
import { INITIAL_HABITS, INITIAL_STATS, MOTIVATIONAL_QUOTES, generateMockHistory } from './constants';
import { Habit, History, UserStats, MissedLogData, EnergyState, Resource, JournalEntry, EnergyReq, DayLog } from './types';

type SortOption = 'default' | 'name' | 'category' | 'streak' | 'energy';

// --- Login Component ---
const LoginScreen: React.FC<{ onLogin: (username: string) => void }> = ({ onLogin }) => {
  const [inputName, setInputName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      onLogin(inputName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-cyber-darker flex flex-col items-center justify-center p-4 text-cyber-text font-sans relative overflow-hidden">
       {/* Background Effects */}
       <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyber-primary/10 blur-[100px] rounded-full animate-pulse-fast"></div>
       <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyber-secondary/10 blur-[100px] rounded-full animate-pulse-fast"></div>

       <div className="bg-cyber-panel border border-slate-700 p-8 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] max-w-md w-full relative z-10">
          <div className="flex flex-col items-center mb-8">
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyber-primary to-blue-600 flex items-center justify-center shadow-[0_0_20px_#06b6d4] mb-4">
                <Activity className="text-white w-8 h-8" />
             </div>
             <h1 className="text-3xl font-black text-white tracking-tight">NeoFlow</h1>
             <p className="text-slate-400 text-sm mt-2">Initialize Habit Tracking Sequence</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Identify User</label>
               <div className="relative">
                 <User className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                 <input 
                    type="text" 
                    placeholder="Enter Codename..." 
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-cyber-primary focus:border-transparent outline-none transition-all font-mono"
                    autoFocus
                 />
               </div>
             </div>

             <button 
                type="submit"
                disabled={!inputName.trim()}
                className="w-full bg-cyber-primary hover:bg-cyan-400 text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
             >
                <Power size={18} strokeWidth={3} />
                INITIALIZE SYSTEM
             </button>
          </form>
       </div>
       
       <p className="mt-8 text-xs text-slate-600 font-mono">SECURE CONNECTION ESTABLISHED v2.0</p>
    </div>
  );
};

// --- Main Dashboard Component ---
interface DashboardProps {
  username: string;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ username, onLogout }) => {
  // Storage Keys based on Username
  const KEYS = useMemo(() => ({
     habits: `neonflow_${username}_habits`,
     history: `neonflow_${username}_history`,
     stats: `neonflow_${username}_stats`,
     missed: `neonflow_${username}_missed`,
     resources: `neonflow_${username}_resources`, // Module B
     journal: `neonflow_${username}_journal`,     // Module C
  }), [username]);

  // --- Safe Local Storage Loaders ---
  const loadInitialHabits = (): Habit[] => {
    try {
      const saved = localStorage.getItem(KEYS.habits);
      let loaded = saved ? JSON.parse(saved) : INITIAL_HABITS;
      // Migration: Update old 'Low', 'High' values to new system
      return loaded.map((h: any) => {
          let req = h.energyReq || 'Medium';
          // Migration logic
          if (req === 'Low') req = 'Easy';
          if (req === 'High') req = 'Hard';
          return { ...h, energyReq: req };
      });
    } catch (e) {
      console.error("Failed to load habits", e);
      return INITIAL_HABITS;
    }
  };

  const loadInitialHistory = (): History => {
    try {
      const saved = localStorage.getItem(KEYS.history);
      return saved ? JSON.parse(saved) : generateMockHistory();
    } catch (e) {
      console.error("Failed to load history", e);
      return generateMockHistory();
    }
  };

  const loadInitialMissed = (): MissedLogData => {
    try {
      const saved = localStorage.getItem(KEYS.missed);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  };

  const loadInitialStats = (): UserStats => {
    try {
      const saved = localStorage.getItem(KEYS.stats);
      return saved ? JSON.parse(saved) : INITIAL_STATS;
    } catch (e) {
      return INITIAL_STATS;
    }
  };

  const loadInitialResources = (): Resource[] => {
      try {
          const saved = localStorage.getItem(KEYS.resources);
          return saved ? JSON.parse(saved) : [];
      } catch { return []; }
  };

  const loadInitialJournal = (): JournalEntry[] => {
      try {
          const saved = localStorage.getItem(KEYS.journal);
          return saved ? JSON.parse(saved) : [];
      } catch { return []; }
  };

  // --- State ---
  const [habits, setHabits] = useState<Habit[]>(loadInitialHabits);
  const [history, setHistory] = useState<History>(loadInitialHistory);
  const [missedLogs, setMissedLogs] = useState<MissedLogData>(loadInitialMissed);
  const [stats, setStats] = useState<UserStats>(loadInitialStats);
  
  // New State for Modules
  const [energyState, setEnergyState] = useState<EnergyState>('Normal'); // Module A
  const [resources, setResources] = useState<Resource[]>(loadInitialResources); // Module B
  const [journal, setJournal] = useState<JournalEntry[]>(loadInitialJournal); // Module C

  const [quote] = useState(() => {
    return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'settings' | 'vault' | 'journal'>('dashboard');
  const [showConfetti, setShowConfetti] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [isMissedModalOpen, setIsMissedModalOpen] = useState(false);
  const [isHabitStudioOpen, setIsHabitStudioOpen] = useState(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState(false);
  
  // View Controls
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [viewDateStr, setViewDateStr] = useState<string>(todayStr);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem(KEYS.habits, JSON.stringify(habits));
    localStorage.setItem(KEYS.history, JSON.stringify(history));
    localStorage.setItem(KEYS.stats, JSON.stringify(stats));
    localStorage.setItem(KEYS.missed, JSON.stringify(missedLogs));
    localStorage.setItem(KEYS.resources, JSON.stringify(resources));
    localStorage.setItem(KEYS.journal, JSON.stringify(journal));
  }, [habits, history, stats, missedLogs, resources, journal, KEYS]);

  // --- Logic ---

  const showToast = (msg: string) => {
      setNotification(msg);
      setTimeout(() => setNotification(null), 3000);
  };

  const calculateStreak = useCallback((habitId: string) => {
    let streak = 0;
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterday = addDays(today, -1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    let currentDate: Date = new Date(today);

    if (history[todayStr]?.[habitId]) {
    } else if (history[yesterdayStr]?.[habitId]) {
        currentDate = yesterday;
    } else {
        return 0;
    }

    while (true) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        if (history[dateStr]?.[habitId]) {
            streak++;
            currentDate = addDays(currentDate, -1);
        } else {
            break;
        }
    }
    return streak;
  }, [history]);

  const streakMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!habits) return map; // Safety check
    habits.forEach(h => {
        map[h.id] = calculateStreak(h.id);
    });
    return map;
  }, [habits, calculateStreak]);

  const maxStreak = useMemo(() => {
      if (!streakMap || Object.keys(streakMap).length === 0) return 0;
      return Math.max(...Object.values(streakMap));
  }, [streakMap]);

  const trophyColorClass = useMemo(() => {
    if (maxStreak >= 66) return 'text-fuchsia-400 drop-shadow-[0_0_15px_rgba(192,38,211,1)]';
    if (maxStreak >= 21) return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]';
    if (maxStreak >= 7) return 'text-slate-300 drop-shadow-[0_0_8px_rgba(200,200,200,0.8)]';
    return 'text-slate-700';
  }, [maxStreak]);

  // --- Module A: Smart Filtering Logic (Refined) ---
  const filteredHabits = useMemo(() => {
      if (!habits) return [];
      switch (energyState) {
          case 'Critical':
              // Show ONLY 'Very Easy'
              return habits.filter(h => h.energyReq === 'Very Easy');
          case 'Tired':
              // Show 'Easy' AND 'Very Easy'
              return habits.filter(h => h.energyReq === 'Easy' || h.energyReq === 'Very Easy');
          case 'Normal':
              // Show ALL tasks
              return habits;
          case 'Energized':
              // Show ALL tasks
              return habits;
          default:
              return habits;
      }
  }, [habits, energyState]);

  const sortedHabits = useMemo(() => {
    let sorted = [...filteredHabits];
    
    // Logic for Energized State: Sort by Difficulty (Hardest -> Very Easy)
    if (energyState === 'Energized' && sortOption === 'default') {
        return sorted.sort((a, b) => {
            const score: Record<string, number> = { 'Hard': 4, 'Medium': 3, 'Easy': 2, 'Very Easy': 1 };
            return (score[b.energyReq] || 0) - (score[a.energyReq] || 0);
        });
    }

    // Logic for Normal State: Uses 'default' case below which preserves array order (Drag/User Defined)

    switch (sortOption) {
        case 'name':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'category':
            return sorted.sort((a, b) => a.category.localeCompare(b.category));
        case 'streak':
            return sorted.sort((a, b) => (streakMap[b.id] || 0) - (streakMap[a.id] || 0));
        case 'energy':
            return sorted.sort((a, b) => {
                 const score: Record<string, number> = { 'Hard': 4, 'Medium': 3, 'Easy': 2, 'Very Easy': 1 };
                 return (score[b.energyReq] || 0) - (score[a.energyReq] || 0);
            });
        default:
            return sorted;
    }
  }, [filteredHabits, sortOption, streakMap, energyState]);

  // --- Actions ---

  const updateHabit = (updatedHabit: Habit) => {
    setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
    showToast("Protocol updated.");
  };

  const addHabit = (newHabit: Habit) => {
    setHabits(prev => [...prev, newHabit]);
    showToast("New protocol initialized.");
  };

  const deleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    showToast("Protocol deleted.");
  };

  const reorderHabits = (fromIndex: number, toIndex: number) => {
    setHabits(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  };

  const calculateXP = useCallback((newHistory: History) => {
    const total = Object.values(newHistory).reduce((acc: number, day: DayLog) => {
      return acc + Object.values(day).filter(Boolean).length;
    }, 0);

    const xp = total * 10;
    const level = Math.floor(xp / 100) + 1;
    
    setStats(prev => ({ ...prev, xp, level, totalCompleted: total }));

    // Check Completion for Today
    const todaysLog = newHistory[todayStr] || {};
    const scheduledTodayCount = habits.filter(h => h.frequency.includes(new Date().getDay())).length;
    const completedTodayCount = Object.values(todaysLog).filter(Boolean).length;
    
    if (completedTodayCount === scheduledTodayCount && scheduledTodayCount > 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
        
        // Module C: Wins Journal Trigger
        // Only trigger if no entry for today exists
        const hasEntryToday = journal.some(entry => entry.date === todayStr);
        if (!hasEntryToday) {
            setTimeout(() => setIsWinModalOpen(true), 1500); // Small delay after confetti
        }
    }

  }, [habits, todayStr, journal]);

  const toggleHabit = (habitId: string, date: string) => {
    if (missedLogs[date]?.[habitId]) {
        setMissedLogs(prev => {
            const copy = { ...prev };
            if (copy[date]) {
                delete copy[date][habitId];
                if (Object.keys(copy[date]).length === 0) delete copy[date];
            }
            return copy;
        });
    }

    setHistory(prev => {
      const dayLog = prev[date] || {};
      const newValue = !dayLog[habitId];
      const newHistory = {
        ...prev,
        [date]: { ...dayLog, [habitId]: newValue }
      };
      calculateXP(newHistory);
      return newHistory;
    });
  };

  const handleLogMissed = (habitId: string, date: string, reason: string) => {
      setHistory(prev => {
          const dayLog = prev[date] || {};
          const newHistory = { ...prev, [date]: { ...dayLog, [habitId]: false } };
          return newHistory;
      });

      setMissedLogs(prev => ({
          ...prev,
          [date]: {
              ...(prev[date] || {}),
              [habitId]: reason
          }
      }));

      showToast("Barrier logged. Persistence is key.");
  };

  // Module B Action
  const handleAddResource = (res: Resource) => {
      setResources(prev => [...prev, res]);
      showToast("Resource added to Vault.");
  };
  
  const handleUpdateResource = (updatedRes: Resource) => {
      setResources(prev => prev.map(r => r.id === updatedRes.id ? updatedRes : r));
      showToast("Strategy updated.");
  };

  const handleDeleteResource = (id: string) => {
      setResources(prev => prev.filter(r => r.id !== id));
      showToast("Resource removed.");
  };

  // Module C Action
  const handleSaveWin = (entryData: Omit<JournalEntry, 'id'>) => {
      const newEntry: JournalEntry = {
          id: `win-${Date.now()}`,
          ...entryData
      };
      setJournal(prev => [...prev, newEntry]);
      showToast("Victory secured in log.");
  };

  const handleSync = () => {
    // Generate ICS file content (Keep existing logic)
    const daysMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    
    let icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NeoFlow//Habit Tracker//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    habits.forEach(habit => {
      if (!habit.frequency || habit.frequency.length === 0) return;
      const byDays = habit.frequency.map(d => daysMap[d]).join(',');
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(9, 0, 0, 0);
      const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const dtStart = formatDate(startDate);
      const endDate = new Date(startDate.getTime() + 15 * 60000); 
      const dtEnd = formatDate(endDate);

      icsLines.push('BEGIN:VEVENT');
      icsLines.push(`SUMMARY:${habit.name} (NeoFlow)`);
      icsLines.push(`DESCRIPTION:Category: ${habit.category}\\nEnergy: ${habit.energyReq}`);
      icsLines.push(`DTSTART:${dtStart}`);
      icsLines.push(`DTEND:${dtEnd}`);
      icsLines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDays}`);
      icsLines.push('STATUS:CONFIRMED');
      icsLines.push('END:VEVENT');
    });

    icsLines.push('END:VCALENDAR');
    const icsContent = icsLines.join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'neoflow_schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    showToast("Schedule downloaded! Open file to import to Calendar.");
  };

  const handleEditHabit = (habit: Habit) => {
    window.setTimeout(() => {
        setIsHabitStudioOpen(true);
    }, 0);
  };
  
  const getProgressToNextLevel = () => (stats.xp % 100);

  // --- Mobile Bottom Nav Items ---
  const navItems: { id: string; icon: React.ElementType; label: string }[] = [
      { id: 'dashboard', icon: Home, label: 'Home' },
      { id: 'vault', icon: Database, label: 'Vault' },
      { id: 'journal', icon: Terminal, label: 'Log' },
      { id: 'analytics', icon: Shield, label: 'Stats' },
  ];

  return (
    <div className="min-h-screen bg-cyber-dark text-cyber-text flex font-sans animate-in fade-in duration-700 pb-20 md:pb-0">
      {showConfetti && <Confetti />}
      
      {notification && (
          <div className="fixed top-4 right-4 z-[100] bg-cyber-panel border border-cyber-primary text-white px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-in slide-in-from-top-2 fade-in">
              {notification}
          </div>
      )}

      {/* Sidebar (Desktop Only) */}
      <aside className="w-64 border-r border-slate-800 bg-cyber-darker hidden md:flex flex-col p-6 sticky top-0 h-screen shrink-0 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyber-primary to-blue-600 flex items-center justify-center shadow-[0_0_15px_#06b6d4]">
            <Activity className="text-white" />
          </div>
          <div className="flex flex-col">
              <h1 className="font-bold text-xl tracking-tight text-white leading-none">NeoFlow</h1>
              <span className="text-[10px] text-cyber-primary font-mono mt-1">USER: {username.toUpperCase()}</span>
          </div>
        </div>

        {/* Module A: Energy Selector */}
        <EnergySelector current={energyState} onChange={setEnergyState} />

        {/* Gamification Card - Updated to Oval */}
        <div className={`bg-cyber-panel py-3 px-6 rounded-full border border-slate-700 shadow-lg mb-8 relative overflow-hidden group transition-all duration-500 flex items-center justify-between ${maxStreak >= 66 ? 'shadow-[0_0_30px_rgba(139,92,246,0.3)]' : ''}`}>
          {/* Progress Bar (Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-cyber-primary to-cyber-secondary transition-all duration-500" 
              style={{ width: `${getProgressToNextLevel()}%` }}
            />
          </div>

          <div className="flex flex-col z-10">
             <span className="text-[10px] text-cyber-muted uppercase font-bold tracking-widest">Current Level</span>
             <span className="text-xl font-black text-white leading-none">{stats.level}</span>
          </div>

          <div className="opacity-30 group-hover:opacity-60 transition-opacity z-10">
             <Trophy size={24} className={`transition-colors duration-500 ${trophyColorClass}`} />
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <CalendarIcon size={18} />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('vault')}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${activeTab === 'vault' ? 'bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Database size={18} />
            <span className="font-medium">Strategy Vault</span>
          </button>

          <button 
            onClick={() => setActiveTab('journal')}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${activeTab === 'journal' ? 'bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Terminal size={18} />
            <span className="font-medium">Wins Log</span>
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${activeTab === 'analytics' ? 'bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Shield size={18} />
            <span className="font-medium">Analytics</span>
          </button>
        </nav>

        {/* Footer Actions */}
        <div className="space-y-3 pt-6 border-t border-slate-800">
           <button 
            onClick={() => setIsHabitStudioOpen(true)}
            className="w-full py-2 px-4 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:text-white flex justify-center items-center gap-2 transition-colors"
           >
             <Settings size={14} /> Habit Studio
           </button>
           <button 
            onClick={() => setIsMissedModalOpen(true)}
            className="w-full py-2 px-4 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 border border-red-500/20 flex justify-center items-center gap-2"
           >
             Log Missed Day
           </button>
           
           <div className="flex gap-2">
               <button 
                onClick={handleSync}
                className="flex-1 py-2 px-4 rounded-xl bg-slate-800 text-slate-400 text-sm font-medium hover:bg-slate-700 flex justify-center items-center gap-2"
               >
                 <Share2 size={14} /> Sync
               </button>
               <button 
                onClick={onLogout}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                title="Logout"
               >
                 <LogOut size={16} />
               </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen w-full">
        <header className="mb-4 md:mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
              {activeTab === 'dashboard' ? 'Daily Dashboard' : activeTab === 'vault' ? 'Resource Strategy' : activeTab === 'journal' ? 'Retrospective Log' : 'Performance Analytics'}
            </h2>
            <p className="text-slate-400 text-xs md:text-sm italic truncate max-w-[300px] md:max-w-none">
               "{quote}"
            </p>
          </div>
          <div className="flex gap-2">
             <button 
               onClick={onLogout}
               className="md:hidden p-2 bg-slate-800 rounded-xl hover:bg-red-900/20 text-slate-400"
             >
               <LogOut size={20} />
             </button>
          </div>
        </header>

        {(activeTab === 'dashboard' || activeTab === 'settings') && (
          <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 slide-in-from-bottom-4">
            
            {activeTab === 'dashboard' && (
                <>
                {/* Top Graph Section */}
                <div className="bg-cyber-panel border border-slate-700 rounded-3xl p-4 md:p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-accent opacity-50" />
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Activity Volume</h3>
                </div>
                <DailyProgressChart 
                    history={history} 
                    habits={habits} 
                    missedLogs={missedLogs} 
                    currentDate={viewDateStr} // Passed here to sync graph time travel
                />
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
                    
                    {/* View Mode Toggle */}
                    <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center w-full sm:w-auto justify-center">
                        {(['week', 'month'] as ViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === mode ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {mode === 'week' ? 'Timeline' : 'Calendar'}
                            </button>
                        ))}
                    </div>

                    {/* Sort Toggle (Desktop Only) */}
                    <div className="hidden sm:flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
                        <ArrowDownUp size={14} className="text-slate-500 ml-2 mr-1" />
                        <select 
                            value={sortOption} 
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                            className="bg-transparent text-xs text-slate-300 font-medium py-1.5 px-2 focus:outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-slate-300"
                        >
                            <option value="default">Default (Drag)</option>
                            <option value="name">Name (A-Z)</option>
                            <option value="category">Category</option>
                            <option value="streak">Streak (High-Low)</option>
                            <option value="energy">Energy Req</option>
                        </select>
                    </div>
                </div>

                {/* The Grid (Module A applied via filteredHabits) */}
                <HabitGrid 
                    habits={sortedHabits} 
                    history={history} 
                    missedLogs={missedLogs}
                    currentDate={viewDateStr} // Single source of truth for date
                    streaks={streakMap}
                    isDraggable={sortOption === 'default'}
                    viewMode={viewMode}
                    onToggle={toggleHabit}
                    onReorder={reorderHabits}
                    onEdit={handleEditHabit}
                    onDateChange={setViewDateStr}
                />
                </>
            )}

            {activeTab === 'settings' && (
                <div className="space-y-4">
                   {/* Mobile Energy Selector */}
                   <div className="md:hidden">
                       <EnergySelector current={energyState} onChange={setEnergyState} />
                   </div>
                   <button 
                    onClick={() => setIsHabitStudioOpen(true)}
                    className="w-full py-4 px-4 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:text-white flex justify-center items-center gap-2 transition-colors border border-slate-700"
                   >
                     <Settings size={18} /> Manage Habits
                   </button>
                   <button 
                    onClick={() => setIsMissedModalOpen(true)}
                    className="w-full py-4 px-4 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 border border-red-500/20 flex justify-center items-center gap-2"
                   >
                     <Shield size={18} /> Log Missed Day
                   </button>
                   <button 
                    onClick={handleSync}
                    className="w-full py-4 px-4 rounded-xl bg-slate-800 text-slate-400 text-sm font-medium hover:bg-slate-700 flex justify-center items-center gap-2 border border-slate-700"
                   >
                     <Share2 size={18} /> Export / Sync
                   </button>
                </div>
            )}
          </div>
        )}
        
        {/* Module B: Vault View */}
        {activeTab === 'vault' && (
            <div className="max-w-5xl mx-auto">
                <StrategyVault 
                    resources={resources} 
                    habits={habits} 
                    onAdd={handleAddResource} 
                    onUpdate={handleUpdateResource}
                    onDelete={handleDeleteResource} 
                />
            </div>
        )}

        {/* Module C: Journal View */}
        {activeTab === 'journal' && (
            <div className="max-w-5xl mx-auto">
                <JournalFeed entries={journal} />
            </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto animate-in fade-in duration-500">
            <div className="bg-cyber-panel border border-slate-700 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Balance Radar</h3>
              <CategoryRadar history={history} habits={habits} />
            </div>
            
            <div className="bg-cyber-panel border border-slate-700 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-6">Stats Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <div className="text-slate-500 text-xs uppercase mb-1">Total Completed</div>
                    <div className="text-2xl font-bold text-cyber-primary">{stats.totalCompleted}</div>
                 </div>
                 <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <div className="text-slate-500 text-xs uppercase mb-1">Current XP</div>
                    <div className="text-2xl font-bold text-cyber-secondary">{stats.xp}</div>
                 </div>
                 <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <div className="text-slate-500 text-xs uppercase mb-1">Longest Streak</div>
                    <div className="text-2xl font-bold text-cyber-accent">{stats.longestStreak} days</div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-cyber-darker border-t border-slate-800 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
             const isActive = activeTab === item.id;
             const Icon = item.icon;
             return (
                 <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as typeof activeTab)}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-cyber-primary' : 'text-slate-500'}`}
                 >
                     <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                     <span className="text-[10px] font-medium">{item.label}</span>
                 </button>
             );
          })}
        </div>
      </div>

      <MissedLog 
        isOpen={isMissedModalOpen} 
        habits={habits}
        onClose={() => setIsMissedModalOpen(false)}
        onSave={handleLogMissed} 
      />

      <HabitStudio
        isOpen={isHabitStudioOpen}
        onClose={() => setIsHabitStudioOpen(false)}
        habits={habits}
        onUpdateHabit={updateHabit}
        onAddHabit={addHabit}
        onDeleteHabit={deleteHabit}
      />

      <WinModal 
        isOpen={isWinModalOpen}
        onClose={() => setIsWinModalOpen(false)}
        onSave={handleSaveWin}
        currentEnergy={energyState}
        entries={journal}
      />
    </div>
  );
};

// --- App Root Component ---
const App: React.FC = () => {
  const [username, setUsername] = useState<string | null>(() => {
      // Simple persistence for user session
      return localStorage.getItem('neoflow_session_user');
  });

  const handleLogin = (user: string) => {
      setUsername(user);
      localStorage.setItem('neoflow_session_user', user);
  };

  const handleLogout = () => {
      setUsername(null);
      localStorage.removeItem('neoflow_session_user');
  };

  if (!username) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  return <Dashboard username={username} onLogout={handleLogout} />;
};

export default App;
