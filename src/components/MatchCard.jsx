import React from 'react';
import StatusBadge from './StatusBadge';
import CountdownToMatch from './CountdownToMatch';
import PredictionForm from './PredictionForm';
import { MapPin, Calendar, HelpCircle, Trophy } from 'lucide-react';

// Simple helper to get flag emoji or fallback
export function getTeamFlag(team) {
  if (!team) return '❓';
  
  const cleanTeam = team.trim().toLowerCase();
  
  // Mapping of common team names to flags
  const flags = {
    'mexico': '🇲🇽', 'méxico': '🇲🇽',
    'south africa': '🇿🇦', 'sudáfrica': '🇿🇦',
    'rep. of korea': '🇰🇷', 'corea del sur': '🇰🇷',
    'czech rep.': '🇨🇿', 'república checa': '🇨🇿',
    'canada': '🇨🇦', 'canadá': '🇨🇦',
    'bosnia/herzeg.': '🇧🇦', 'bosnia': '🇧🇦',
    'usa': '🇺🇸', 'eeuu': '🇺🇸', 'estados unidos': '🇺🇸',
    'paraguay': '🇵🇾',
    'haiti': '🇭🇹', 'haití': '🇭🇹',
    'scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'escocia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'australia': '🇦🇺',
    'turkey': '🇹🇷', 'turquía': '🇹🇷',
    'brazil': '🇧🇷', 'brasil': '🇧🇷',
    'morocco': '🇲🇦', 'marruecos': '🇲🇦',
    'qatar': '🇶🇦',
    'switzerland': '🇨🇭', 'suiza': '🇨🇭',
    'germany': '🇩🇪', 'alemania': '🇩🇪',
    'spain': '🇪🇸', 'españa': '🇪🇸',
    'italy': '🇮🇹', 'italia': '🇮🇹',
    'france': '🇫🇷', 'francia': '🇫🇷',
    'argentina': '🇦🇷',
    'colombia': '🇨🇴',
    'uruguay': '🇺🇾',
    'ecuador': '🇪🇨',
    'peru': '🇵🇪', 'perú': '🇵🇪',
    'chile': '🇨🇱',
    'japan': '🇯🇵', 'japón': '🇯🇵',
    'england': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿'
  };

  for (const [key, value] of Object.entries(flags)) {
    if (cleanTeam.includes(key)) {
      return value;
    }
  }

  // If it's a code placeholder (e.g. W74, 1A)
  if (/^[w|r|r]?[0-9]+/i.test(cleanTeam) || cleanTeam.length <= 4) {
    return '🛡️';
  }

  return '🏳️';
}

export default function MatchCard({ 
  match, 
  userPrediction, 
  onSavePrediction, 
  onViewDetail 
}) {
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
  const isLocked = status !== 'pending' || now >= matchTime;
  const isFinished = status === 'finished';

  // Format date nicely
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' hs';
  };

  return (
    <div className="glass-card sport-gradient overflow-hidden flex flex-col h-full group">
      {/* Card Header */}
      <div 
        onClick={() => onViewDetail(match)}
        className="px-4 pt-4 pb-2 border-b border-slate-800/40 flex items-center justify-between cursor-pointer hover:bg-slate-800/20 transition-colors"
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-soccer tracking-wider uppercase">
            {phase}
          </span>
          <span className="text-xs text-slate-400 font-semibold mt-0.5">
            Partido {match_number}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CountdownToMatch matchDate={match_date} matchStatus={status} />
          <StatusBadge type="match" value={status} />
        </div>
      </div>

      {/* Teams and Scores */}
      <div 
        onClick={() => onViewDetail(match)}
        className="px-5 py-4 flex flex-col justify-center flex-1 cursor-pointer hover:bg-slate-800/10 transition-colors"
      >
        <div className="grid grid-cols-5 items-center gap-2 text-center">
          {/* Home Team */}
          <div className="col-span-2 flex flex-col items-center gap-1.5">
            <span className="text-3xl filter drop-shadow" role="img" aria-label={home_team}>
              {getTeamFlag(home_team)}
            </span>
            <span className="text-xs font-bold text-slate-100 max-w-[85px] truncate block leading-tight">
              {home_team}
            </span>
          </div>

          {/* Goals / VS */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            {isFinished ? (
              <div className="flex items-center justify-center gap-1.5 bg-slate-950/90 py-1.5 px-3 rounded-xl border border-slate-800/80">
                <span className="text-lg font-black text-white">{actual_home_goals}</span>
                <span className="text-xs text-slate-600 font-extrabold">-</span>
                <span className="text-lg font-black text-white">{actual_away_goals}</span>
              </div>
            ) : (
              <span className="text-xs font-extrabold text-slate-600 uppercase tracking-widest bg-slate-950/30 px-2 py-0.5 rounded border border-slate-800/30">
                VS
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="col-span-2 flex flex-col items-center gap-1.5">
            <span className="text-3xl filter drop-shadow" role="img" aria-label={away_team}>
              {getTeamFlag(away_team)}
            </span>
            <span className="text-xs font-bold text-slate-100 max-w-[85px] truncate block leading-tight">
              {away_team}
            </span>
          </div>
        </div>

        {/* Venue and date */}
        <div className="flex flex-col items-center gap-1 mt-4 text-[10px] text-slate-500 font-semibold">
          <div className="flex items-center gap-1 text-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>{formatDate(match_date)}</span>
          </div>
          <div className="flex items-center gap-1 justify-center">
            <MapPin className="w-3.5 h-3.5 text-slate-600" />
            <span className="truncate max-w-[150px]">{venue}</span>
          </div>
        </div>
      </div>

      {/* Prediction Area */}
      <div className="p-4 bg-slate-950/50 border-t border-slate-900 flex flex-col items-center justify-center min-h-[92px]">
        {phase !== 'Group Stage' ? (
          <div className="flex flex-col items-center justify-center gap-1 w-full text-center py-1">
            <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
              🔒 Fase 2 - Próximamente
            </span>
            <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
              Disponible en la siguiente fase
            </span>
          </div>
        ) : !isLocked ? (
          // If match hasn't started and no prediction has been saved yet
          !userPrediction ? (
            <PredictionForm
              matchId={id || match_number}
              initialHomeGoals=""
              initialAwayGoals=""
              onSave={onSavePrediction}
            />
          ) : (
            // Once saved, show read-only locked definitive prediction
            <div className="flex flex-col items-center justify-center gap-1.5 w-full text-center py-1 animate-in fade-in duration-300">
              <div className="flex items-center gap-1.5 justify-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tu Pronóstico:</span>
                <span className="text-sm font-black text-emerald-400 bg-slate-950 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                  {userPrediction.predicted_home_goals} - {userPrediction.predicted_away_goals}
                </span>
              </div>
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                🛡️ Registrado (Definitivo)
              </span>
            </div>
          )
        ) : (
          // Standard view for locked started/finished matches
          <div className="flex flex-col items-center justify-center gap-1.5 w-full text-center py-1">
            <div className="flex items-center gap-1.5 justify-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tu Pronóstico:</span>
              {userPrediction ? (
                <span className="text-sm font-black text-slate-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-850">
                  {userPrediction.predicted_home_goals} - {userPrediction.predicted_away_goals}
                </span>
              ) : (
                <StatusBadge type="prediction" value="none" />
              )}
            </div>
            
            {/* Display points won if finished */}
            {isFinished && (
              <div className="mt-1 flex items-center justify-center gap-1">
                {userPrediction ? (
                  <StatusBadge type="prediction" value="points" points={userPrediction.points} />
                ) : (
                  <StatusBadge type="prediction" value="points" points={0} />
                )}
                {userPrediction?.is_exact_score && (
                  <span className="text-[9px] text-gold font-bold uppercase tracking-wide bg-gold/10 border border-gold/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-bounce">
                    🎯 Marcador Exacto
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
