import React from 'react';
import { Trophy, Download, Award, Target, Check, AlertTriangle } from 'lucide-react';

export default function LeaderboardTable({ leaderboard, currentUserId }) {
  
  const handleExportCSV = () => {
    if (!leaderboard || leaderboard.length === 0) return;

    const headers = [
      'Posición', 
      'Nombre', 
      'Puntos Totales', 
      'Marcadores Exactos (3 pts)', 
      'Ganadores/Empates Acertados (1 pt)', 
      'Pronósticos Fallados', 
      'Total Pronósticos'
    ];

    const rows = leaderboard.map((player, idx) => [
      idx + 1,
      player.name,
      player.total_points,
      player.exact_scores,
      player.winner_hits,
      player.failed_predictions,
      player.total_predictions
    ]);

    // Use CSV string with UTF-8 BOM so Excel opens Spanish characters correctly
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Polla_Mundialista_Ranking_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPositionBadge = (index) => {
    switch (index) {
      case 0:
        return (
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-extrabold text-xs shadow-md shadow-amber-500/10">
            🥇
          </span>
        );
      case 1:
        return (
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-300/20 border border-slate-300/40 text-slate-300 font-extrabold text-xs shadow-md shadow-slate-300/10">
            🥈
          </span>
        );
      case 2:
        return (
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 border border-amber-700/40 text-amber-600 font-extrabold text-xs shadow-md shadow-amber-700/10">
            🥉
          </span>
        );
      default:
        return (
          <span className="text-slate-500 font-bold text-xs pl-2.5">
            {index + 1}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header and Download */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            Tabla de Posiciones
          </h2>
          <p className="text-xs text-slate-400">
            Ordenado por puntos, marcadores exactos y ganadores.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!leaderboard || leaderboard.length === 0}
          className="flex items-center gap-1.5 py-2 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 disabled:opacity-40 disabled:active:scale-100 rounded-xl text-xs font-bold text-slate-300 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar CSV
        </button>
      </div>

      {/* Leaderboard Table Container */}
      <div className="glass-panel border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-5 text-center w-16">Pos</th>
                <th className="py-4 px-4">Participante</th>
                <th className="py-4 px-4 text-center">Puntos</th>
                <th className="py-4 px-4 text-center">🎯 Exactos</th>
                <th className="py-4 px-4 text-center">✅ Ganador</th>
                <th className="py-4 px-4 text-center">❌ Fallados</th>
                <th className="py-4 px-4 text-center">📋 Jugados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((player, idx) => {
                  const isCurrentUser = player.participant_id === currentUserId;
                  return (
                    <tr 
                      key={player.participant_id} 
                      className={`hover:bg-slate-800/20 transition-all ${isCurrentUser ? 'bg-soccer/5 border-l-4 border-l-soccer' : ''}`}
                    >
                      <td className="py-4 px-5 text-center flex justify-center items-center">
                        {getPositionBadge(idx)}
                      </td>
                      <td className="py-4 px-4 font-semibold text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className={isCurrentUser ? 'text-soccer-light font-black' : 'text-slate-100'}>
                            {player.name}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[9px] bg-soccer/20 border border-soccer-light/20 text-soccer-light px-1.5 py-0.5 rounded font-black uppercase">
                              Tú
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-black text-base text-gold">
                        {player.total_points}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-300 font-bold text-sm">
                        {player.exact_scores}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-300 font-medium text-sm">
                        {player.winner_hits}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-400 font-medium text-sm">
                        {player.failed_predictions}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-500 font-semibold text-xs">
                        {player.total_predictions}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-sm text-slate-500 font-medium">
                    No hay participantes registrados todavía. ¡Sé el primero!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standing Guide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/40 p-4 border border-slate-800/40 rounded-2xl mt-1 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-gold font-bold">3 pts</span>
          <span>Marcador exacto acertado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-blue-400 font-bold">1 pt</span>
          <span>Ganador o empate acertado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold">0 pts</span>
          <span>Incorrecto o sin pronóstico</span>
        </div>
        <div className="flex items-center gap-1.5 sm:justify-end">
          <span className="text-soccer font-bold">Criterio:</span>
          <span>Puntos &gt; Exactos &gt; Ganador</span>
        </div>
      </div>
    </div>
  );
}
