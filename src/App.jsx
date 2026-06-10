import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { hasSupabase } from './supabaseClient';
import LoginScreen from './components/LoginScreen';
import MatchCard from './components/MatchCard';
import LeaderboardTable from './components/LeaderboardTable';
import AdminDashboard from './components/AdminDashboard';
import MatchDetail from './components/MatchDetail';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Calendar, 
  User, 
  ShieldAlert, 
  LogOut, 
  AlertTriangle, 
  Activity, 
  Compass,
  CheckSquare,
  Bookmark
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Data state
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Tabs and details
  const [activeTab, setActiveTab] = useState('matches'); // 'matches', 'leaderboard', 'predictions', 'admin'
  const [selectedMatchDetail, setSelectedMatchDetail] = useState(null);

  // Matches filter states
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'finished', 'my_predictions', 'missing_predictions'

  // Load current session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const user = await api.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Error restoring session:', err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkSession();
  }, []);

  // Fetch match and leaderboard data when user logs in
  const loadData = async () => {
    if (!currentUser) return;
    setDataLoading(true);
    try {
      const [fetchedMatches, allPredictions, fetchedLeaderboard] = await Promise.all([
        api.getMatches(),
        api.getAllPredictions(),
        api.getLeaderboard()
      ]);
      
      setMatches(fetchedMatches);
      setPredictions(allPredictions);
      setLeaderboard(fetchedLeaderboard);
    } catch (err) {
      console.error('Error fetching pool data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    // Default to admin tab if admin logging in
    if (user.is_admin) {
      setActiveTab('admin');
    } else {
      setActiveTab('matches');
    }
  };

  const handleLogout = async () => {
    try {
      await api.signOut();
      setCurrentUser(null);
      setMatches([]);
      setPredictions([]);
      setLeaderboard([]);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleSavePrediction = async (matchId, homeGoals, awayGoals) => {
    if (!currentUser) return;
    
    // Save prediction
    const saved = await api.savePrediction(currentUser.id, matchId, homeGoals, awayGoals);
    
    // Trigger celebratory confetti burst!
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#4ade80', '#16a34a', '#eab308', '#ffffff']
    });

    // Refresh data
    await loadData();
    return saved;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-soccer/20 border-t-soccer animate-spin"></div>
        <span className="text-slate-400 font-semibold text-sm">Cargando aplicación...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Find if tournament has started (Match 1 has started or finished, or its date is in the past)
  const firstMatch = matches.find(m => m.match_number === 1);
  const tournamentStarted = firstMatch 
    ? (firstMatch.status !== 'pending' || new Date().getTime() >= new Date(firstMatch.match_date).getTime())
    : false;

  // Helper to extract user's predictions mapping
  const myPredictionsMap = {};
  predictions
    .filter(p => p.participant_id === currentUser.id)
    .forEach(p => {
      myPredictionsMap[p.match_id || p.match_number] = p;
    });

  // Filtering matches
  const filteredMatches = matches.filter(m => {
    // 1. Phase Filter
    if (phaseFilter !== 'all' && m.phase !== phaseFilter) {
      return false;
    }

    // 2. Status/Prediction Filter
    const userHasPred = !!myPredictionsMap[m.id || m.match_number];
    const matchTime = new Date(m.match_date).getTime();
    const isLocked = m.status !== 'pending' || new Date().getTime() >= matchTime;

    switch (statusFilter) {
      case 'pending':
        return m.status === 'pending' && !isLocked;
      case 'finished':
        return m.status === 'finished';
      case 'my_predictions':
        return userHasPred;
      case 'missing_predictions':
        return !userHasPred && !isLocked;
      case 'all':
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-6">
      {/* Top Navigation / Header */}
      <header className="glass-panel border-b border-slate-900 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-soccer to-soccer-dark border border-soccer-light/20 rounded-xl text-gold shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white leading-tight">
                Polla Mundialista
              </h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Mundial 2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right hidden sm:block">
              <span className="text-xs font-black text-slate-200">{currentUser.name}</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">
                {currentUser.is_admin ? '🛡️ Administrador' : '⚽ Participante'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 bg-slate-950/40 hover:bg-rose-500/10 border border-slate-900 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors active:scale-95"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1">
        {/* Offline Demo Banner */}
        {!hasSupabase && (
          <div className="mb-6 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Modo Demo Offline:</strong> Los datos se guardan de forma local en este navegador. Las configuraciones de Supabase están pendientes.
              </span>
            </div>
            <span className="text-[9px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded uppercase shrink-0">
              Demo Local
            </span>
          </div>
        )}

        {/* Loading Overlay */}
        {dataLoading && matches.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-soccer/20 border-t-soccer animate-spin"></div>
            <span className="text-slate-500 font-semibold text-xs">Cargando datos del mundial...</span>
          </div>
        ) : (
          <>
            {/* MATCHES TAB */}
            {activeTab === 'matches' && (
              <div className="flex flex-col gap-6">
                {/* Filters Row */}
                <div className="glass-panel border-slate-800/80 rounded-3xl p-5 flex flex-col gap-4 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-soccer" />
                      Calendario de Partidos ({filteredMatches.length})
                    </h2>
                    
                    {/* Status filter selection */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                      {[
                        { id: 'all', label: 'Todos' },
                        { id: 'pending', label: 'Próximos' },
                        { id: 'finished', label: 'Jugados' },
                        { id: 'my_predictions', label: 'Mis pronósticos' },
                        { id: 'missing_predictions', label: 'Sin pronosticar' }
                      ].map(sf => (
                        <button
                          key={sf.id}
                          onClick={() => setStatusFilter(sf.id)}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                            statusFilter === sf.id
                              ? 'bg-soccer text-white border-soccer shadow-md shadow-soccer/10'
                              : 'bg-slate-950/40 text-slate-400 border-slate-900 hover:bg-slate-900/50'
                          }`}
                        >
                          {sf.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phase Filter Selection */}
                  <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-900 pt-3.5">
                    {[
                      { id: 'all', label: 'Todas las fases' },
                      { id: 'Group Stage', label: 'Grupos' },
                      { id: 'Round of 32', label: 'Dieciseisavos (32)' },
                      { id: 'Round of 16', label: 'Octavos (16)' },
                      { id: 'Quarter-finals', label: 'Cuartos' },
                      { id: 'Semi-finals', label: 'Semifinal' },
                      { id: 'Third Place', label: '3er Puesto' },
                      { id: 'Final', label: 'Final' }
                    ].map(pf => (
                      <button
                        key={pf.id}
                        onClick={() => setPhaseFilter(pf.id)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap ${
                          phaseFilter === pf.id
                            ? 'bg-slate-100 text-slate-950 border-slate-100 shadow-sm'
                            : 'bg-slate-950/20 text-slate-500 border-slate-900 hover:text-slate-300'
                        }`}
                      >
                        {pf.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Match Grid */}
                {filteredMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMatches.map(m => {
                      const userPred = myPredictionsMap[m.id || m.match_number];
                      return (
                        <MatchCard
                          key={m.id || m.match_number}
                          match={m}
                          userPrediction={userPred}
                          onSavePrediction={handleSavePrediction}
                          onViewDetail={setSelectedMatchDetail}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="glass-panel border-slate-800 rounded-3xl p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                    <Compass className="w-10 h-10 text-slate-700" />
                    <div className="font-semibold text-sm">No se encontraron partidos</div>
                    <p className="text-xs text-slate-500 max-w-xs leading-normal">
                      Intenta cambiar tus filtros de fase o de estado de pronósticos en la parte superior.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* LEADERBOARD TAB */}
            {activeTab === 'leaderboard' && (
              <LeaderboardTable 
                leaderboard={leaderboard} 
                currentUserId={currentUser.id} 
              />
            )}

            {/* ADMIN TAB */}
            {activeTab === 'admin' && currentUser.is_admin && (
              <AdminDashboard
                matches={matches}
                predictions={predictions}
                onMatchUpdated={async () => {
                  await loadData();
                }}
                onRefreshData={loadData}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation Bar for Mobile */}
      <nav className="glass-panel border-t border-slate-900 fixed bottom-0 left-0 right-0 py-2.5 px-4 md:py-4 z-40">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* Matches Tab button */}
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${
              activeTab === 'matches'
                ? 'text-soccer bg-soccer/10 font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Calendar className="w-5.5 h-5.5" />
            <span className="text-[10px] tracking-wide uppercase font-semibold">Partidos</span>
          </button>

          {/* Leaderboard Tab button */}
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${
              activeTab === 'leaderboard'
                ? 'text-soccer bg-soccer/10 font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Trophy className="w-5.5 h-5.5" />
            <span className="text-[10px] tracking-wide uppercase font-semibold">Ranking</span>
          </button>

          {/* Admin Tab button (only if user is admin) */}
          {currentUser.is_admin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${
                activeTab === 'admin'
                  ? 'text-soccer bg-soccer/10 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <ShieldAlert className="w-5.5 h-5.5" />
              <span className="text-[10px] tracking-wide uppercase font-semibold">Admin</span>
            </button>
          )}
        </div>
      </nav>

      {/* Match Detail Modal overlay */}
      {selectedMatchDetail && (
        <MatchDetail
          match={selectedMatchDetail}
          predictions={predictions}
          currentUser={currentUser}
          tournamentStarted={tournamentStarted}
          onClose={() => setSelectedMatchDetail(null)}
        />
      )}
    </div>
  );
}
