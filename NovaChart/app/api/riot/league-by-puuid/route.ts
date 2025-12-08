import { NextRequest, NextResponse } from 'next/server';
import { RiotApiClient } from '@/lib/riot/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const puuid = searchParams.get('puuid');
  const region = searchParams.get('region') || 'jp1';
  const queueType = searchParams.get('queueType') || 'RANKED_SOLO_5x5';
  const apiKeyFromRequest = searchParams.get('apiKey');

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
    let entry;
    
    if (queueType === 'RANKED_SOLO_5x5') {
      entry = await client.getRankedSoloQueueEntryByPuuid(puuid);
    } else if (queueType === 'RANKED_FLEX_SR') {
      entry = await client.getRankedFlexEntryByPuuid(puuid);
    } else {
      const entries = await client.getLeagueEntriesByPuuid(puuid);
      entry = entries.find(e => e.queueType === queueType) || null;
    }

    if (!entry) {
      return NextResponse.json(
        { error: 'No league entry found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Riot API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch league data' },
      { status: 500 }
    );
  }
}

