/**
 * Calculates the points earned for a prediction based on the actual score.
 * 
 * Rules:
 * - 3 points: Exact score match (e.g. Pred: 2-1, Actual: 2-1)
 * - 1 point: Correct winner or draw, but not exact score (e.g. Pred: 3-1, Actual: 2-1)
 * - 1 point: Pred: 1-1, Actual: 2-2 (Correct draw, but not exact)
 * - 0 points: Incorrect winner or draw, or missing prediction / actual score
 * 
 * @param {number|string} predHome - Predicted home goals
 * @param {number|string} predAway - Predicted away goals
 * @param {number|string} actualHome - Actual home goals
 * @param {number|string} actualAway - Actual away goals
 * @returns {number} Points (3, 1, or 0)
 */
export function calculatePoints(predHome, predAway, actualHome, actualAway) {
  if (predHome === null || predHome === undefined || 
      predAway === null || predAway === undefined || 
      actualHome === null || actualHome === undefined || 
      actualAway === null || actualAway === undefined) {
    return 0;
  }

  const pHome = parseInt(predHome, 10);
  const pAway = parseInt(predAway, 10);
  const aHome = parseInt(actualHome, 10);
  const aAway = parseInt(actualAway, 10);

  if (isNaN(pHome) || isNaN(pAway) || isNaN(aHome) || isNaN(aAway)) {
    return 0;
  }

  // Exact Match
  if (pHome === aHome && pAway === aAway) {
    return 3;
  }

  // Correct Winner or Draw (but not exact score)
  const predDiff = pHome - pAway;
  const actualDiff = aHome - aAway;

  const bothWonHome = predDiff > 0 && actualDiff > 0;
  const bothWonAway = predDiff < 0 && actualDiff < 0;
  const bothDraw = predDiff === 0 && actualDiff === 0;

  if (bothWonHome || bothWonAway || bothDraw) {
    return 1;
  }

  return 0;
}

/**
 * Returns detail statuses for a prediction.
 * @returns {{ isExact: boolean, isWinnerCorrect: boolean }}
 */
export function getPredictionStats(predHome, predAway, actualHome, actualAway) {
  if (predHome === null || predHome === undefined || 
      predAway === null || predAway === undefined || 
      actualHome === null || actualHome === undefined || 
      actualAway === null || actualAway === undefined) {
    return { isExact: false, isWinnerCorrect: false };
  }

  const pHome = parseInt(predHome, 10);
  const pAway = parseInt(predAway, 10);
  const aHome = parseInt(actualHome, 10);
  const aAway = parseInt(actualAway, 10);

  if (isNaN(pHome) || isNaN(pAway) || isNaN(aHome) || isNaN(aAway)) {
    return { isExact: false, isWinnerCorrect: false };
  }

  const isExact = pHome === aHome && pAway === aAway;
  
  const predDiff = pHome - pAway;
  const actualDiff = aHome - aAway;
  const bothWonHome = predDiff > 0 && actualDiff > 0;
  const bothWonAway = predDiff < 0 && actualDiff < 0;
  const bothDraw = predDiff === 0 && actualDiff === 0;
  const isWinnerCorrect = bothWonHome || bothWonAway || bothDraw;

  return { isExact, isWinnerCorrect };
}
