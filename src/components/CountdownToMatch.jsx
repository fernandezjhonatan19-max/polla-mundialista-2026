import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export default function CountdownToMatch({ matchDate, matchStatus }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (matchStatus !== 'pending') {
      setIsLocked(true);
      return;
    }

    const calculateTime = () => {
      const targetTime = new Date(matchDate).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft('Comenzó');
        setIsLocked(true);
        setIsUrgent(false);
        return;
      }

      // Calculations
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Urgency check (less than 6 hours)
      setIsUrgent(difference < 6 * 60 * 60 * 1000);

      let timeString = '';
      if (days > 0) {
        timeString = `${days}d ${hours}h`;
      } else if (hours > 0) {
        timeString = `${hours}h ${minutes}m`;
      } else {
        timeString = `${minutes}m ${seconds}s`;
      }

      setTimeLeft(timeString);
      setIsLocked(false);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [matchDate, matchStatus]);

  if (isLocked) {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
        <Lock className="w-3 h-3" />
        Bloqueado
      </span>
    );
  }

  const colorClass = isUrgent 
    ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20 animate-pulse' 
    : 'text-amber-400 bg-amber-500/5 border border-amber-500/15';

  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded shadow-sm ${colorClass}`}>
      {isUrgent ? '⚠️ Cierra en ' : 'Cierra en '}
      {timeLeft}
    </span>
  );
}
