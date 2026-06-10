import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getTeamFlag } from './MatchCard';
import { Edit2, ShieldAlert, Award, Save, RefreshCw, Eye, ListFilter, Download } from 'lucide-react';

export default function AdminDashboard({ matches, predictions, onMatchUpdated, onRefreshData }) {
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  
  // Form state
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeGoals, setHomeGoals] = useState('');
  const [awayGoals, setAwayGoals] = useState('');
  const [status, setStatus] = useState('pending');
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [adminFilter, setAdminFilter] = useState('all'); // 'all', 'pending', 'in_progress', 'finished'

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  // Set form values when match selection changes
  useEffect(() => {
    if (selectedMatch) {
      setHomeTeam(selectedMatch.home_team);
      setAwayTeam(selectedMatch.away_team);
      setHomeGoals(selectedMatch.actual_home_goals !== null && selectedMatch.actual_home_goals !== undefined ? selectedMatch.actual_home_goals : '');
      setAwayGoals(selectedMatch.actual_away_goals !== null && selectedMatch.actual_away_goals !== undefined ? selectedMatch.actual_away_goals : '');
      setStatus(selectedMatch.status);
      setMessage(null);
    }
  }, [selectedMatch]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;

    setSaving(true);
    setMessage(null);

    const updateData = {
      home_team: homeTeam.trim(),
      away_team: awayTeam.trim(),
      status: status,
      actual_home_goals: homeGoals === '' ? null : parseInt(homeGoals, 10),
      actual_away_goals: awayGoals === '' ? null : parseInt(awayGoals, 10),
    };

    try {
      await api.updateMatch(selectedMatch.id, updateData);
      setMessage({ type: 'success', text: 'Partido y puntajes actualizados con éxito.' });
      onMatchUpdated(); // Trigger parent reload
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Error al actualizar.' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportPredictionsCSV = () => {
    if (!predictions || predictions.length === 0) return;

    const headers = [
      'Participante',
      'Fase',
      'No. Partido',
      'Local',
      'Visitante',
      'Pronóstico Local',
      'Pronóstico Visitante',
      'Puntos',
      'Marcador Exacto',
      'Ganador Acertado'
    ];

    const rows = predictions.map(p => {
      const m = matches.find(match => match.id === p.match_id || match.match_number === p.match_number);
      return [
        p.participant_name || 'Desconocido',
        m ? m.phase : '-',
        p.match_number || (m ? m.match_number : '-'),
        m ? m.home_team : '-',
        m ? m.away_team : '-',
        p.predicted_home_goals,
        p.predicted_away_goals,
        p.points,
        p.is_exact_score ? 'SÍ' : 'NO',
        p.is_winner_correct ? 'SÍ' : 'NO'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Polla_Mundialista_Todos_Los_Pronosticos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter matches for admin list
  const filteredMatches = matches.filter(m => {
    if (adminFilter === 'all') return true;
    return m.status === adminFilter;
  });

  // Get predictions for the selected match
  const selectedMatchPredictions = predictions.filter(
    p => p.match_id === selectedMatchId || p.match_number === selectedMatch?.match_number
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Col 1: Matches list */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-gold" />
              Gestión de Partidos
            </h2>
            <p className="text-xs text-slate-400">Selecciona un partido para editar.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPredictionsCSV}
              disabled={!predictions || predictions.length === 0}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 disabled:opacity-40 disabled:hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
              title="Exportar todos los pronósticos a CSV"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={onRefreshData}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
              title="Recargar datos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['all', 'pending', 'in_progress', 'finished'].map(f => (
            <button
              key={f}
              onClick={() => setAdminFilter(f)}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${
                adminFilter === f
                  ? 'bg-soccer text-white border-soccer shadow-md shadow-soccer/10'
                  : 'bg-slate-900 text-slate-400 border-slate-800/80 hover:bg-slate-800/50'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'in_progress' ? 'En Juego' : 'Finalizados'}
            </button>
          ))}
        </div>

        {/* Scrollable list */}
        <div className="glass-panel border-slate-800/80 rounded-2xl p-2 max-h-[500px] overflow-y-auto flex flex-col gap-1">
          {filteredMatches.length > 0 ? (
            filteredMatches.map(m => {
              const isSelected = m.id === selectedMatchId;
              return (
                <button
                  key={m.id || m.match_number}
                  onClick={() => setSelectedMatchId(m.id)}
                  className={`w-full p-3 rounded-xl flex items-center justify-between transition-all text-left ${
                    isSelected 
                      ? 'bg-soccer/10 border border-soccer text-white' 
                      : 'bg-slate-950/40 hover:bg-slate-900 border border-transparent hover:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 max-w-[70%]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 font-bold border border-slate-800">
                        P{m.match_number}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold truncate max-w-[80px] uppercase">
                        {m.phase}
                      </span>
                    </div>
                    <div className="text-xs font-bold mt-1 flex items-center gap-1">
                      <span>{getTeamFlag(m.home_team)} {m.home_team}</span>
                      <span className="text-slate-500 font-extrabold text-[10px]">vs</span>
                      <span>{getTeamFlag(m.away_team)} {m.away_team}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {m.status === 'finished' ? (
                      <span className="text-xs font-black bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                        {m.actual_home_goals} - {m.actual_away_goals}
                      </span>
                    ) : m.status === 'in_progress' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">Pend</span>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-6 text-center text-xs text-slate-500 font-semibold">
              No hay partidos con este estado.
            </div>
          )}
        </div>
      </div>

      {/* Col 2 & 3: Editor and Prediction Grid */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {selectedMatch ? (
          <>
            {/* Editor panel */}
            <div className="glass-panel border-slate-800 rounded-3xl p-6 shadow-xl relative">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-1.5">
                <Edit2 className="w-4.5 h-4.5 text-soccer" />
                Actualizar Partido {selectedMatch.match_number} ({selectedMatch.phase})
              </h3>

              {message && (
                <div className={`mb-6 p-4 rounded-xl text-sm border ${
                  message.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Home Team edit (mostly for playoffs placeholder replacements) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Equipo 1 (Local)
                    </label>
                    <input
                      type="text"
                      required
                      value={homeTeam}
                      onChange={(e) => setHomeTeam(e.target.value)}
                      placeholder="Placeholders tipo W74 o Nombre"
                      className="w-full glass-input px-4 py-2.5 text-sm"
                    />
                  </div>

                  {/* Away Team edit */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Equipo 2 (Visitante)
                    </label>
                    <input
                      type="text"
                      required
                      value={awayTeam}
                      onChange={(e) => setAwayTeam(e.target.value)}
                      placeholder="Placeholders tipo W77 o Nombre"
                      className="w-full glass-input px-4 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Score Team 1 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Goles Equipo 1
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={homeGoals}
                      onChange={(e) => setHomeGoals(e.target.value)}
                      placeholder="Sin goles"
                      className="w-full glass-input px-4 py-2.5 text-sm font-bold text-center"
                    />
                  </div>

                  {/* Score Team 2 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Goles Equipo 2
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={awayGoals}
                      onChange={(e) => setAwayGoals(e.target.value)}
                      placeholder="Sin goles"
                      className="w-full glass-input px-4 py-2.5 text-sm font-bold text-center"
                    />
                  </div>

                  {/* Match status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Estado del Partido
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full glass-input px-4 py-2.5 text-sm bg-slate-950 font-bold"
                    >
                      <option value="pending" className="bg-slate-950">Pendiente</option>
                      <option value="in_progress" className="bg-slate-950">En Juego</option>
                      <option value="finished" className="bg-slate-950">Finalizado</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-slate-500 font-medium">
                    {status === 'finished' && (
                      <span className="text-amber-400 font-bold">
                        ⚠️ Al guardar como 'Finalizado', se recalcularán automáticamente los puntos de todas las predicciones.
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 py-2.5 px-4 bg-soccer hover:bg-soccer-light text-white rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 rounded-full border border-white/30 border-t-white animate-spin"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>

            {/* Prediction Grid for selected Match */}
            <div className="glass-panel border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-1.5">
                <Eye className="w-4.5 h-4.5 text-slate-400" />
                Pronósticos de los Participantes ({selectedMatchPredictions.length})
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Participante</th>
                      <th className="py-3 px-3 text-center">Pronóstico</th>
                      <th className="py-3 px-3 text-center">Estado</th>
                      <th className="py-3 px-3 text-center">Puntos Ganados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {selectedMatchPredictions.length > 0 ? (
                      selectedMatchPredictions.map(p => (
                        <tr key={p.id} className="hover:bg-slate-800/10">
                          <td className="py-3 px-3 font-semibold text-slate-200">
                            {p.participant_name}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-100 bg-slate-900/30">
                            {p.predicted_home_goals} - {p.predicted_away_goals}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {p.is_exact_score ? (
                              <span className="text-[10px] bg-gold/10 text-gold border border-gold/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wide">
                                Exacto 🎯
                              </span>
                            ) : p.is_winner_correct ? (
                              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                Acertado ✅
                              </span>
                            ) : selectedMatch.status === 'finished' ? (
                              <span className="text-[10px] bg-slate-850 text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded font-medium uppercase">
                                Incorrecto
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                Registrado
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-black text-sm text-gold">
                            {selectedMatch.status === 'finished' ? `+${p.points} pts` : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-slate-500 font-medium">
                          Nadie ha hecho un pronóstico para este partido todavía.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-panel border-slate-800 rounded-3xl p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <ShieldAlert className="w-10 h-10 text-slate-700" />
            <div className="font-semibold text-sm">Ningún Partido Seleccionado</div>
            <p className="text-xs text-slate-500 max-w-xs">
              Por favor, selecciona uno de los partidos en la lista de la izquierda para ingresar marcadores, editar nombres de equipos o ver los pronósticos de los participantes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
