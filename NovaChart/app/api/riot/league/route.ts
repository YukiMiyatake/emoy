import { NextRequest, NextResponse } from 'next/server';
import { RiotApiClient } from '@/lib/riot/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const summonerId = searchParams.get('summonerId');
  const region = searchParams.get('region') || 'jp1';
  const queueType = searchParams.get('queueType') || 'RANKED_SOLO_5x5';

  if (!summonerId) {
    return NextResponse.json(
      { error: 'Summoner ID is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Riot API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const client = new RiotApiClient(apiKey, region);
    let entry;
    
    if (queueType === 'RANKED_SOLO_5x5') {
      entry = await client.getRankedSoloQueueEntry(summonerId);
    } else if (queueType === 'RANKED_FLEX_SR') {
      entry = await client.getRankedFlexEntry(summonerId);
    } else {
      const entries = await client.getLeagueEntries(summonerId);
      entry = entries.find(e => e.queueType === queueType) || null;
    }

    if (!entry) {
      return NextResponse.json(
        { error: 'No league entry found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Riot API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch league data' },
      { status: 500 }
    );
  }
}

