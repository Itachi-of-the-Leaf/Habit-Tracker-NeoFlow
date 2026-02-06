
import React from 'react';
import { Battery, BatteryCharging, BatteryWarning, Zap } from 'lucide-react';
import { EnergyState } from '../types';

interface EnergySelectorProps {
  current: EnergyState;
  onChange: (state: EnergyState) => void;
}

const EnergySelector: React.FC<EnergySelectorProps> = ({ current, onChange }) => {
  
  const getStyles = (state: EnergyState) => {
    switch (state) {
      case 'Critical':
        return 'text-red-500 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
      case 'Tired':
        return 'text-orange-400 border-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]';
      case 'Normal':
        return 'text-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
      case 'Energized':
        return 'text-lime-400 border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.8)]';
    }
  };

  return (
    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <BatteryCharging size={16} className="text-slate-400" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brain Battery</span>
      </div>
      
      <div className="grid grid-cols-4 gap-1">
        {/* Critical Button */}
        <button
          onClick={() => onChange('Critical')}
          className={`h-10 rounded-lg flex items-center justify-center transition-all duration-300 border ${current === 'Critical' ? 'bg-red-500/20 ' + getStyles('Critical') : 'border-slate-800 bg-slate-800 text-slate-600 hover:border-red-500/50'}`}
          title="Critical: Low Energy Tasks Only"
        >
          <BatteryWarning size={16} />
        </button>

        {/* Tired Button */}
        <button
          onClick={() => onChange('Tired')}
          className={`h-10 rounded-lg flex items-center justify-center transition-all duration-300 border ${current === 'Tired' ? 'bg-orange-400/20 ' + getStyles('Tired') : 'border-slate-800 bg-slate-800 text-slate-600 hover:border-orange-400/50'}`}
          title="Tired: No High Complexity"
        >
          <Battery size={16} className="rotate-90" />
        </button>

        {/* Normal Button */}
        <button
          onClick={() => onChange('Normal')}
          className={`h-10 rounded-lg flex items-center justify-center transition-all duration-300 border ${current === 'Normal' ? 'bg-blue-500/20 ' + getStyles('Normal') : 'border-slate-800 bg-slate-800 text-slate-600 hover:border-blue-500/50'}`}
          title="Normal: All Systems Go"
        >
          <BatteryCharging size={16} />
        </button>

        {/* Energized Button */}
        <button
          onClick={() => onChange('Energized')}
          className={`h-10 rounded-lg flex items-center justify-center transition-all duration-300 border ${current === 'Energized' ? 'bg-lime-400/20 ' + getStyles('Energized') : 'border-slate-800 bg-slate-800 text-slate-600 hover:border-lime-400/50'}`}
          title="Energized: Beast Mode"
        >
          <Zap size={16} className="fill-current" />
        </button>
      </div>
      <div className={`mt-2 text-[10px] font-mono text-center uppercase tracking-widest transition-colors ${current === 'Energized' ? 'text-lime-400 animate-pulse' : 'text-slate-500'}`}>
        State: {current}
      </div>
    </div>
  );
};

export default EnergySelector;
