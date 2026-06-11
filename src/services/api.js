import { supabase, hasSupabase } from '../supabaseClient';
import { calculatePoints, getPredictionStats } from '../utils/points';
import initialMatches from '../matches.json';

// Local storage keys
const LS_PARTICIPANTS = 'wcup_pool_participants';
const LS_PREDICTIONS = 'wcup_pool_predictions';
const LS_MATCHES = 'wcup_pool_matches';
const LS_SESSION = 'wcup_pool_session';

// Helper to initialize local storage data for Offline Demo Mode
function initLocalStorage() {
  if (!localStorage.getItem(LS_MATCHES)) {
    // Save the 104 official matches
    localStorage.setItem(LS_MATCHES, JSON.stringify(initialMatches));
  }
  if (!localStorage.getItem(LS_PARTICIPANTS)) {
    // Create a default admin and participant for demo purposes
    const demoUsers = [
      {
        id: 'demo-admin-id',
        name: 'Administrador Demo',
        email: 'admin@example.com',
        pool_code: 'MUNDIAL2026',
        is_admin: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'demo-user-id',
        name: 'Golazo Crack',
        email: 'jugador@example.com',
        pool_code: 'MUNDIAL2026',
        is_admin: false,
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(LS_PARTICIPANTS, JSON.stringify(demoUsers));
    
    // Add some mock predictions for the player
    const matches = JSON.parse(localStorage.getItem(LS_MATCHES));
    const mockPredictions = [
      {
        id: 'p1',
        participant_id: 'demo-user-id',
        match_id: matches[0].id || 'match-1', // Match 1 (Mexico vs South Africa)
        match_number: 1,
        predicted_home_goals: 2,
        predicted_away_goals: 1,
        points: 0,
        is_exact_score: false,
        is_winner_correct: false,
        updated_at: new Date().toISOString()
      },
      {
        id: 'p2',
        participant_id: 'demo-user-id',
        match_id: matches[1].id || 'match-2', // Match 2 (Rep. of Korea vs Czech Rep.)
        match_number: 2,
        predicted_home_goals: 1,
        predicted_away_goals: 1,
        points: 0,
        is_exact_score: false,
        is_winner_correct: false,
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(LS_PREDICTIONS, JSON.stringify(mockPredictions));
  }
}

// Call initialization
if (!hasSupabase) {
  initLocalStorage();
}

export const api = {
  // --- AUTHENTICATION ---
  
  async signUp(email, password, name, poolCode) {
    if (poolCode.trim().toUpperCase() !== 'MUNDIAL2026') {
      throw new Error('Código de polla inválido. Contacta al administrador.');
    }

    if (hasSupabase) {
      // 1. Supabase Auth Sign Up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
            pool_code: poolCode.trim().toUpperCase(),
            // Automatically make admin if email is admin@example.com
            is_admin: email.toLowerCase() === 'admin@example.com'
          }
        }
      });
      if (error) throw error;
      return data.user;
    } else {
      // Local Storage simulation
      const users = JSON.parse(localStorage.getItem(LS_PARTICIPANTS) || '[]');
      if (users.find(u => u.email === email)) {
        throw new Error('El correo electrónico ya está registrado.');
      }
      
      const newUser = {
        id: 'usr-' + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        email: email.trim(),
        pool_code: poolCode.trim().toUpperCase(),
        is_admin: email.toLowerCase() === 'admin@example.com',
        created_at: new Date().toISOString()
      };
      
      users.push(newUser);
      localStorage.setItem(LS_PARTICIPANTS, JSON.stringify(users));
      localStorage.setItem(LS_SESSION, JSON.stringify(newUser));
      return newUser;
    }
  },

  async signIn(email, password) {
    if (hasSupabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      
      // Fetch participant profile
      let { data: profile, error: profileError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
        
      if (profileError) throw profileError;

      if (!profile) {
        // Create participant profile on the fly
        const { data: newProfile, error: insertError } = await supabase
          .from('participants')
          .insert({
            id: data.user.id,
            name: data.user.user_metadata?.name || email.split('@')[0],
            email: data.user.email,
            pool_code: data.user.user_metadata?.pool_code || 'MUNDIAL2026',
            is_admin: data.user.email === 'admin@example.com' || !!data.user.user_metadata?.is_admin
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        profile = newProfile;
      }
      
      return { ...data.user, ...profile };
    } else {
      const users = JSON.parse(localStorage.getItem(LS_PARTICIPANTS) || '[]');
      const user = users.find(u => u.email === email);
      if (!user) {
        throw new Error('Credenciales incorrectas o usuario no registrado.');
      }
      localStorage.setItem(LS_SESSION, JSON.stringify(user));
      return user;
    }
  },

  async signOut() {
    if (hasSupabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      localStorage.removeItem(LS_SESSION);
    }
  },

  async getCurrentUser() {
    if (hasSupabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      let { data: profile, error: profileError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (!profile && !profileError) {
        // Create participant profile on the fly
        const { data: newProfile } = await supabase
          .from('participants')
          .insert({
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            email: session.user.email,
            pool_code: session.user.user_metadata?.pool_code || 'MUNDIAL2026',
            is_admin: session.user.email === 'admin@example.com' || !!session.user.user_metadata?.is_admin
          })
          .select()
          .single();
          
        profile = newProfile;
      }
        
      return profile ? { ...session.user, ...profile } : null;
    } else {
      return JSON.parse(localStorage.getItem(LS_SESSION) || 'null');
    }
  },

  // --- MATCHES ---

  async getMatches() {
    if (hasSupabase) {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_number', { ascending: true });
      if (error) throw error;
      return data;
    } else {
      return JSON.parse(localStorage.getItem(LS_MATCHES) || '[]');
    }
  },

  async updateMatch(matchId, updateData) {
    // updateData has actual_home_goals, actual_away_goals, status, home_team, away_team
    if (hasSupabase) {
      const { data, error } = await supabase
        .from('matches')
        .update({
          actual_home_goals: updateData.actual_home_goals,
          actual_away_goals: updateData.actual_away_goals,
          status: updateData.status,
          home_team: updateData.home_team,
          away_team: updateData.away_team,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      // Local Storage simulation with manual points recalculation (mirroring the DB trigger)
      const matches = JSON.parse(localStorage.getItem(LS_MATCHES) || '[]');
      const isNumeric = typeof matchId === 'number' || (typeof matchId === 'string' && /^\d+$/.test(matchId));
      const matchIndex = matches.findIndex(m => m.id === matchId || (isNumeric && m.match_number === parseInt(matchId, 10)));
      if (matchIndex === -1) throw new Error('Partido no encontrado.');

      const oldMatch = matches[matchIndex];
      const newMatch = {
        ...oldMatch,
        ...updateData,
        updated_at: new Date().toISOString()
      };
      matches[matchIndex] = newMatch;
      localStorage.setItem(LS_MATCHES, JSON.stringify(matches));

      // Recycle points if match has transitioned to finished
      if (newMatch.status === 'finished') {
        const predictions = JSON.parse(localStorage.getItem(LS_PREDICTIONS) || '[]');
        const updatedPredictions = predictions.map(pred => {
          if (pred.match_id === matchId || pred.match_number === newMatch.match_number) {
            const points = calculatePoints(
              pred.predicted_home_goals,
              pred.predicted_away_goals,
              newMatch.actual_home_goals,
              newMatch.actual_away_goals
            );
            const { isExact, isWinnerCorrect } = getPredictionStats(
              pred.predicted_home_goals,
              pred.predicted_away_goals,
              newMatch.actual_home_goals,
              newMatch.actual_away_goals
            );
            return {
              ...pred,
              points,
              is_exact_score: isExact,
              is_winner_correct: isWinnerCorrect,
              updated_at: new Date().toISOString()
            };
          }
          return pred;
        });
        localStorage.setItem(LS_PREDICTIONS, JSON.stringify(updatedPredictions));
      } else if (oldMatch.status === 'finished' && newMatch.status !== 'finished') {
        // Reset points if changed back
        const predictions = JSON.parse(localStorage.getItem(LS_PREDICTIONS) || '[]');
        const updatedPredictions = predictions.map(pred => {
          if (pred.match_id === matchId || pred.match_number === newMatch.match_number) {
            return {
              ...pred,
              points: 0,
              is_exact_score: false,
              is_winner_correct: false,
              updated_at: new Date().toISOString()
            };
          }
          return pred;
        });
        localStorage.setItem(LS_PREDICTIONS, JSON.stringify(updatedPredictions));
      }

      return newMatch;
    }
  },

  // --- PREDICTIONS ---

  async getMyPredictions(userId) {
    if (hasSupabase) {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('participant_id', userId);
      if (error) throw error;
      return data;
    } else {
      const predictions = JSON.parse(localStorage.getItem(LS_PREDICTIONS) || '[]');
      return predictions.filter(p => p.participant_id === userId);
    }
  },

  async getAllPredictions() {
    if (hasSupabase) {
      // Returns all predictions with user information (used in match details and admin views)
      const { data, error } = await supabase
        .from('predictions')
        .select(`
          id,
          match_id,
          predicted_home_goals,
          predicted_away_goals,
          points,
          is_exact_score,
          is_winner_correct,
          participant_id,
          participants (
            name
          )
        `);
      if (error) throw error;
      
      // Format response to flatten participant name
      return data.map(p => ({
        ...p,
        participant_name: p.participants?.name || 'Desconocido'
      }));
    } else {
      const predictions = JSON.parse(localStorage.getItem(LS_PREDICTIONS) || '[]');
      const users = JSON.parse(localStorage.getItem(LS_PARTICIPANTS) || '[]');
      
      return predictions.map(p => {
        const u = users.find(usr => usr.id === p.participant_id);
        return {
          ...p,
          participant_name: u ? u.name : 'Desconocido'
        };
      });
    }
  },

  async savePrediction(userId, matchId, homeGoals, awayGoals) {
    const isNumeric = typeof matchId === 'number' || (typeof matchId === 'string' && /^\d+$/.test(matchId));
    const match = matches.find(m => m.id === matchId || (isNumeric && m.match_number === parseInt(matchId, 10)));
    if (!match) throw new Error('Partido no encontrado.');

    // Check if match already started
    const matchTime = new Date(match.match_date).getTime();
    const now = new Date().getTime();
    if (match.status !== 'pending' || now >= matchTime) {
      throw new Error('Este partido ya comenzó o finalizó. La predicción está bloqueada.');
    }

    if (hasSupabase) {
      // UPSERT prediction
      const { data, error } = await supabase
        .from('predictions')
        .upsert(
          {
            participant_id: userId,
            match_id: match.id,
            predicted_home_goals: homeGoals,
            predicted_away_goals: awayGoals,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'participant_id,match_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const predictions = JSON.parse(localStorage.getItem(LS_PREDICTIONS) || '[]');
      const matchIndex = predictions.findIndex(
        p => p.participant_id === userId && (p.match_id === matchId || p.match_number === match.match_number)
      );

      const predictionData = {
        id: matchIndex !== -1 ? predictions[matchIndex].id : 'pred-' + Math.random().toString(36).substr(2, 9),
        participant_id: userId,
        match_id: match.id || matchId,
        match_number: match.match_number,
        predicted_home_goals: parseInt(homeGoals, 10),
        predicted_away_goals: parseInt(awayGoals, 10),
        points: 0,
        is_exact_score: false,
        is_winner_correct: false,
        updated_at: new Date().toISOString()
      };

      if (matchIndex !== -1) {
        predictions[matchIndex] = predictionData;
      } else {
        predictions.push(predictionData);
      }
      
      localStorage.setItem(LS_PREDICTIONS, JSON.stringify(predictions));
      return predictionData;
    }
  },

  // --- LEADERBOARD ---

  async getLeaderboard() {
    if (hasSupabase) {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*');
      if (error) throw error;
      
      // Sort leaderboard
      return data.sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        if (b.exact_scores !== a.exact_scores) return b.exact_scores - a.exact_scores;
        if (b.winner_hits !== a.winner_hits) return b.winner_hits - a.winner_hits;
        return a.name.localeCompare(b.name);
      });
    } else {
      const users = JSON.parse(localStorage.getItem(LS_PARTICIPANTS) || '[]');
      const predictions = JSON.parse(localStorage.getItem(LS_PREDICTIONS) || '[]');
      const matches = JSON.parse(localStorage.getItem(LS_MATCHES) || '[]');

      const board = users.map(user => {
        const userPreds = predictions.filter(p => p.participant_id === user.id);
        
        let total_points = 0;
        let exact_scores = 0;
        let winner_hits = 0;
        let failed_predictions = 0;
        let total_predictions = userPreds.length;
        
        userPreds.forEach(pred => {
          const match = matches.find(m => m.id === pred.match_id || m.match_number === pred.match_number);
          if (match && match.status === 'finished') {
            const points = calculatePoints(
              pred.predicted_home_goals,
              pred.predicted_away_goals,
              match.actual_home_goals,
              match.actual_away_goals
            );
            total_points += points;
            
            const { isExact, isWinnerCorrect } = getPredictionStats(
              pred.predicted_home_goals,
              pred.predicted_away_goals,
              match.actual_home_goals,
              match.actual_away_goals
            );
            
            if (isExact) {
              exact_scores++;
            } else if (isWinnerCorrect) {
              winner_hits++;
            } else {
              failed_predictions++;
            }
          }
        });

        return {
          participant_id: user.id,
          name: user.name,
          total_points,
          exact_scores,
          winner_hits,
          failed_predictions,
          total_predictions
        };
      });

      // Sort according to rules
      return board.sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        if (b.exact_scores !== a.exact_scores) return b.exact_scores - a.exact_scores;
        if (b.winner_hits !== a.winner_hits) return b.winner_hits - a.winner_hits;
        return a.name.localeCompare(b.name);
      });
    }
  }
};
