import { RateHistory, Goal, Match } from '@/types';
import { tierRankToLP, lpToTierRank } from '@/lib/riot/client';

export interface ProgressResult {
  currentLP: number;
  targetLP: number;
  progressPercentage: number;
  lpRemaining: number;
  daysRemaining: number;
  averageLPPerDay: number;
}

export interface RequiredMatchesResult {
  matchesNeeded: number;
  daysNeeded: number;
  winRate: number;
  matchesPerDay: number;
}

/**
 * Calculate progress towards a goal
 */
export function calculateProgress(
  rateHistory: RateHistory[],
  goal: Goal
): ProgressResult | null {
  if (rateHistory.length === 0) {
    return null;
  }

  const latest = rateHistory[rateHistory.length - 1];
  const currentLP = tierRankToLP(latest.tier, latest.rank, latest.lp);
  const targetLP = tierRankToLP(goal.targetTier, goal.targetRank, goal.targetLP);

  if (currentLP >= targetLP) {
    return {
      currentLP,
      targetLP,
      progressPercentage: 100,
      lpRemaining: 0,
      daysRemaining: 0,
      averageLPPerDay: 0,
    };
  }

  const lpRemaining = targetLP - currentLP;

  // Calculate average LP change per day
  if (rateHistory.length < 2) {
    return {
      currentLP,
      targetLP,
      progressPercentage: 0,
      lpRemaining,
      daysRemaining: Infinity,
      averageLPPerDay: 0,
    };
  }

  const sortedHistory = [...rateHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstLP = tierRankToLP(
    sortedHistory[0].tier,
    sortedHistory[0].rank,
    sortedHistory[0].lp
  );
  const lastLP = tierRankToLP(
    sortedHistory[sortedHistory.length - 1].tier,
    sortedHistory[sortedHistory.length - 1].rank,
    sortedHistory[sortedHistory.length - 1].lp
  );

  const firstDate = new Date(sortedHistory[0].date);
  const lastDate = new Date(sortedHistory[sortedHistory.length - 1].date);
  const daysElapsed = Math.max(
    1,
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const averageLPPerDay = (lastLP - firstLP) / daysElapsed;

  const daysRemaining =
    averageLPPerDay > 0 ? Math.ceil(lpRemaining / averageLPPerDay) : Infinity;

  const progressPercentage = Math.min(
    100,
    (currentLP / targetLP) * 100
  );

  return {
    currentLP,
    targetLP,
    progressPercentage: Math.round(progressPercentage * 100) / 100,
    lpRemaining,
    daysRemaining: daysRemaining === Infinity ? 0 : daysRemaining,
    averageLPPerDay: Math.round(averageLPPerDay * 100) / 100,
  };
}

/**
 * Calculate required matches to reach goal based on win rate and play frequency
 */
export function calculateRequiredMatches(
  rateHistory: RateHistory[],
  matches: Match[],
  goal: Goal,
  matchesPerDay: number = 3
): RequiredMatchesResult | null {
  if (rateHistory.length === 0) {
    return null;
  }

  const latest = rateHistory[rateHistory.length - 1];
  const currentLP = tierRankToLP(latest.tier, latest.rank, latest.lp);
  const targetLP = tierRankToLP(goal.targetTier, goal.targetRank, goal.targetLP);
  const lpNeeded = targetLP - currentLP;

  if (lpNeeded <= 0) {
    return {
      matchesNeeded: 0,
      daysNeeded: 0,
      winRate: 0,
      matchesPerDay,
    };
  }

  // Calculate win rate from matches
  let winRate = 0.5; // Default 50%
  if (matches.length > 0) {
    const wins = matches.filter((m) => m.win).length;
    winRate = wins / matches.length;
  } else if (rateHistory.length > 0) {
    // Fallback to rate history win rate
    const totalWins = rateHistory.reduce((sum, r) => sum + r.wins, 0);
    const totalLosses = rateHistory.reduce((sum, r) => sum + r.losses, 0);
    const totalGames = totalWins + totalLosses;
    if (totalGames > 0) {
      winRate = totalWins / totalGames;
    }
  }

  // Average LP gain per win (assuming +15 LP per win, -15 LP per loss)
  // This is a simplified model - actual LP gains vary
  const avgLPPerMatch = winRate * 15 - (1 - winRate) * 15;
  
  if (avgLPPerMatch <= 0) {
    return null; // Cannot reach goal with current win rate
  }

  const matchesNeeded = Math.ceil(lpNeeded / avgLPPerMatch);
  const daysNeeded = Math.ceil(matchesNeeded / matchesPerDay);

  return {
    matchesNeeded,
    daysNeeded,
    winRate: Math.round(winRate * 10000) / 100, // Percentage with 2 decimals
    matchesPerDay,
  };
}

/**
 * Calculate statistics from rate history
 */
export interface RateStatistics {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  averageLPChange: number;
  totalLPChange: number;
  currentTier: string;
  currentRank: string;
  currentLP: number;
  peakLP: number;
  peakTier: string;
  peakRank: string;
}

export function calculateStatistics(rateHistory: RateHistory[]): RateStatistics | null {
  if (rateHistory.length === 0) {
    return null;
  }

  const sorted = [...rateHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const latest = sorted[sorted.length - 1];
  const first = sorted[0];

  const totalWins = sorted.reduce((sum, r) => sum + r.wins, 0);
  const totalLosses = sorted.reduce((sum, r) => sum + r.losses, 0);
  const totalGames = totalWins + totalLosses;

  const currentLP = tierRankToLP(latest.tier, latest.rank, latest.lp);
  const firstLP = tierRankToLP(first.tier, first.rank, first.lp);
  const totalLPChange = currentLP - firstLP;

  // Find peak LP
  let peakLP = currentLP;
  let peakTier = latest.tier;
  let peakRank = latest.rank;
  
  for (const entry of sorted) {
    const lp = tierRankToLP(entry.tier, entry.rank, entry.lp);
    if (lp > peakLP) {
      peakLP = lp;
      peakTier = entry.tier;
      peakRank = entry.rank;
    }
  }

  const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
  const averageLPChange = sorted.length > 1 ? totalLPChange / (sorted.length - 1) : 0;

  return {
    totalGames,
    wins: totalWins,
    losses: totalLosses,
    winRate: Math.round(winRate * 100) / 100,
    averageLPChange: Math.round(averageLPChange * 100) / 100,
    totalLPChange: Math.round(totalLPChange),
    currentTier: latest.tier,
    currentRank: latest.rank,
    currentLP: latest.lp,
    peakLP,
    peakTier,
    peakRank,
  };
}

