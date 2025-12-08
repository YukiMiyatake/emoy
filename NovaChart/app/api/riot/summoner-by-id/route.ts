import { NextRequest, NextResponse } from 'next/server';
import { RiotApiClient } from '@/lib/riot/client';
import { summonerService } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const summonerId = searchParams.get('summonerId');
  const puuid = searchParams.get('puuid');
  const region = searchParams.get('region') || 'jp1';
  const apiKeyFromRequest = searchParams.get('apiKey');

  // Try to get from database first (no API key needed)
  if (summonerId) {
    const existing = await summonerService.get(summonerId);
    if (existing) {
      return NextResponse.json(existing);
    }
  }

  if (puuid) {
    const existing = await summonerService.getByPuuid(puuid);
    if (existing) {
      return NextResponse.json(existing);
    }
  }

  // If not in database, try API (requires API key)
  // Try to get API key from request first, then environment variable
  const apiKey = apiKeyFromRequest || process.env.RIOT_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Summoner not found in database and Riot API key is not configured. Please set API key in the app settings or .env.local file.' },
      { status: 404 }
    );
  }

  if (!summonerId && !puuid) {
    return NextResponse.json(
      { error: 'Summoner ID or PUUID is required' },
      { status: 400 }
    );
  }

  try {
    const client = new RiotApiClient(apiKey, region);
    let summoner;
    
    if (summonerId) {
      summoner = await client.getSummonerById(summonerId);
    } else if (puuid) {
      summoner = await client.getSummonerByPuuid(puuid);
    } else {
      return NextResponse.json(
        { error: 'Summoner ID or PUUID is required' },
        { status: 400 }
      );
    }

    // Save to database
    await summonerService.addOrUpdate(summoner);
    return NextResponse.json(summoner);
  } catch (error) {
    console.error('Riot API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch summoner data' },
      { status: 500 }
    );
  }
}

