-- World Cup 2026 Pool - Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Participants Profiles (linked to Supabase Auth.users)
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  pool_code TEXT NOT NULL DEFAULT 'MUNDIAL2026',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- 2. Matches Table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_number INTEGER UNIQUE NOT NULL,
  phase TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_team_code TEXT,
  away_team_code TEXT,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'finished'
  actual_home_goals INTEGER,
  actual_away_goals INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 3. Predictions Table
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_home_goals INTEGER NOT NULL,
  predicted_away_goals INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  is_exact_score BOOLEAN NOT NULL DEFAULT FALSE,
  is_winner_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(participant_id, match_id)
);

-- Enable RLS for predictions
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- 4. Leaderboard View
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.id AS participant_id,
  p.name,
  COALESCE(SUM(pr.points), 0) AS total_points,
  COUNT(CASE WHEN pr.is_exact_score = TRUE THEN 1 END) AS exact_scores,
  COUNT(CASE WHEN pr.is_winner_correct = TRUE AND pr.is_exact_score = FALSE THEN 1 END) AS winner_hits,
  COUNT(CASE WHEN pr.points = 0 AND m.status = 'finished' THEN 1 END) AS failed_predictions,
  COUNT(pr.id) AS total_predictions,
  MAX(pr.updated_at) AS last_prediction_update
FROM public.participants p
LEFT JOIN public.predictions pr ON p.id = pr.participant_id
LEFT JOIN public.matches m ON pr.match_id = m.id
GROUP BY p.id, p.name;

-- 5. Row Level Security Policies

-- Matches Policies
CREATE POLICY "Allow public read access to matches"
  ON public.matches FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow admin write/update to matches"
  ON public.matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.participants
      WHERE participants.id = auth.uid() AND participants.is_admin = true
    )
  );

-- Participants Policies
CREATE POLICY "Allow read access to participants"
  ON public.participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to insert their own participant profile"
  ON public.participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own participant profile"
  ON public.participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow users to read predictions"
  ON public.predictions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to insert their own predictions"
  ON public.predictions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = participant_id
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = match_id
      AND matches.status = 'pending'
      AND matches.match_date > NOW()
    )
  );

CREATE POLICY "Allow users to update their own predictions"
  ON public.predictions FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = participant_id
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = match_id
      AND matches.status = 'pending'
      AND matches.match_date > NOW()
    )
  );

-- 6. Trigger for Point Calculations on Matches Update
CREATE OR REPLACE FUNCTION public.update_predictions_on_match_finish()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'finished' AND (OLD.status IS DISTINCT FROM 'finished' OR OLD.actual_home_goals IS DISTINCT FROM NEW.actual_home_goals OR OLD.actual_away_goals IS DISTINCT FROM NEW.actual_away_goals) THEN
    -- Update predictions points
    UPDATE public.predictions
    SET
      points = CASE
        -- Exact score: 3 points
        WHEN predicted_home_goals = NEW.actual_home_goals AND predicted_away_goals = NEW.actual_away_goals THEN 3
        -- Winner Team 1 or Winner Team 2 or Draw: 1 point
        WHEN (predicted_home_goals > predicted_away_goals AND NEW.actual_home_goals > NEW.actual_away_goals) OR
             (predicted_home_goals < predicted_away_goals AND NEW.actual_home_goals < NEW.actual_away_goals) OR
             (predicted_home_goals = predicted_away_goals AND NEW.actual_home_goals = NEW.actual_away_goals) THEN 1
        -- Default: 0 points
        ELSE 0
      END,
      is_exact_score = (predicted_home_goals = NEW.actual_home_goals AND predicted_away_goals = NEW.actual_away_goals),
      is_winner_correct = (
        (predicted_home_goals > predicted_away_goals AND NEW.actual_home_goals > NEW.actual_away_goals) OR
        (predicted_home_goals < predicted_away_goals AND NEW.actual_home_goals < NEW.actual_away_goals) OR
        (predicted_home_goals = predicted_away_goals AND NEW.actual_home_goals = NEW.actual_away_goals)
      ),
      updated_at = NOW()
    WHERE match_id = NEW.id;
  ELSIF NEW.status != 'finished' AND OLD.status = 'finished' THEN
    -- If marked back to pending/in_progress, reset points to 0
    UPDATE public.predictions
    SET
      points = 0,
      is_exact_score = FALSE,
      is_winner_correct = FALSE,
      updated_at = NOW()
    WHERE match_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_update_predictions_on_match_finish
AFTER UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.update_predictions_on_match_finish();

-- 7. Trigger to auto-create participant profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.participants (id, name, email, pool_code, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'pool_code', 'MUNDIAL2026'),
    CASE 
      WHEN NEW.email = 'admin@example.com' OR COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false) THEN true 
      ELSE false 
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Trigger to auto-calculate prediction points on insert/update (safeguard for seeder/admin additions)
CREATE OR REPLACE FUNCTION public.calculate_prediction_points_on_insert_update()
RETURNS TRIGGER AS $$
DECLARE
  match_rec RECORD;
BEGIN
  -- Fetch match status and scores
  SELECT status, actual_home_goals, actual_away_goals INTO match_rec
  FROM public.matches
  WHERE id = NEW.match_id;

  IF match_rec.status = 'finished' THEN
    NEW.points := CASE
      -- Exact score: 3 points
      WHEN NEW.predicted_home_goals = match_rec.actual_home_goals AND NEW.predicted_away_goals = match_rec.actual_away_goals THEN 3
      -- Winner Team 1 or Winner Team 2 or Draw: 1 point
      WHEN (NEW.predicted_home_goals > NEW.predicted_away_goals AND match_rec.actual_home_goals > match_rec.actual_away_goals) OR
           (NEW.predicted_home_goals < NEW.predicted_away_goals AND match_rec.actual_home_goals < match_rec.actual_away_goals) OR
           (NEW.predicted_home_goals = NEW.predicted_away_goals AND match_rec.actual_home_goals = match_rec.actual_away_goals) THEN 1
      -- Default: 0 points
      ELSE 0
    END;
    NEW.is_exact_score := (NEW.predicted_home_goals = match_rec.actual_home_goals AND NEW.predicted_away_goals = match_rec.actual_away_goals);
    NEW.is_winner_correct := (
      (NEW.predicted_home_goals > NEW.predicted_away_goals AND match_rec.actual_home_goals > match_rec.actual_away_goals) OR
      (NEW.predicted_home_goals < NEW.predicted_away_goals AND match_rec.actual_home_goals < match_rec.actual_away_goals) OR
      (NEW.predicted_home_goals = NEW.predicted_away_goals AND match_rec.actual_home_goals = match_rec.actual_away_goals)
    );
  ELSE
    NEW.points := 0;
    NEW.is_exact_score := FALSE;
    NEW.is_winner_correct := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_calculate_prediction_points_on_insert_update ON public.predictions;
CREATE TRIGGER trg_calculate_prediction_points_on_insert_update
BEFORE INSERT OR UPDATE ON public.predictions
FOR EACH ROW
EXECUTE FUNCTION public.calculate_prediction_points_on_insert_update();

