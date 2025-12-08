import { NextRequest, NextResponse } from 'next/server';
import { RiotApiClient, tierRankToLP } from '@/lib/riot/client';
import { db, rateHistoryService, summonerService } from '@/lib/db';
import { Summoner } from '@/types';

export async function POST(request: NextRequest) {
  const { summonerName, summonerId, puuid, region = 'jp1', apiKey: apiKeyFromRequest } = await request.json();

  // Check if we have summonerId or puuid (can work without API key if in database)
  let summoner: Summoner | null = null;
  
  if (summonerId) {
    const existing = await summonerService.get(summonerId);
    if (existing) {
      summoner = existing;
    }
  } else if (puuid) {
    const existing = await summonerService.getByPuuid(puuid);
    if (existing) {
      summoner = existing;
    }
  }

  // If not in database, try to get from API (requires API key and summonerName)
  if (!summoner) {
    if (!summonerName) {
      return NextResponse.json(
        { error: 'Summoner name, ID, or PUUID is required' },
        { status: 400 }
      );
    }

    // Try to get API key from request first, then environment variable
    const apiKey = apiKeyFromRequest || process.env.RIOT_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.error('RIOT_API_KEY is not set or empty.');
      return NextResponse.json(
        { 
          error: 'Riot API key is not configured and summoner not found in database. Please set API key in the app settings or .env.local file.'
        },
        { status: 500 }
      );
    }

    try {
      const client = new RiotApiClient(apiKey, region);
      const fetchedSummoner = await client.getSummonerByName(summonerName);
      await summonerService.addOrUpdate(fetchedSummoner);
      summoner = fetchedSummoner;
    } catch (error) {
      console.error('Riot API Error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch summoner data' },
        { status: 500 }
      );
    }
  }

  // Now get league entry (requires API key)
  // Use the same API key from request or environment
  const leagueApiKey = apiKeyFromRequest || process.env.RIOT_API_KEY;
  if (!leagueApiKey || leagueApiKey.trim() === '') {
    console.error('RIOT_API_KEY is not set or empty.');
    return NextResponse.json(
      { 
        error: 'Riot API key is required to fetch league data. Please set API key in the app settings or .env.local file.'
      },
      { status: 500 }
    );
  }

  try {
    const client = new RiotApiClient(leagueApiKey, summoner.region || region);

    // Get ranked solo queue entry
    const entry = await client.getRankedSoloQueueEntry(summoner.id);

    if (!entry) {
      return NextResponse.json(
        { error: 'No ranked solo queue entry found' },
        { status: 404 }
      );
    }

    // Check if we already have today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get all entries and filter by date range
    const allEntries = await db.rateHistory.toArray();
    const existing = allEntries.find(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= today && entryDate < tomorrow;
    });

    if (existing) {
      // Update existing entry
      await rateHistoryService.update(existing.id!, {
        tier: entry.tier,
        rank: entry.rank,
        lp: entry.leaguePoints,
        wins: entry.wins,
        losses: entry.losses,
      });
      return NextResponse.json({ message: 'Updated existing entry', entry: existing });
    } else {
      // Create new entry
      const newEntry = await rateHistoryService.add({
        date: new Date(),
        tier: entry.tier,
        rank: entry.rank,
        lp: entry.leaguePoints,
        wins: entry.wins,
        losses: entry.losses,
      });
      return NextResponse.json({ message: 'Created new entry', id: newEntry });
    }
  } catch (error) {
    console.error('Riot API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update rating' },
      { status: 500 }
    );
  }
}

