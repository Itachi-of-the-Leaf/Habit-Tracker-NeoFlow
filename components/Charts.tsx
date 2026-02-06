
import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  ReferenceLine,
  BarChart,
  Bar
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from 'date-fns';
import { Habit, History, Category, MissedLogData } from '../types';

interface ChartsProps {
  history: History;
  habits: Habit[];
  missedLogs?: MissedLogData;
  currentDate: string; // "YYYY-MM-DD"
}

// Helper for consistent date parsing
const parseDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(n => Number(n));
    return new Date(y, m - 1, d);
};

export const DailyProgressChart: React.FC<ChartsProps> = ({ history, habits, missedLogs = {}, currentDate }) => {
  // Generate data for the specific selected month
  const viewDateObj = parseDate(currentDate);
  const start = startOfMonth(viewDateObj);
  const end = endOfMonth(viewDateObj);
  
  const daysOfMonth = eachDayOfInterval({ start, end });

  const data = daysOfMonth.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayLog = history[dateStr] || {};
      
      const completedCount = Object.keys(dayLog).filter(habitId => {
          return dayLog[habitId] && habits.some(h => h.id === habitId);
      }).length;
      
      const missedCount = missedLogs[dateStr] ? Object.keys(missedLogs[dateStr]).length : 0;
      const dayOfWeek = day.getDay();
      const dailyGoal = habits.filter(h => h.frequency.includes(dayOfWeek)).length;

      return { 
        date: format(day, 'd'), 
        dayName: format(day, 'EEE'),
        fullDate: dateStr,
        Completed: completedCount, 
        Goal: dailyGoal,
        Missed: missedCount 
      };
  });

  const maxGoal = Math.max(...data.map(d => d.Goal), habits.length);

  // Mobile specific data: Just last 7 days from today (or selected date)
  // We use the last 7 days of the *selected* view to show context
  const mobileData = data.slice(-7); 

  return (
    <div className="w-full">
      {/* Desktop Chart */}
      <div className="hidden md:block h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMissed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} interval={2} />
              <YAxis hide domain={[0, maxGoal + 1]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ color: '#f1f5f9', fontSize: '12px', fontWeight: 'bold' }}
                cursor={{ stroke: '#334155', strokeWidth: 1 }}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
              />
              <ReferenceLine y={maxGoal} stroke="#64748b" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="Missed" stackId="1" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorMissed)" />
              <Area type="monotone" dataKey="Completed" stackId="2" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
            </AreaChart>
          </ResponsiveContainer>
      </div>

      {/* Mobile Chart (Simple Bars) */}
      <div className="md:hidden h-40">
           <ResponsiveContainer width="100%" height="100%">
               <BarChart data={mobileData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <XAxis dataKey="dayName" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                   <YAxis hide domain={[0, maxGoal + 1]} />
                   <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', border: 'none', color: '#fff' }} />
                   <Bar dataKey="Completed" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={20} />
               </BarChart>
           </ResponsiveContainer>
      </div>
    </div>
  );
};

export const CategoryRadar: React.FC<Omit<ChartsProps, 'currentDate'>> = ({ history, habits }) => {
  // Calculate breakdown
  const categoryScores: Record<Category, { total: number; completed: number }> = {
    Health: { total: 0, completed: 0 },
    Work: { total: 0, completed: 0 },
    Mind: { total: 0, completed: 0 },
    Social: { total: 0, completed: 0 },
    Skill: { total: 0, completed: 0 },
  };

  Object.values(history).forEach((dayLog) => {
    habits.forEach(habit => {
      categoryScores[habit.category].total += 1;
      if (dayLog[habit.id]) {
        categoryScores[habit.category].completed += 1;
      }
    });
  });

  const data = Object.keys(categoryScores).map((cat) => {
    const s = categoryScores[cat as Category];
    return {
      subject: cat,
      A: s.total === 0 ? 0 : Math.round((s.completed / s.total) * 100),
      fullMark: 100
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <defs>
             <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c084fc" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#c084fc" stopOpacity={0.1}/>
             </linearGradient>
          </defs>
          <PolarGrid gridType="polygon" stroke="#22d3ee" strokeOpacity={0.2} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 'bold', textShadow: '0 0 10px rgba(6,182,212,0.5)' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Consistency"
            dataKey="A"
            stroke="#22d3ee"
            strokeWidth={3}
            fill="url(#radarGradient)"
            fillOpacity={1}
            isAnimationActive={true}
          />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
