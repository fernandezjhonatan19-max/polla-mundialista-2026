import React, { useState } from 'react';
import { Save, Plus, Minus } from 'lucide-react';

export default function PredictionForm({ 
  matchId, 
  initialHomeGoals = '', 
  initialAwayGoals = '', 
  onSave, 
  disabled = false 
}) {
  const [homeGoals, setHomeGoals] = useState(initialHomeGoals === '' ? '' : parseInt(initialHomeGoals, 10));
  const [awayGoals, setAwayGoals] = useState(initialAwayGoals === '' ? '' : parseInt(initialAwayGoals, 10));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const increment = (type) => {
    if (disabled || saving) return;
    if (type === 'home') {
      setHomeGoals(prev => (prev === '' ? 1 : prev + 1));
    } else {
      setAwayGoals(prev => (prev === '' ? 1 : prev + 1));
    }
  };

  const decrement = (type) => {
    if (disabled || saving) return;
    if (type === 'home') {
      setHomeGoals(prev => (prev === '' || prev <= 0 ? 0 : prev - 1));
    } else {
      setAwayGoals(prev => (prev === '' || prev <= 0 ? 0 : prev - 1));
    }
  };

  const handleInputChange = (type, value) => {
    if (disabled || saving) return;
    if (value === '') {
      if (type === 'home') setHomeGoals('');
      else setAwayGoals('');
      return;
    }

    const intValue = parseInt(value, 10);
    if (isNaN(intValue) || intValue < 0) return;
    
    if (type === 'home') setHomeGoals(intValue);
    else setAwayGoals(intValue);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (disabled || saving) return;

    if (homeGoals === '' || awayGoals === '') {
      setMessage({ type: 'error', text: 'Por favor ingresa ambos marcadores.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await onSave(matchId, homeGoals, awayGoals);
      setMessage({ type: 'success', text: 'Pronóstico guardado ✅' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Error al guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const hasChanged = 
    (homeGoals !== (initialHomeGoals === '' ? '' : parseInt(initialHomeGoals, 10))) || 
    (awayGoals !== (initialAwayGoals === '' ? '' : parseInt(initialAwayGoals, 10)));

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-2.5 w-full">
      <div className="flex items-center justify-between gap-6 px-2 py-1">
        {/* Home Goals Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled || saving || homeGoals === 0}
            onClick={() => decrement('home')}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center border border-slate-700/50 text-slate-300 font-bold transition-all"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            min="0"
            disabled={disabled || saving}
            value={homeGoals}
            onChange={(e) => handleInputChange('home', e.target.value)}
            placeholder="0"
            className="w-12 h-11 text-center font-bold text-lg bg-slate-950 border border-slate-800 rounded-xl focus:border-soccer focus:ring-1 focus:ring-soccer focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            disabled={disabled || saving}
            onClick={() => increment('home')}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center border border-slate-700/50 text-slate-300 font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <span className="text-slate-500 font-extrabold text-sm tracking-wider">vs</span>

        {/* Away Goals Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled || saving || awayGoals === 0}
            onClick={() => decrement('away')}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center border border-slate-700/50 text-slate-300 font-bold transition-all"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            min="0"
            disabled={disabled || saving}
            value={awayGoals}
            onChange={(e) => handleInputChange('away', e.target.value)}
            placeholder="0"
            className="w-12 h-11 text-center font-bold text-lg bg-slate-950 border border-slate-800 rounded-xl focus:border-soccer focus:ring-1 focus:ring-soccer focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            disabled={disabled || saving}
            onClick={() => increment('away')}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center border border-slate-700/50 text-slate-300 font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action and feedback */}
      <div className="flex items-center justify-between gap-2.5 mt-1">
        <div className="text-xs font-medium min-h-[16px] flex-1">
          {message && (
            <span className={message.type === 'success' ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
              {message.text}
            </span>
          )}
        </div>
        
        <button
          type="submit"
          disabled={disabled || saving || !hasChanged || homeGoals === '' || awayGoals === ''}
          className="flex items-center gap-1.5 py-1.5 px-3 bg-soccer text-white rounded-xl text-xs font-bold hover:bg-soccer-light active:scale-95 disabled:opacity-45 disabled:active:scale-100 transition-all shadow-md shadow-soccer/10"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 rounded-full border border-white/30 border-t-white animate-spin"></div>
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          Guardar
        </button>
      </div>
    </form>
  );
}
