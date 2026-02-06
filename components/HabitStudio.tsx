
import React, { useState, useEffect } from 'react';
import { X, Palette, Plus, Layers, Upload, Edit3, Trash2, Check, BatteryCharging } from 'lucide-react';
import { Habit, Category, EnergyReq } from '../types';

interface HabitStudioProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  onUpdateHabit: (updatedHabit: Habit) => void;
  onAddHabit: (newHabit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
}

const HabitStudio: React.FC<HabitStudioProps> = ({ isOpen, onClose, habits, onUpdateHabit, onAddHabit, onDeleteHabit }) => {
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Health');
  const [color, setColor] = useState('#06b6d4');
  const [iconImage, setIconImage] = useState<string>('');
  const [energyReq, setEnergyReq] = useState<EnergyReq>('Medium');

  // Reset form when opening or switching modes
  useEffect(() => {
    if (!isOpen) {
        resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
      setMode('create');
      setEditingId(null);
      setConfirmDeleteId(null);
      setName('');
      setCategory('Health');
      setColor('#06b6d4');
      setIconImage('');
      setEnergyReq('Medium');
  };

  const handleEditClick = (habit: Habit) => {
      setMode('edit');
      setEditingId(habit.id);
      setName(habit.name);
      setCategory(habit.category);
      setColor(habit.color);
      setIconImage(habit.iconImage || '');
      setEnergyReq(habit.energyReq || 'Medium');
      // Scroll to top to see form
      const formEl = document.getElementById('studio-form');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setIconImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSubmit = () => {
      if (!name.trim()) return;

      const habitData = {
          name,
          category,
          color,
          iconImage: iconImage || undefined,
          energyReq,
      };

      if (mode === 'create') {
          onAddHabit({
              id: `custom-${Date.now()}`,
              frequency: [0, 1, 2, 3, 4, 5, 6],
              targetStreak: 21,
              ...habitData
          });
      } else if (mode === 'edit' && editingId) {
          const existing = habits.find(h => h.id === editingId);
          if (existing) {
              onUpdateHabit({
                  ...existing,
                  ...habitData
              });
          }
      }
      resetForm();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit
    onDeleteHabit(id);
    if (editingId === id) {
        resetForm();
    }
    setConfirmDeleteId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
      <div className="bg-cyber-panel border-t md:border border-slate-700 w-full md:max-w-2xl p-6 rounded-t-3xl md:rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Habit Studio</h3>
            <p className="text-slate-400 text-sm">Create, Edit, and Customize.</p>
          </div>
        </div>

        {/* Editor Section */}
        <div id="studio-form" className="mb-8 p-6 bg-slate-900/80 rounded-2xl border border-slate-700 transition-all duration-300">
             <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    {mode === 'create' ? <Plus size={16} /> : <Edit3 size={16} />}
                    {mode === 'create' ? 'Create New Protocol' : 'Edit Protocol'}
                </h4>
                {mode === 'edit' && (
                    <button onClick={resetForm} className="text-xs text-slate-500 hover:text-white">Cancel Edit</button>
                )}
             </div>
            
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Night Journal"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-xl focus:ring-cyber-primary focus:border-cyber-primary p-2.5"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as Category)}
                            className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-xl focus:ring-cyber-primary focus:border-cyber-primary p-2.5"
                        >
                            <option value="Health">Health</option>
                            <option value="Work">Work</option>
                            <option value="Mind">Mind</option>
                            <option value="Social">Social</option>
                            <option value="Skill">Skill</option>
                        </select>
                    </div>
                </div>

                {/* Difficulty / Energy Level */}
                <div>
                   <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                     <BatteryCharging size={12} /> Difficulty / Energy Cost
                   </label>
                   <select
                      value={energyReq}
                      onChange={(e) => setEnergyReq(e.target.value as EnergyReq)}
                      className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-xl focus:ring-cyber-primary focus:border-cyber-primary p-2.5"
                   >
                       <option value="Very Easy">Very Easy (Visible everywhere except Critical, where it's exclusive)</option>
                       <option value="Easy">Easy (Visible in Tired, Normal, Energized)</option>
                       <option value="Medium">Average (Visible in Normal & Energized)</option>
                       <option value="Hard">Very Hard (Priority in Energized, visible in Normal)</option>
                   </select>
                   <p className="text-[10px] text-slate-500 mt-1 italic">
                     * Very Easy tasks appear even when critically tired. Hard tasks float to top when energized.
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Neon Accent</label>
                        <div className="flex items-center gap-2 h-10">
                            <input 
                                type="color" 
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                            />
                            <span className="text-xs text-slate-400 font-mono">{color}</span>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Custom Icon (Image)</label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors w-full justify-center">
                                <Upload size={14} className="text-slate-400" />
                                <span className="text-xs text-slate-300">Upload</span>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                            {iconImage && (
                                <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden border border-slate-600 relative group">
                                    <img src={iconImage} alt="Preview" className="w-full h-full object-cover" />
                                    <div 
                                      onClick={() => setIconImage('')}
                                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer text-white text-xs"
                                    >
                                        <X size={14} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={!name}
                    className="w-full bg-cyber-primary hover:bg-cyan-400 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                    {mode === 'create' ? 'Initialize Habit' : 'Update Protocol'}
                </button>
            </div>
        </div>

        <div className="space-y-3 pb-10">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Manage Existing</h4>
          {habits.map((habit) => (
            <div 
                key={habit.id} 
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group ${editingId === habit.id ? 'bg-cyber-primary/10 border-cyber-primary' : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'}`}
                onClick={() => handleEditClick(habit)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl shadow-lg flex items-center justify-center overflow-hidden shrink-0"
                  style={{ backgroundColor: habit.iconImage ? 'transparent' : habit.color, boxShadow: habit.iconImage ? 'none' : `0 0 10px ${habit.color}60` }}
                >
                    {habit.iconImage ? (
                        <img src={habit.iconImage} alt="icon" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-black/50 font-bold text-xs">{habit.name.substring(0, 2).toUpperCase()}</span>
                    )}
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${editingId === habit.id ? 'text-cyber-primary' : 'text-slate-200'}`}>{habit.name}</h4>
                  <span className="text-xs text-slate-500 uppercase tracking-wide mr-2">{habit.category}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      habit.energyReq === 'Very Easy' ? 'border-lime-400 text-lime-400' :
                      habit.energyReq === 'Easy' ? 'border-blue-400 text-blue-400' :
                      habit.energyReq === 'Medium' ? 'border-amber-400 text-amber-400' :
                      'border-red-500 text-red-500'
                  }`}>
                      {habit.energyReq || 'Medium'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-700 ml-2" onClick={(e) => e.stopPropagation()}>
                {confirmDeleteId === habit.id ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                        <button 
                            onClick={(e) => handleDelete(habit.id, e)}
                            className="p-1.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                            title="Confirm Delete"
                        >
                            <Check size={14} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="p-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                            title="Cancel"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-slate-500 hover:text-cyber-primary p-2">
                            <Edit3 size={16} />
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(habit.id); }}
                            className="p-2 text-slate-500 hover:text-red-400 transition-colors hover:bg-red-400/10 rounded-lg"
                            title="Delete Habit"
                        >
                            <Trash2 size={16} />
                        </button>
                    </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HabitStudio;
