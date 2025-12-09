import { NextRequest, NextResponse } from 'next/server';
import { RiotApiClient } from '@/lib/riot/client';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gameName = searchParams.get('gameName');
  const tagLine = searchParams.get('tagLine');
  const region = searchParams.get('region') || 'jp1';
  const apiKeyFromRequest = searchParams.get('apiKey');

  if (!gameName || !tagLine) {
    return NextResponse.json(
      { error: 'Game name and tag line are required' },
      { status: 400 }
    );
  }

  // Try to get API key from request parameter first, then environment variable
  const apiKey = apiKeyFromRequest || process.env.RIOT_API_KEY;
  
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_api_key_here') {
    return NextResponse.json(
      { 
        error: 'Riot API key is not configured. Please set API key in the app settings or .env.local file.',
      },
      { status: 500 }
    );
  }

  try {
    logger.debug(`[API Route] /api/riot/account/by-riot-id - GameName: ${gameName}, TagLine: ${tagLine}, Region: ${region}`);
    const client = new RiotApiClient(apiKey, region);
    const account = await client.getAccountByRiotId(gameName, tagLine);
    
    // Get summoner info using PUUID
    const summoner = await client.getSummonerByPuuid(account.puuid);
    
    logger.debug('[API Route] /api/riot/account/by-riot-id - Summoner data:', JSON.stringify(summoner, null, 2));
    logger.debug('[API Route] /api/riot/account/by-riot-id - Summoner id:', summoner.id);
    logger.debug('[API Route] /api/riot/account/by-riot-id - Summoner name:', summoner.name);
    logger.debug('[API Route] /api/riot/account/by-riot-id - Summoner puuid:', summoner.puuid);
    
    // Note: Database save should be done on client-side
    return NextResponse.json({
      account,
      summoner,
    });
  } catch (error) {
    logger.error('[API Route] Riot API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch account data';
    
    // Return appropriate status code based on error message
    let statusCode = 500;
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      statusCode = 403;
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      statusCode = 401;
    } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      statusCode = 404;
    } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
      statusCode = 429;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

