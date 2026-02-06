
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Check, Flame, GripVertical, X, ChevronRight, ChevronLeft, Edit2, Calendar, Zap } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  isSameMonth, 
  isToday, 
  addDays,
  startOfWeek,
  endOfWeek,
  isFuture,
  isSameDay,
  startOfToday,
  isAfter
} from 'date-fns';
import { Habit, History, MissedLogData } from '../types';

export type ViewMode = 'week' | 'month';

interface HabitGridProps {
  habits: Habit[];
  history: History;
  missedLogs: MissedLogData;
  currentDate: string; // The currently "Viewed" date (Local YYYY-MM-DD)
  streaks: Record<string, number>;
  isDraggable: boolean;
  viewMode: ViewMode;
  onToggle: (habitId: string, date: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onEdit: (habit: Habit) => void;
  onDateChange: (newDate: string) => void;
}

// Helper to consistently parse "YYYY-MM-DD" as local time
const parseDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(n => Number(n));
    return new Date(y, m - 1, d);
};

const HabitGrid: React.FC<HabitGridProps> = ({ 
  habits, 
  history, 
  missedLogs,
  currentDate, 
  streaks, 
  isDraggable, 
  viewMode,
  onToggle, 
  onReorder,
  onEdit,
  onDateChange
}) => {
  const viewDateObj = parseDate(currentDate);
  const realToday = new Date();
  const dayOfWeek = realToday.getDay(); // 0-6

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Scroll Restoration State
  const scrollPositionRef = useRef<number>(0);

  // --- Scroll Restoration Logic ---
  // Capture scroll position on every scroll event
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    scrollPositionRef.current = e.currentTarget.scrollLeft;
  };

  // Restore scroll position after render (LayoutEffect runs before browser paint)
  useLayoutEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollLeft = scrollPositionRef.current;
    }
  });

  // --- Navigation Handlers ---
  const handlePrevMonth = () => {
    const newDate = subMonths(viewDateObj, 1);
    onDateChange(format(startOfMonth(newDate), 'yyyy-MM-dd'));
  };

  const handleNextMonth = () => {
    const newDate = addMonths(viewDateObj, 1);
    onDateChange(format(startOfMonth(newDate), 'yyyy-MM-dd'));
  };

  const handleJumpToToday = () => {
    onDateChange(format(realToday, 'yyyy-MM-dd'));
  };

  // --- Resize Logic ---
  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        // limit width between 80px and 500px
        const newWidth = Math.max(80, Math.min(500, e.clientX - (sidebarRef.current?.getBoundingClientRect().left || 0)));
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // --- Date Helpers ---
  const getGridDays = () => {
    const start = startOfMonth(viewDateObj);
    const end = endOfMonth(viewDateObj);
    return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
  };

  const getMonthDays = () => {
    const start = startOfMonth(viewDateObj);
    const end = endOfMonth(viewDateObj);
    return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
  };

  // --- Statistics Helpers ---
  const getHabitStats = (habitId: string, dates: string[]) => {
      let goal = 0;
      let actual = 0;
      dates.forEach(date => {
          const d = parseDate(date);
          const habit = habits.find(h => h.id === habitId);
          if (habit && habit.frequency.includes(getDay(d))) {
              goal++;
              if (history[date]?.[habitId]) {
                  actual++;
              }
          }
      });
      const progress = goal === 0 ? 0 : Math.round((actual / goal) * 100);
      return { goal, actual, progress };
  };

  const getDayPercentage = (date: string) => {
      const d = parseDate(date);
      const day = getDay(d);
      const scheduledHabits = habits.filter(h => h.frequency.includes(day));
      if (scheduledHabits.length === 0) return 0;
      const completed = scheduledHabits.reduce((acc, h) => acc + (history[date]?.[h.id] ? 1 : 0), 0);
      return Math.round((completed / scheduledHabits.length) * 100);
  };

  // --- Drag Handlers ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isDraggable || viewMode !== 'week') return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!isDraggable || viewMode !== 'week' || draggedIndex === null || draggedIndex === targetIndex) return;
    onReorder(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };

  // Dynamic Widths
  const currentSidebarWidth = isSidebarExpanded ? sidebarWidth : 80;

  // --- Render: Mobile Card View (Cards + Carousel) ---
  // Renamed to render function to prevent unmounting/remounting
  const renderMobileView = () => {
    // Generate dates for the carousel (current view month)
    const dates = getGridDays();
    
    // Note: We use local state here, but since this is called directly, 
    // it's effectively part of the parent component's render cycle. 
    // Ideally, selectedMobileDate should be lifted up if persistence is needed across tab switches,
    // but for now, we'll initialize it safely.
    
    // To avoid "Rendered more hooks than during the previous render" if logic was complex, 
    // we just use the props passed in or stable state from parent. 
    // However, for this specific mobile view state, we can keep using React state 
    // if we ensure MobileView isn't conditionally breaking hook rules. 
    // Since we are inside the main HabitGrid component now, we can use a state variable defined at the top level
    // OR we can just accept that this specific state resets if we switch view modes.
    
    // For simplicity in this refactor, I will implement the mobile date selection 
    // as a top-level state in HabitGrid to ensure stability.
    // See [selectedMobileDate, setSelectedMobileDate] added below.

    const dObj = parseDate(selectedMobileDate);
    const isFutureDate = isAfter(dObj, startOfToday());

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* 1. Date Carousel */}
            <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar snap-x">
                 {dates.map(date => {
                     const d = parseDate(date);
                     const isSelected = date === selectedMobileDate;
                     const isDayToday = isSameDay(d, realToday);
                     const perc = getDayPercentage(date);
                     
                     return (
                         <button 
                            key={date}
                            onClick={() => setSelectedMobileDate(date)}
                            className={`
                                snap-center min-w-[60px] flex flex-col items-center justify-center p-2 rounded-xl border transition-all
                                ${isSelected 
                                    ? 'bg-cyber-primary text-black border-cyber-primary shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                                    : isDayToday 
                                        ? 'bg-slate-800 border-cyber-primary/50 text-white'
                                        : 'bg-slate-900 border-slate-700 text-slate-400'
                                }
                            `}
                         >
                             <span className="text-[10px] font-bold uppercase">{format(d, 'EEE')}</span>
                             <span className="text-lg font-bold">{format(d, 'd')}</span>
                             {/* Mini Dot for completion */}
                             <div className={`mt-1 h-1 w-full rounded-full ${perc === 100 ? (isSelected ? 'bg-black/50' : 'bg-cyber-success') : 'bg-transparent'}`}></div>
                         </button>
                     );
                 })}
            </div>

            {/* 2. Habit Cards for Selected Date */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-20">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                    {format(dObj, 'MMMM d, yyyy')}
                </div>
                
                {habits.length === 0 && (
                    <div className="text-center text-slate-500 py-10">
                        No habits found. Tap settings to add one.
                    </div>
                )}

                {habits.map(habit => {
                    const isScheduled = habit.frequency.includes(getDay(dObj));
                    if (!isScheduled) return null;

                    const isDone = history[selectedMobileDate]?.[habit.id];
                    const missedReason = missedLogs[selectedMobileDate]?.[habit.id];
                    const currentStreak = streaks[habit.id] || 0;

                    return (
                        <div 
                            key={habit.id}
                            className={`
                                relative overflow-hidden rounded-2xl p-4 border bg-cyber-panel transition-all
                                ${isDone ? 'border-cyber-primary/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'border-slate-700'}
                            `}
                        >
                            <div className="flex items-center justify-between">
                                {/* Left: Info */}
                                <div className="flex items-center gap-3">
                                    <div 
                                      className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-lg"
                                      style={{ backgroundColor: habit.iconImage ? 'transparent' : habit.color }}
                                    >
                                         {habit.iconImage ? (
                                            <img src={habit.iconImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-white/50" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base">{habit.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-slate-400 uppercase border border-slate-700 px-1.5 py-0.5 rounded-md">{habit.category}</span>
                                            {currentStreak > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <Flame size={12} className="text-orange-500" />
                                                    <span className="text-xs text-orange-400 font-mono">{currentStreak}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Action */}
                                <button
                                    onClick={() => !isFutureDate && onToggle(habit.id, selectedMobileDate)}
                                    disabled={isFutureDate}
                                    className={`
                                        w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                                        ${missedReason 
                                            ? 'bg-red-500/20 text-red-500 border border-red-500'
                                            : isDone 
                                                ? 'bg-cyber-primary text-black shadow-[0_0_15px_#06b6d4]' 
                                                : 'bg-slate-800 text-slate-600 border border-slate-700 hover:border-slate-500'}
                                        ${isFutureDate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                >
                                    {missedReason ? <X size={24} /> : <Check size={28} strokeWidth={3} className={isDone ? 'scale-100' : 'scale-75 opacity-50'} />}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  // --- Render: Desktop Grid View ---
  // Renamed to render function
  const renderDesktopGridView = () => {
    const datesToShow = getGridDays();

    return (
      <div className="bg-cyber-panel border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-w-full h-[65vh]">
        <div 
            className="overflow-auto custom-scrollbar h-full relative" 
            ref={sidebarRef}
            onScroll={handleScroll}
        >
            <div className="min-w-max pb-2">
                {/* Header Row */}
                <div className="flex border-b border-slate-700 bg-slate-900 sticky top-0 z-50 shadow-lg">
                    {/* Sticky Habit Column Header */}
                    <div 
                      className="sticky left-0 z-50 bg-slate-900 border-r-2 border-slate-700 p-2 flex items-center justify-between shadow-[5px_0_15px_-5px_rgba(0,0,0,0.5)] transition-[width] duration-75 relative group"
                      style={{ width: currentSidebarWidth, minWidth: currentSidebarWidth }}
                    >
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold text-cyber-muted uppercase tracking-wider pl-2 ${!isSidebarExpanded && 'hidden'}`}>
                                {format(viewDateObj, 'MMMM yyyy')}
                            </span>
                             {/* Mini Nav for Grid Mode */}
                            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 ml-2">
                                <button onClick={handlePrevMonth} className="p-0.5 hover:text-white text-slate-400"><ChevronLeft size={12}/></button>
                                <button onClick={handleNextMonth} className="p-0.5 hover:text-white text-slate-400"><ChevronRight size={12}/></button>
                            </div>
                        </div>

                        <button 
                          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                          className="p-1 hover:bg-slate-800 rounded-md text-slate-400 transition-colors mx-auto"
                        >
                           {isSidebarExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                        </button>
                        
                        {/* Resize Handle */}
                        {isSidebarExpanded && (
                            <div 
                              onMouseDown={startResizing}
                              className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyber-primary/50 transition-colors z-50 ${isResizing ? 'bg-cyber-primary' : ''}`}
                            />
                        )}
                    </div>
                    
                    {/* Date Columns Header */}
                    {datesToShow.map((date) => {
                        const d = parseDate(date);
                        const isDayToday = isSameMonth(d, realToday) && d.getDate() === realToday.getDate();

                        return (
                            <div 
                                key={date} 
                                className={`w-[60px] min-w-[60px] p-2 flex flex-col items-center justify-between border-r border-dashed border-slate-700/50 transition-colors ${isDayToday ? 'bg-cyber-primary/5' : ''}`}
                            >
                                <div className="flex flex-col items-center">
                                    <span className={`text-[10px] font-bold uppercase ${isDayToday ? 'text-cyber-primary' : 'text-slate-500'}`}>
                                        {format(d, 'EEE')}
                                    </span>
                                    <span className={`text-xs font-bold ${isDayToday ? 'text-white' : 'text-slate-400'}`}>
                                        {format(d, 'd')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Sticky Analysis Header */}
                    <div className="sticky right-0 z-40 bg-slate-900 border-l-2 border-slate-700 flex shadow-[-5px_0_15px_-5px_rgba(0,0,0,0.5)]">
                        <div className="w-[200px] flex items-center justify-center p-2 bg-slate-800/50">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Analysis</span>
                        </div>
                    </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-800">
                    {habits.map((habit, index) => {
                        const isScheduledToday = habit.frequency.includes(dayOfWeek);
                        const currentStreak = streaks[habit.id] || 0;
                        const stats = getHabitStats(habit.id, datesToShow);

                        return (
                            <div 
                                key={habit.id}
                                draggable={isDraggable}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                className={`flex group transition-colors ${draggedIndex === index ? 'opacity-50 bg-slate-800' : 'hover:bg-slate-800/30'}`}
                            >
                                {/* Sticky Habit Column (Collapsible & Resizable) */}
                                <div 
                                  className="sticky left-0 z-20 bg-cyber-panel border-r-2 border-slate-700 p-4 flex items-center gap-3 shadow-[5px_0_15px_-5px_rgba(0,0,0,0.5)] transition-[width] duration-75 relative group/sidebar cursor-pointer hover:bg-slate-800"
                                  style={{ width: currentSidebarWidth, minWidth: currentSidebarWidth }}
                                  onClick={() => onEdit(habit)}
                                >
                                    {/* Drag Handle */}
                                    <div className={`w-3 flex-shrink-0 text-slate-600 cursor-move opacity-0 group-hover/sidebar:opacity-100 transition-opacity ${!isSidebarExpanded && 'hidden'}`}>
                                        {isDraggable && <GripVertical size={14} />}
                                    </div>

                                    {/* Icon */}
                                    <div 
                                        className={`
                                          rounded-xl shadow-lg flex-shrink-0 flex items-center justify-center overflow-hidden bg-slate-800 border border-slate-700 transition-all
                                          ${isSidebarExpanded ? 'w-10 h-10' : 'w-8 h-8 mx-auto'}
                                        `}
                                        style={{ borderColor: isScheduledToday ? `${habit.color}50` : 'transparent' }}
                                    >
                                        {habit.iconImage ? (
                                            <img src={habit.iconImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className={`rounded-full ${isSidebarExpanded ? 'w-1.5 h-6' : 'w-2 h-2'}`} style={{ backgroundColor: habit.color }} />
                                        )}
                                    </div>

                                    {/* Name & Meta (Hidden when collapsed) */}
                                    {isSidebarExpanded && (
                                      <div className={`flex flex-col min-w-0 flex-1 ml-1`}>
                                          <div className="flex items-center gap-1 w-full justify-between">
                                              <span 
                                                  className={`font-medium text-sm truncate text-slate-300`}
                                                  title={habit.name}
                                              >
                                                  {habit.name}
                                              </span>
                                              <Edit2 size={12} className="text-slate-600 opacity-0 group-hover/sidebar:opacity-100 transition-opacity flex-shrink-0 ml-1" />
                                          </div>
                                          {currentStreak > 0 && (
                                              <div className="flex items-center gap-0.5 mt-0.5">
                                                  <Flame size={12} className="text-orange-500 fill-orange-500" />
                                                  <span className="text-[11px] text-orange-400 font-bold">{currentStreak}</span>
                                              </div>
                                          )}
                                      </div>
                                    )}
                                </div>

                                {/* Date Cells */}
                                {datesToShow.map((date) => {
                                    const dObj = parseDate(date);
                                    const isDone = history[date]?.[habit.id];
                                    const missedReason = missedLogs[date]?.[habit.id];
                                    const isFutureDate = isAfter(dObj, startOfToday());
                                    
                                    return (
                                        <div 
                                            key={date} 
                                            className="w-[60px] min-w-[60px] p-2 flex justify-center items-center border-r border-dashed border-slate-700/50 relative group/cell hover:bg-cyber-primary/10 transition-colors"
                                        >
                                            {/* Scanner Effect Overlay: Pure CSS via pseudo-element simulation */}
                                            <div className="absolute top-[-100vh] bottom-[-100vh] left-0 right-0 bg-cyan-500/5 hidden group-hover/cell:block pointer-events-none z-0" />

                                            <button
                                                onClick={() => !isFutureDate && onToggle(habit.id, date)}
                                                disabled={isFutureDate}
                                                title={missedReason ? `Missed: ${missedReason}` : undefined}
                                                className={`
                                                    w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 z-10
                                                    ${missedReason 
                                                        ? 'bg-red-900/20 border border-red-500/50 text-red-500'
                                                        : isDone 
                                                            ? 'bg-gradient-to-br shadow-lg scale-100' 
                                                            : 'bg-slate-800/50 hover:bg-slate-700 scale-90 hover:scale-100'}
                                                    ${isFutureDate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                                `}
                                                style={!missedReason && isDone ? {
                                                    backgroundImage: `linear-gradient(135deg, ${habit.color}, ${habit.color}dd)`,
                                                    boxShadow: `0 0 8px ${habit.color}40`
                                                } : {}}
                                            >
                                                {missedReason ? <X className="w-5 h-5" /> : isDone && <Check className="w-5 h-5 text-white stroke-[3]" />}
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* Sticky Analysis Columns */}
                                <div className="sticky right-0 z-20 bg-cyber-panel border-l-2 border-slate-700 flex w-[200px] shadow-[-5px_0_15px_-5px_rgba(0,0,0,0.5)]">
                                     <div className="w-[60px] flex items-center justify-center text-xs text-slate-400 font-mono border-r border-slate-700/50">
                                         {stats.goal}
                                     </div>
                                     <div className="w-[60px] flex items-center justify-center text-xs text-white font-mono font-bold border-r border-slate-700/50">
                                         {stats.actual}
                                     </div>
                                     <div className="w-[80px] flex items-center justify-center px-2">
                                         <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                             <div 
                                               className="h-full rounded-full transition-all duration-500"
                                               style={{ 
                                                   width: `${stats.progress}%`,
                                                   backgroundColor: stats.progress === 100 ? '#10b981' : habit.color 
                                               }}
                                             />
                                         </div>
                                     </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>
    );
  };

  // --- Render: Calendar Month View ---
  const renderCalendarMonthView = () => {
    const monthDays = getMonthDays();
    const firstDayOfMonth = startOfMonth(viewDateObj);
    const startOffset = getDay(firstDayOfMonth); // 0 = Sunday
    const totalSlots = new Array(startOffset).fill(null).concat(monthDays);

    return (
        <div className="bg-cyber-panel border border-slate-700 rounded-3xl shadow-2xl p-6 relative">
             <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-4">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <h3 className="text-2xl font-bold text-white min-w-[200px] text-center">
                        {format(viewDateObj, 'MMMM yyyy')}
                    </h3>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ChevronRight size={24} />
                    </button>
                </div>
                
                {!isToday(viewDateObj) && !isSameMonth(viewDateObj, realToday) && (
                    <button 
                        onClick={handleJumpToToday}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-primary/10 text-cyber-primary text-xs font-bold border border-cyber-primary/20 hover:bg-cyber-primary/20 transition-all"
                    >
                        <Calendar size={14} /> Jump to Today
                    </button>
                )}
            </div>
            <div className="grid grid-cols-7 gap-2 md:gap-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={`header-${i}`} className="text-center text-xs font-bold text-slate-500 uppercase py-2">
                        {day}
                    </div>
                ))}
                {totalSlots.map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} className="h-20 md:h-32 bg-transparent" />;
                    const dObj = parseDate(date);
                    const isDayToday = isSameMonth(dObj, realToday) && dObj.getDate() === realToday.getDate();
                    const isFutureDate = isAfter(dObj, startOfToday());

                    return (
                        <div key={date} className={`min-h-[80px] md:min-h-[120px] rounded-xl p-2 md:p-3 border border-slate-700/50 flex flex-col gap-2 transition-colors ${isDayToday ? 'bg-slate-800 ring-1 ring-cyber-primary/50' : 'bg-slate-900/40 hover:bg-slate-800/60'}`}>
                            <span className={`text-xs font-bold ${isDayToday ? 'text-cyber-primary' : 'text-slate-400'}`}>
                                {format(dObj, 'd')}
                            </span>
                            <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                                {habits.map(habit => {
                                    const isDone = history[date]?.[habit.id];
                                    const isMissed = missedLogs[date]?.[habit.id];
                                    if (!habit.frequency.includes(getDay(dObj))) return null;
                                    return (
                                        <button 
                                            key={habit.id} 
                                            onClick={() => !isFutureDate && onToggle(habit.id, date)} 
                                            disabled={isFutureDate}
                                            className={`w-full h-1.5 md:h-2 rounded-full transition-all relative ${isMissed ? 'bg-red-500/80' : isDone ? '' : 'bg-slate-700'} ${isFutureDate ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:h-3'}`}
                                            style={!isMissed && isDone ? { backgroundColor: habit.color, boxShadow: `0 0 5px ${habit.color}` } : {}}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  }

  // State for mobile view date selection - Moved here to be stable across renders
  const [selectedMobileDate, setSelectedMobileDate] = useState<string>(currentDate);
  useEffect(() => {
    setSelectedMobileDate(currentDate);
  }, [currentDate]);

  // --- Main Return ---
  return (
    <>
        {/* Mobile View: Only shown on small screens */}
        <div className="md:hidden h-full">
            {viewMode === 'month' ? renderCalendarMonthView() : renderMobileView()}
        </div>

        {/* Desktop View: Hidden on mobile */}
        <div className="hidden md:block">
             {viewMode === 'month' ? renderCalendarMonthView() : renderDesktopGridView()}
        </div>
    </>
  );
};

export default HabitGrid;
