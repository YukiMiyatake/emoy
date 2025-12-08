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

  const sortedHistory = [...rateHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const latest = sortedHistory[sortedHistory.length - 1];
  const currentLP = tierRankToLP(latest.tier, latest.rank, latest.lp);
  const targetLP = tierRankToLP(goal.targetTier, goal.targetRank, goal.targetLP);

  // Find the starting LP at the time the goal was created
  const createdAt = new Date(goal.createdAt).getTime();
  const entriesBeforeCreatedAt = sortedHistory.filter(e => new Date(e.date).getTime() <= createdAt);
  let startLP: number;
  
  if (entriesBeforeCreatedAt.length > 0) {
    // Get the latest entry before or equal to createdAt
    const closestEntry = entriesBeforeCreatedAt[entriesBeforeCreatedAt.length - 1];
    startLP = tierRankToLP(closestEntry.tier, closestEntry.rank, closestEntry.lp);
  } else if (sortedHistory.length > 0) {
    // If no entry before createdAt, use the first entry (earliest available)
    const firstEntry = sortedHistory[0];
    startLP = tierRankToLP(firstEntry.tier, firstEntry.rank, firstEntry.lp);
  } else {
    return null;
  }

  // Calculate progress based on start LP
  const totalLPNeeded = targetLP - startLP;
  const lpGained = currentLP - startLP;
  const lpRemaining = targetLP - currentLP;

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

  // If target is lower than start (downgrade goal), handle differently
  if (totalLPNeeded <= 0) {
    // This means target is actually lower than start, which doesn't make sense for progress
    // But we'll still calculate based on absolute difference
    const absoluteNeeded = Math.abs(totalLPNeeded);
    const absoluteGained = Math.abs(lpGained);
    const progressPercentage = absoluteNeeded > 0 
      ? Math.min(100, (absoluteGained / absoluteNeeded) * 100)
      : 0;
    
    return {
      currentLP,
      targetLP,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      lpRemaining,
      daysRemaining: 0,
      averageLPPerDay: 0,
    };
  }

  // Calculate progress percentage: (LP gained / LP needed) * 100
  const progressPercentage = Math.min(100, (lpGained / totalLPNeeded) * 100);

  // Calculate average LP change per day
  if (sortedHistory.length < 2) {
    return {
      currentLP,
      targetLP,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      lpRemaining,
      daysRemaining: Infinity,
      averageLPPerDay: 0,
    };
  }

  // Use recent trend (last 60 days or half of the data, whichever is smaller)
  // This gives more weight to recent performance
  const recentDays = 60;
  const lastDate = new Date(sortedHistory[sortedHistory.length - 1].date);
  const cutoffDate = new Date(lastDate);
  cutoffDate.setDate(cutoffDate.getDate() - recentDays);
  
  // Find the index of the first entry within the recent period
  let startIndex = 0;
  for (let i = sortedHistory.length - 1; i >= 0; i--) {
    const entryDate = new Date(sortedHistory[i].date);
    if (entryDate < cutoffDate) {
      startIndex = i + 1;
      break;
    }
  }
  
  // Use at least 2 entries, or use half of the data if we have less than 60 days of data
  const minEntries = Math.max(2, Math.floor(sortedHistory.length / 2));
  const effectiveStartIndex = Math.max(0, Math.min(startIndex, sortedHistory.length - minEntries));
  
  const firstLP = tierRankToLP(
    sortedHistory[effectiveStartIndex].tier,
    sortedHistory[effectiveStartIndex].rank,
    sortedHistory[effectiveStartIndex].lp
  );
  const lastLP = tierRankToLP(
    sortedHistory[sortedHistory.length - 1].tier,
    sortedHistory[sortedHistory.length - 1].rank,
    sortedHistory[sortedHistory.length - 1].lp
  );

  const firstDate = new Date(sortedHistory[effectiveStartIndex].date);
  const daysElapsed = Math.max(
    1,
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const averageLPPerDay = (lastLP - firstLP) / daysElapsed;

  const daysRemaining =
    averageLPPerDay > 0 ? Math.ceil(lpRemaining / averageLPPerDay) : Infinity;

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
  matchesPerDay: number = 3,
  currentLeagueEntry?: { queueType?: string; wins?: number; losses?: number; tier?: string; rank?: string; leaguePoints?: number } | null | undefined
): RequiredMatchesResult | null {
  if (rateHistory.length === 0 && !currentLeagueEntry) {
    return null;
  }

  // Use currentLeagueEntry for current LP if available and it's solo queue
  const isSoloQueue = !currentLeagueEntry || currentLeagueEntry.queueType === 'RANKED_SOLO_5x5';
  
  let currentLP: number;
  if (isSoloQueue && currentLeagueEntry && currentLeagueEntry.tier && currentLeagueEntry.rank !== undefined && currentLeagueEntry.leaguePoints !== undefined) {
    currentLP = tierRankToLP(currentLeagueEntry.tier, currentLeagueEntry.rank, currentLeagueEntry.leaguePoints);
  } else if (rateHistory.length > 0) {
    const latest = rateHistory[rateHistory.length - 1];
    currentLP = tierRankToLP(latest.tier, latest.rank, latest.lp);
  } else {
    return null;
  }
  
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

  // Calculate win rate from currentLeagueEntry (solo queue only) if available
  let winRate = 0.5; // Default 50%
  if (isSoloQueue && currentLeagueEntry && currentLeagueEntry.wins !== undefined && currentLeagueEntry.losses !== undefined) {
    const totalGames = currentLeagueEntry.wins + currentLeagueEntry.losses;
    if (totalGames > 0) {
      winRate = currentLeagueEntry.wins / totalGames;
    }
  } else if (matches.length > 0) {
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

export function calculateStatistics(rateHistory: RateHistory[], currentLeagueEntry?: { queueType?: string; wins?: number; losses?: number; tier?: string; rank?: string; leaguePoints?: number } | null | undefined): RateStatistics | null {
  if (rateHistory.length === 0 && !currentLeagueEntry) {
    return null;
  }

  // Use currentLeagueEntry for current stats if available and it's solo queue
  const isSoloQueue = !currentLeagueEntry || currentLeagueEntry.queueType === 'RANKED_SOLO_5x5';
  
  const sorted = [...rateHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Use currentLeagueEntry for current tier/rank/LP if available and it's solo queue
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const first = sorted.length > 0 ? sorted[0] : null;

  // Use currentLeagueEntry for wins/losses if available and it's solo queue
  let totalWins: number;
  let totalLosses: number;
  let totalGames: number;
  
  if (isSoloQueue && currentLeagueEntry && currentLeagueEntry.wins !== undefined && currentLeagueEntry.losses !== undefined) {
    // Use currentLeagueEntry for current wins/losses (solo queue only)
    totalWins = currentLeagueEntry.wins;
    totalLosses = currentLeagueEntry.losses;
    totalGames = totalWins + totalLosses;
  } else if (sorted.length > 0) {
    // Fallback to rateHistory
    totalWins = sorted.reduce((sum, r) => sum + r.wins, 0);
    totalLosses = sorted.reduce((sum, r) => sum + r.losses, 0);
    totalGames = totalWins + totalLosses;
  } else {
    return null;
  }

  // Use currentLeagueEntry for current tier/rank/LP if available
  let currentTier: string;
  let currentRank: string;
  let currentLP: number;
  let currentLPTotal: number;
  
  if (isSoloQueue && currentLeagueEntry && currentLeagueEntry.tier && currentLeagueEntry.rank !== undefined && currentLeagueEntry.leaguePoints !== undefined) {
    currentTier = currentLeagueEntry.tier;
    currentRank = currentLeagueEntry.rank;
    currentLP = currentLeagueEntry.leaguePoints;
    currentLPTotal = tierRankToLP(currentTier, currentRank, currentLP);
  } else if (latest) {
    currentTier = latest.tier;
    currentRank = latest.rank;
    currentLP = latest.lp;
    currentLPTotal = tierRankToLP(currentTier, currentRank, currentLP);
  } else {
    return null;
  }

  const firstLP = first ? tierRankToLP(first.tier, first.rank, first.lp) : currentLPTotal;
  const totalLPChange = currentLPTotal - firstLP;

  // Find peak LP
  let peakLP = currentLPTotal;
  let peakTier = currentTier;
  let peakRank = currentRank;
  
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
    currentTier,
    currentRank,
    currentLP,
    peakLP,
    peakTier,
    peakRank,
  };
}

