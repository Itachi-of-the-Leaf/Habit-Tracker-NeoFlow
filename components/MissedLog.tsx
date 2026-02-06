import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { Habit } from '../types';

interface MissedLogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitId: string, date: string, reason: string) => void;
  habits: Habit[];
}

const MissedLog: React.FC<MissedLogProps> = ({ isOpen, onClose, onSave, habits }) => {
  const [reason, setReason] = useState('Too Tired');
  const [selectedHabitId, setSelectedHabitId] = useState<string>(habits[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const reasons = ['Forgot', 'Too Tired', 'Emergency', 'Procrastinated', 'Not Priority', 'Sick'];

  const handleSave = () => {
    if (selectedHabitId && date) {
        onSave(selectedHabitId, date, reason);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-cyber-panel border border-slate-700 w-full max-w-md p-6 rounded-3xl shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-red-400" />
            <h3 className="text-xl font-bold text-white">Log Missed Habit</h3>
        </div>
        <p className="text-slate-400 text-sm mb-6">Honesty builds momentum. Log a barrier to clear it later.</p>

        <div className="space-y-4 mb-6">
            {/* Habit Selector */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Which habit?</label>
                <select 
                    value={selectedHabitId}
                    onChange={(e) => setSelectedHabitId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 focus:ring-red-500 focus:border-red-500"
                >
                    {habits.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                </select>
            </div>

            {/* Date Selector */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">When?</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                    <input 
                        type="date"
                        value={date}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 pl-10 focus:ring-red-500 focus:border-red-500"
                    />
                </div>
            </div>

            {/* Reason Selector */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Why?</label>
                <div className="grid grid-cols-2 gap-2">
                {reasons.map((r) => (
                    <label key={r} className={`
                        flex items-center justify-center p-2 rounded-xl border cursor-pointer transition-all text-sm font-medium
                        ${reason === r ? 'bg-red-500/20 border-red-500 text-red-200' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}
                    `}>
                    <input 
                        type="radio" 
                        name="reason" 
                        value={r} 
                        checked={reason === r} 
                        onChange={(e) => setReason(e.target.value)}
                        className="hidden"
                    />
                    {r}
                    </label>
                ))}
                </div>
            </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition-transform active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
        >
          Log Barrier
        </button>
      </div>
    </div>
  );
};

export default MissedLog;