import React from 'react';
import { getTeamFlag } from './MatchCard';
import StatusBadge from './StatusBadge';
import { X, MapPin, Calendar, Lock, CheckCircle, ShieldAlert, Award } from 'lucide-react';

export default function MatchDetail({ 
  match, 
  predictions, 
  currentUser, 
  tournamentStarted = false,
  onClose 
}) {
  if (!match) return null;

  const {
    id,
    match_number,
    phase,
    home_team,
    away_team,
    match_date,
    venue,
    status,
    actual_home_goals,
    actual_away_goals
  } = match;

  const matchTime = new Date(match_date).getTime();
  const now = new Date().getTime();
  const isStarted = status !== 'pending' || now >= matchTime;
  const isFinished = status === 'finished';
  
  // Predictions are public for everyone (requested by user to be unlocked from the start)
  const isPublic = true;

  // Format date nicely
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' hs';
  };

  // Get predictions for this match
  const matchPredictions = predictions.filter(
    p => p.match_id === id || p.match_number === match_number
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Card */}
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-950/40 hover:bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60">
          <span className="text-[11px] font-bold text-soccer tracking-wider uppercase">
            {phase}
          </span>
          <h3 className="text-xl font-bold text-white mt-1">
            Partido {match_number}
          </h3>
          <div className="flex flex-col gap-1.5 mt-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="capitalize">{formatDate(match_date)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>{venue}</span>
            </div>
          </div>
        </div>

        {/* Teams Display */}
        <div className="p-6 bg-slate-950/30 border-b border-slate-800 flex items-center justify-around text-center gap-4">
          <div className="flex flex-col items-center gap-2 max-w-[40%]">
            <span className="text-4xl filter drop-shadow">{getTeamFlag(home_team)}</span>
            <span className="text-sm font-bold text-white truncate max-w-full">{home_team}</span>
          </div>

          <div className="flex flex-col items-center">
            {isFinished ? (
              <div className="flex items-center gap-2.5 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800">
                <span className="text-2xl font-black text-white">{actual_home_goals}</span>
                <span className="text-slate-600 font-extrabold">-</span>
                <span className="text-2xl font-black text-white">{actual_away_goals}</span>
              </div>
            ) : (
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800">
                vs
              </span>
            )}
            <div className="mt-2.5">
              <StatusBadge type="match" value={status} />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 max-w-[40%]">
            <span className="text-4xl filter drop-shadow">{getTeamFlag(away_team)}</span>
            <span className="text-sm font-bold text-white truncate max-w-full">{away_team}</span>
          </div>
        </div>

        {/* Predictions list */}
        <div className="p-6 max-h-[350px] overflow-y-auto">
          <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
            Pronósticos de Amigos
            <span className="py-0.5 px-2 bg-slate-800 rounded-full text-[10px] text-slate-400 font-bold">
              {matchPredictions.length}
            </span>
          </h4>

          {/* Locked message if match hasn't started and tournament hasn't started */}
          {!isPublic && (
            <div className="mb-4 p-4 bg-slate-950/80 border border-slate-850 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
              <Lock className="w-5 h-5 text-amber-500/80 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-amber-400">Pronósticos Ocultos</span>
                <span className="text-[11px] text-slate-500 leading-normal">
                  Los marcadores de los demás jugadores se revelarán cuando el partido comience o apenas ruede el primer balón del Mundial. ¡Registra el tuyo!
                </span>
              </div>
            </div>
          )}

          {/* Predictions Table */}
          <div className="flex flex-col gap-2">
            {matchPredictions.length > 0 ? (
              matchPredictions.map((pred) => {
                const isSelf = pred.participant_id === currentUser.id;
                
                // Show if it's the current user OR if the predictions are public OR if user is admin
                const shouldReveal = isSelf || isPublic || currentUser.is_admin;

                return (
                  <div 
                    key={pred.id} 
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isSelf 
                        ? 'bg-soccer/5 border-soccer/40' 
                        : 'bg-slate-950/40 border-slate-850/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${isSelf ? 'text-soccer-light font-black' : 'text-slate-200'}`}>
                        {pred.participant_name}
                      </span>
                      {isSelf && (
                        <span className="text-[9px] bg-soccer/10 text-soccer-light font-bold py-0.5 px-1.5 rounded uppercase">
                          Tú
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {shouldReveal ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                            {pred.predicted_home_goals} - {pred.predicted_away_goals}
                          </span>
                          
                          {/* Points won if finished */}
                          {isFinished && (
                            <div className="flex items-center">
                              {pred.is_exact_score ? (
                                <span className="text-[10px] font-black text-gold bg-gold/10 px-1.5 py-0.5 border border-gold/20 rounded">
                                  +3 pts
                                </span>
                              ) : pred.is_winner_correct ? (
                                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 border border-blue-500/20 rounded">
                                  +1 pt
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 border border-slate-800/80 rounded font-medium">
                                  +0 pts
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold bg-slate-900/60 border border-slate-850 px-2.5 py-1 rounded-lg">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Oculto</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 font-medium">
                Nadie ha registrado pronósticos para este partido.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-500">
          Hacer clic fuera del cuadro para cerrar detalles.
        </div>
      </div>
    </div>
  );
}
