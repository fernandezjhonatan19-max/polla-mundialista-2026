import React from 'react';
import { Clock, Play, CheckCircle2, Lock, AlertCircle, Award } from 'lucide-react';

export default function StatusBadge({ type, value, points }) {
  if (type === 'match') {
    switch (value) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm shadow-rose-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            En Juego
          </span>
        );
      case 'finished':
        return (
          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Finalizado
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pendiente
          </span>
        );
    }
  }

  if (type === 'prediction') {
    switch (value) {
      case 'saved':
        return (
          <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Guardado
          </span>
        );
      case 'locked':
        return (
          <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Lock className="w-3 h-3" />
            Bloqueado
          </span>
        );
      case 'none':
        return (
          <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3" />
            Sin Pronóstico
          </span>
        );
      case 'points':
        const bgClass = points === 3 
          ? 'bg-gold/10 text-gold border-gold/20' 
          : points === 1 
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
            : 'bg-slate-800 text-slate-500 border-slate-700';
        return (
          <span className={`inline-flex items-center gap-1 py-0.5 px-2 rounded-lg text-xs font-bold border ${bgClass}`}>
            <Award className="w-3.5 h-3.5" />
            +{points} pts
          </span>
        );
      default:
        return null;
    }
  }

  return null;
}
