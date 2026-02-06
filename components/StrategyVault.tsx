
import React, { useState, useRef } from 'react';
import { Book, Link as LinkIcon, Video, StickyNote, Plus, Trash2, ExternalLink, Paperclip, FileText, Edit2, X, Eye, Upload } from 'lucide-react';
import { Resource, Habit, ResourceType } from '../types';

interface StrategyVaultProps {
  resources: Resource[];
  habits: Habit[];
  onAdd: (r: Resource) => void;
  onUpdate: (r: Resource) => void;
  onDelete: (id: string) => void;
}

const StrategyVault: React.FC<StrategyVaultProps> = ({ resources, habits, onAdd, onUpdate, onDelete }) => {
  // --- UI States ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [readerResource, setReaderResource] = useState<Resource | null>(null);

  // --- Form States ---
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ResourceType>('URL');
  const [url, setUrl] = useState(''); // Stores URL or File Path
  const [content, setContent] = useState(''); // Stores Text Content
  const [habitId, setHabitId] = useState('');
  const [meta, setMeta] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const resetForm = () => {
    setTitle('');
    setType('URL');
    setUrl('');
    setContent('');
    setHabitId('');
    setMeta('');
    setEditingId(null);
    setIsFormOpen(false);
  };

  const openEdit = (res: Resource) => {
    setTitle(res.title);
    setType(res.type);
    setUrl(res.url || '');
    setContent(res.content || '');
    setHabitId(res.associatedHabitId || '');
    setMeta(res.metadata || '');
    setEditingId(res.id);
    setIsFormOpen(true);
  };

  const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setContent(event.target.result as string);
          }
        };
        reader.readAsText(file);
      } else {
        alert("Only .txt files are supported for content extraction.");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const resourceData: Resource = {
      id: editingId || `res-${Date.now()}`,
      title,
      type,
      url: url || undefined,
      content: content || undefined,
      associatedHabitId: habitId || undefined,
      metadata: meta || undefined,
      createdAt: editingId ? (resources.find(r => r.id === editingId)?.createdAt || Date.now()) : Date.now()
    };

    if (editingId) {
      onUpdate(resourceData);
    } else {
      onAdd(resourceData);
    }
    resetForm();
  };

  const getIcon = (t: ResourceType) => {
    switch (t) {
      case 'PDF': return <Book size={16} />;
      case 'Video': return <Video size={16} />;
      case 'Text': return <FileText size={16} />;
      case 'Note': return <StickyNote size={16} />;
      default: return <LinkIcon size={16} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-white">Strategy Vault</h3>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="bg-cyber-primary hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.3)]"
        >
          <Plus size={18} /> Add Resource
        </button>
      </div>

      {/* --- CRUD Form Modal --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-cyber-panel border border-slate-700 w-full max-w-2xl p-6 rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={resetForm} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              {editingId ? <Edit2 size={20} className="text-cyber-primary" /> : <Plus size={20} className="text-cyber-primary" />}
              {editingId ? 'Edit Resource' : 'Add Strategy Resource'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="md:col-span-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
                   <input 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 mt-1 focus:ring-cyber-primary focus:border-cyber-primary outline-none" 
                    placeholder="e.g. Atomic Habits Roadmap" 
                    required 
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                   <select 
                    value={type} 
                    onChange={e => setType(e.target.value as ResourceType)} 
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 mt-1 outline-none"
                   >
                     <option value="URL">URL / Link</option>
                     <option value="PDF">PDF Reference</option>
                     <option value="Video">Video</option>
                     <option value="Text">Text / Roadmap</option>
                     <option value="Note">Quick Note</option>
                   </select>
                 </div>
               </div>
               
               {/* Dynamic Inputs based on Type */}
               {type === 'Text' || type === 'Note' ? (
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                      <span>Content / Notes</span>
                      {type === 'Text' && (
                        <span 
                          onClick={() => fileInputRef.current?.click()} 
                          className="text-cyber-primary cursor-pointer hover:underline flex items-center gap-1"
                        >
                          <Upload size={12} /> Import .txt
                        </span>
                      )}
                    </label>
                    <textarea 
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 h-40 font-mono text-sm focus:ring-cyber-primary focus:border-cyber-primary outline-none"
                      placeholder="Paste text content or import a .txt file..."
                    />
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".txt"
                      onChange={handleFileRead}
                    />
                 </div>
               ) : (
                 <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">
                       {type === 'PDF' ? 'File Path or Hosted Link' : 'URL / Link'}
                     </label>
                     <input 
                      type={type === 'PDF' ? 'text' : 'url'}
                      value={url} 
                      onChange={e => setUrl(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 mt-1 focus:ring-cyber-primary focus:border-cyber-primary outline-none" 
                      placeholder={type === 'PDF' ? 'e.g. C:/Books/manual.pdf' : 'https://...'} 
                     />
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Link to Habit (Optional)</label>
                   <select value={habitId} onChange={e => setHabitId(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 mt-1 outline-none">
                     <option value="">-- General Resource --</option>
                     {habits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Pin / Metadata</label>
                   <input value={meta} onChange={e => setMeta(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 mt-1 outline-none" placeholder="e.g. Page 184" />
                 </div>
               </div>
               
               <div className="flex justify-end pt-4 gap-3">
                 <button type="button" onClick={resetForm} className="text-slate-400 hover:text-white px-4 py-2">Cancel</button>
                 <button type="submit" className="bg-cyber-primary hover:bg-cyan-400 text-black font-bold px-6 py-2 rounded-lg transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                   {editingId ? 'Save Changes' : 'Add to Vault'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Reader Modal --- */}
      {readerResource && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-cyber-darker border border-slate-700 w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl relative flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg text-cyber-primary">
                     <FileText size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white">{readerResource.title}</h3>
               </div>
               <div className="flex items-center gap-2">
                  <button onClick={() => { setReaderResource(null); openEdit(readerResource); }} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                    <Edit2 size={20} />
                  </button>
                  <button onClick={() => setReaderResource(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                    <X size={24} />
                  </button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-900/50">
               <pre className="whitespace-pre-wrap font-mono text-slate-300 text-sm leading-relaxed">
                 {readerResource.content || "No content provided."}
               </pre>
            </div>
          </div>
        </div>
      )}

      {/* --- Resource Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map(res => {
          const linkedHabit = habits.find(h => h.id === res.associatedHabitId);
          return (
            <div key={res.id} className="bg-cyber-panel border border-slate-700 p-5 rounded-2xl hover:border-slate-500 transition-all group relative flex flex-col h-full shadow-lg">
               
               <div className="flex items-start justify-between mb-3">
                 <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-slate-800 rounded-xl text-cyber-secondary shadow-inner">
                     {getIcon(res.type)}
                   </div>
                   <div className="overflow-hidden">
                     <h4 className="font-bold text-white text-sm truncate pr-2" title={res.title}>{res.title}</h4>
                     <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{res.type}</div>
                   </div>
                 </div>
                 
                 {/* Action Buttons */}
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(res)} className="p-1.5 text-slate-400 hover:text-cyber-primary hover:bg-slate-800 rounded-lg transition-colors" title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete(res.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                 </div>
               </div>

               <div className="flex-1 mb-4">
                 {res.url ? (
                   <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyber-primary hover:text-cyan-300 hover:underline flex items-center gap-1 break-all bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                     <ExternalLink size={10} className="shrink-0" />
                     {res.url}
                   </a>
                 ) : (
                    <div 
                      className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50 h-16 overflow-hidden relative cursor-pointer hover:border-slate-600 transition-colors"
                      onClick={() => (res.content || res.type === 'Text') && setReaderResource(res)}
                    >
                        {res.content ? res.content.substring(0, 100) + '...' : 
                         <span className="italic opacity-50">No preview available.</span>
                        }
                        {(res.content || res.type === 'Text') && (
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent flex items-end justify-center pb-1">
                             <span className="text-[10px] text-cyber-primary font-bold flex items-center gap-1 bg-slate-900 px-2 rounded-full">
                               <Eye size={10} /> Read
                             </span>
                          </div>
                        )}
                    </div>
                 )}
               </div>
               
               <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800">
                  {linkedHabit ? (
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded-md flex items-center gap-1.5 border border-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: linkedHabit.color }} />
                      {linkedHabit.name}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600 italic px-2">General</span>
                  )}
                  
                  {res.metadata && (
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-md flex items-center gap-1 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                      <Paperclip size={10} />
                      {res.metadata}
                    </span>
                  )}
               </div>
            </div>
          );
        })}
        {resources.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
            <Book size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Vault is empty.</p>
            <p className="text-sm opacity-60">Add learning resources, roadmaps, or notes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyVault;
