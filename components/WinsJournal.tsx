
import React, { useState, useEffect } from 'react';
import { Trophy, Send, X, Terminal, Tag } from 'lucide-react';
import { JournalEntry, EnergyState } from '../types';

interface WinsJournalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<JournalEntry, 'id'>) => void;
  entries: JournalEntry[];
  currentEnergy: EnergyState;
}

export const JournalFeed: React.FC<{ entries: JournalEntry[] }> = ({ entries }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
        <Terminal size={24} className="text-cyber-success" />
        Victory Log
      </h3>
      <div className="font-mono text-sm bg-black/50 p-4 rounded-xl border border-slate-700 h-[600px] overflow-y-auto custom-scrollbar">
        {entries.length === 0 ? (
          <div className="text-slate-600 p-4">_awaiting_data...</div>
        ) : (
          entries.slice().reverse().map(entry => (
            <div key={entry.id} className="mb-6 border-l-2 border-slate-800 pl-4 pb-2 relative">
               <div className="absolute -left-[5px] top-0 w-2 h-2 bg-cyber-success rounded-full" />
               <div className="flex items-center gap-2 mb-1">
                 <span className="text-cyber-success font-bold">[{entry.date}]</span>
                 <span className={`text-[10px] px-1.5 rounded border ${
                    entry.energyLevelSnapshot === 'Critical' ? 'border-red-500 text-red-500' :
                    entry.energyLevelSnapshot === 'Energized' ? 'border-lime-500 text-lime-500' :
                    'border-slate-500 text-slate-500'
                 }`}>
                   PWR:{entry.energyLevelSnapshot.toUpperCase()}
                 </span>
               </div>
               <p className="text-slate-300 mb-2">{entry.victory}</p>
               <div className="flex gap-2">
                 {entry.tags.map(tag => (
                   <span key={tag} className="text-[10px] text-slate-500">#{tag}</span>
                 ))}
               </div>
            </div>
          ))
        )}
        <div className="animate-pulse text-cyber-success">_</div>
      </div>
    </div>
  );
};

export const WinModal: React.FC<WinsJournalProps> = ({ isOpen, onClose, onSave, currentEnergy }) => {
  const [victory, setVictory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSave = () => {
    if (victory.trim()) {
      onSave({
        date: new Date().toISOString().split('T')[0],
        victory,
        tags,
        energyLevelSnapshot: currentEnergy
      });
      setVictory('');
      setTags([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-cyber-darker border border-cyber-success/30 w-full max-w-lg p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-success to-transparent opacity-50" />
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center mb-6">
           <div className="w-16 h-16 rounded-full bg-cyber-success/20 flex items-center justify-center mb-4 animate-bounce">
              <Trophy size={32} className="text-cyber-success" />
           </div>
           <h2 className="text-2xl font-black text-white uppercase tracking-widest">Protocol Complete</h2>
           <p className="text-cyber-success font-mono text-sm mt-1">100% Synchronization Achieved</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Log Victory</label>
            <textarea 
               value={victory}
               onChange={e => setVictory(e.target.value)}
               className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl p-4 mt-1 h-24 focus:ring-cyber-success focus:border-cyber-success placeholder-slate-600"
               placeholder="What went well today? What barrier did you break?"
            />
          </div>

          <div>
             <label className="text-xs font-bold text-slate-500 uppercase">Tags</label>
             <div className="flex items-center gap-2 mt-1">
               <div className="relative flex-1">
                 <Tag className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                 <input 
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-2 pl-9 pr-2 text-sm"
                    placeholder="Add tag (Enter)..."
                 />
               </div>
               <button onClick={handleAddTag} className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white"><Send size={16}/></button>
             </div>
             <div className="flex flex-wrap gap-2 mt-2">
               {tags.map(tag => (
                 <span key={tag} className="bg-cyber-success/10 text-cyber-success text-xs px-2 py-1 rounded border border-cyber-success/20 flex items-center gap-1">
                   #{tag}
                   <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-white"><X size={10} /></button>
                 </span>
               ))}
             </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-cyber-success hover:bg-emerald-400 text-black font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] mt-4"
          >
            SECURE VICTORY LOG
          </button>
        </div>
      </div>
    </div>
  );
};
