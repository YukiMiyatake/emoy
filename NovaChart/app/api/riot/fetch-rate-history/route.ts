import { NextRequest, NextResponse } from 'next/server';
import { RiotApiClient, tierRankToLP, lpToTierRank } from '@/lib/riot/client';

/**
 * Fetch rate history from match history
 * This endpoint fetches match history and attempts to calculate rate changes
 * 
 * ⚠️ CRITICAL: This endpoint ONLY returns RANKED_SOLO_5x5 (solo queue) data.
 * This mistake has been made multiple times. DO NOT return any other queue types.
 * 
 * Rules:
 * - Only fetch solo queue league entry using getRankedSoloQueueEntryByPuuid
 * - DO NOT fetch flex queue or any other queue type data
 * - Returned currentEntry is guaranteed to be solo queue
 */
export async function POST(request: NextRequest) {
  const { puuid, region = 'jp1', apiKey: apiKeyFromRequest, maxMatches = 100 } = await request.json();

  if (!puuid) {
    return NextResponse.json(
      { error: 'PUUID is required' },
      { status: 400 }
    );
  }

  // Try to get API key from request first, then environment variable
  const apiKey = apiKeyFromRequest || process.env.RIOT_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return NextResponse.json(
      { error: 'Riot API key is not configured. Please set API key in the app settings or .env.local file.' },
      { status: 500 }
    );
  }

  try {
    const client = new RiotApiClient(apiKey, region);

    // ⚠️ CRITICAL: Get current league entry - ONLY solo queue (RANKED_SOLO_5x5)
    // This mistake has been made multiple times. DO NOT use getLeagueEntriesByPuuid
    // or any method that might return flex queue data.
    // MUST use getRankedSoloQueueEntryByPuuid to ensure only solo queue data.
    const currentEntry = await client.getRankedSoloQueueEntryByPuuid(puuid);
    if (!currentEntry) {
      return NextResponse.json(
        { error: 'No ranked solo queue entry found' },
        { status: 404 }
      );
    }

    // Get match IDs
    const matchIds = await client.getAllRankedMatchIds(puuid, maxMatches);

    // Fetch match details (limited to avoid rate limits)
    const matchesToFetch = Math.min(matchIds.length, 20); // Limit to 20 matches for now
    const matchDetails: Array<{ match: any; matchId: string }> = [];

    for (let i = 0; i < matchesToFetch; i++) {
      try {
        const match = await client.getMatchByMatchId(matchIds[i]);
        const matchId = match.metadata?.matchId || matchIds[i];
        matchDetails.push({ match, matchId });
      } catch (error) {
        console.error(`[Fetch Rate History] Error fetching match ${matchIds[i]}:`, error);
        // Continue with other matches
      }
    }

    // Process matches to extract rate information
    // Note: Match history doesn't directly contain LP changes, so we can only estimate
    const rateHistory: Array<{
      matchId: string;
      date: string;
      tier: string;
      rank: string;
      lp: number;
      wins: number;
      losses: number;
    }> = [];

    // Calculate total LP from current tier/rank/lp
    // We'll work backwards from current LP to estimate past LP
    let estimatedTotalLP = tierRankToLP(currentEntry.tier, currentEntry.rank, currentEntry.leaguePoints);
    let estimatedWins = currentEntry.wins;
    let estimatedLosses = currentEntry.losses;

    // Add current entry as the first (latest) entry in rate history for display purposes only
    // ⚠️ CRITICAL: This entry has matchId starting with "current-" and should NOT be saved to database
    // Use a placeholder matchId for current entry since it's not from a match
    rateHistory.push({
      matchId: `current-${Date.now()}`,
      date: new Date().toISOString(),
      tier: currentEntry.tier,
      rank: currentEntry.rank,
      lp: currentEntry.leaguePoints,
      wins: currentEntry.wins,
      losses: currentEntry.losses,
    });

    // Sort matches by date in descending order (newest first) for reverse calculation
    const sortedMatchDetails = [...matchDetails].sort((a, b) => {
      const dateA = new Date(a.match.info.gameCreation).getTime();
      const dateB = new Date(b.match.info.gameCreation).getTime();
      return dateB - dateA; // Descending order (newest first)
    });

    // Process matches in reverse chronological order (newest first)
    // We'll work backwards from current LP to estimate past LP
    // The latest match data (excluding current) should have the same LP as currentEntry
    let isFirstMatch = true;
    for (const { match, matchId } of sortedMatchDetails) {
      // Find the player in the match
      const participant = match.info.participants.find((p: any) => p.puuid === puuid);
      if (!participant) continue;

      const matchDate = new Date(match.info.gameCreation);
      const won = participant.win;

      // For the first (newest) match, set LP to currentEntry's LP value
      // This ensures the latest data (excluding current) matches LeagueEntries' LP value
      if (isFirstMatch) {
        // Set the latest match data to currentEntry's LP value
        estimatedTotalLP = tierRankToLP(currentEntry.tier, currentEntry.rank, currentEntry.leaguePoints);
        estimatedWins = currentEntry.wins;
        estimatedLosses = currentEntry.losses;
        isFirstMatch = false;
      } else {
        // For subsequent matches, estimate LP change (typically +15 to +25 for win, -15 to -25 for loss)
        // This is an approximation and may not be accurate
        // Working backwards, so reverse the change
        const estimatedLPChange = won ? -20 : 20;
        estimatedTotalLP += estimatedLPChange;

        // Ensure LP doesn't go below 0
        estimatedTotalLP = Math.max(0, estimatedTotalLP);

        if (won) {
          estimatedWins--;
        } else {
          estimatedLosses--;
        }
      }

      // Convert total LP back to tier/rank/lp using the utility function
      const tierRankLP = lpToTierRank(estimatedTotalLP);

      if (!matchId) {
        console.warn('[Fetch Rate History] Match ID not found, skipping entry');
        continue;
      }

      rateHistory.push({
        matchId,
        date: matchDate.toISOString(),
        tier: tierRankLP.tier,
        rank: tierRankLP.rank,
        lp: tierRankLP.lp,
        wins: estimatedWins,
        losses: estimatedLosses,
      });
    }

    // Sort by date (oldest first)
    rateHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      message: 'Rate history fetched from match history',
      rateHistory,
      // ⚠️ CRITICAL: currentEntry is provided for display purposes only (plotting)
      // It should NOT be saved to database as it's not based on match history
      // However, leagueId is included for cases where it needs to be saved
      currentEntry: {
        leagueId: currentEntry.leagueId || '',
        tier: currentEntry.tier,
        rank: currentEntry.rank,
        lp: currentEntry.leaguePoints,
        wins: currentEntry.wins,
        losses: currentEntry.losses,
        date: new Date().toISOString(),
      },
      matchesProcessed: matchDetails.length,
      totalMatches: matchIds.length,
    });
  } catch (error) {
    console.error('[Fetch Rate History] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch rate history' },
      { status: 500 }
    );
  }
}


