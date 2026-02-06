import React, { useEffect, useState } from 'react';

const Confetti: React.FC = () => {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setActive(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-cyber-primary rounded-full animate-pulse"
          style={{
            left: `${50 + (Math.random() * 40 - 20)}%`,
            top: `${50 + (Math.random() * 40 - 20)}%`,
            backgroundColor: ['#06b6d4', '#f43f5e', '#10b981', '#facc15'][Math.floor(Math.random() * 4)],
            transform: `scale(${Math.random() * 1.5})`,
            animation: `pulse-fast ${0.5 + Math.random()}s ease-out forwards`
          }}
        />
      ))}
      <div className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-bounce">
        LEVEL UP!
      </div>
    </div>
  );
};

export default Confetti;