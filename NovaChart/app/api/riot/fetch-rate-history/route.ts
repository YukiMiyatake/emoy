import { NextRequest, NextResponse } from 'next/server';
import { RiotApiClient, tierRankToLP, lpToTierRank } from '@/lib/riot/client';

/**
 * Fetch rate history from match history
 * This endpoint fetches match history and attempts to calculate rate changes
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

    // Get current league entry
    const currentEntry = await client.getRankedSoloQueueEntryByPuuid(puuid);
    if (!currentEntry) {
      return NextResponse.json(
        { error: 'No ranked solo queue entry found' },
        { status: 404 }
      );
    }

    console.log('[Fetch Rate History] Current entry:', JSON.stringify(currentEntry, null, 2));

    // Get match IDs
    const matchIds = await client.getAllRankedMatchIds(puuid, maxMatches);
    console.log('[Fetch Rate History] Found', matchIds.length, 'match IDs');

    // Fetch match details (limited to avoid rate limits)
    const matchesToFetch = Math.min(matchIds.length, 20); // Limit to 20 matches for now
    const matchDetails: any[] = [];

    for (let i = 0; i < matchesToFetch; i++) {
      try {
        const match = await client.getMatchByMatchId(matchIds[i]);
        matchDetails.push(match);
        console.log(`[Fetch Rate History] Fetched match ${i + 1}/${matchesToFetch}:`, matchIds[i]);
      } catch (error) {
        console.error(`[Fetch Rate History] Error fetching match ${matchIds[i]}:`, error);
        // Continue with other matches
      }
    }

    // Process matches to extract rate information
    // Note: Match history doesn't directly contain LP changes, so we can only estimate
    const rateHistory: Array<{
      date: string;
      tier: string;
      rank: string;
      lp: number;
      wins: number;
      losses: number;
    }> = [];

    // Add current rate as the latest entry
    rateHistory.push({
      date: new Date().toISOString(),
      tier: currentEntry.tier,
      rank: currentEntry.rank,
      lp: currentEntry.leaguePoints,
      wins: currentEntry.wins,
      losses: currentEntry.losses,
    });

    // Process matches in reverse chronological order (newest first)
    // We'll work backwards from current LP to estimate past LP
    // Calculate total LP from current tier/rank/lp
    let estimatedTotalLP = tierRankToLP(currentEntry.tier, currentEntry.rank, currentEntry.leaguePoints);
    let estimatedWins = currentEntry.wins;
    let estimatedLosses = currentEntry.losses;

    console.log('[Fetch Rate History] Starting from total LP:', estimatedTotalLP, `(${currentEntry.tier} ${currentEntry.rank} ${currentEntry.leaguePoints} LP)`);

    for (const match of matchDetails) {
      // Find the player in the match
      const participant = match.info.participants.find((p: any) => p.puuid === puuid);
      if (!participant) continue;

      const matchDate = new Date(match.info.gameCreation);
      const won = participant.win;

      // Estimate LP change (typically +15 to +25 for win, -15 to -25 for loss)
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

      // Convert total LP back to tier/rank/lp using the utility function
      const tierRankLP = lpToTierRank(estimatedTotalLP);

      console.log(`[Fetch Rate History] Match ${matchDate.toISOString()}: ${won ? 'Win' : 'Loss'}, Total LP: ${estimatedTotalLP}, Tier: ${tierRankLP.tier}, Rank: ${tierRankLP.rank}, LP: ${tierRankLP.lp}`);

      rateHistory.push({
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

    console.log('[Fetch Rate History] Generated rate history entries:', rateHistory.length);

    return NextResponse.json({
      message: 'Rate history fetched from match history',
      rateHistory,
      currentEntry: {
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


