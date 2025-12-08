import { NextRequest, NextResponse } from 'next/server';
import { RiotApiClient } from '@/lib/riot/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const summonerName = searchParams.get('name');
  const region = searchParams.get('region') || 'jp1';
  const apiKeyFromRequest = searchParams.get('apiKey');

  if (!summonerName) {
    return NextResponse.json(
      { error: 'Summoner name is required' },
      { status: 400 }
    );
  }

  // Try to get API key from request parameter first, then environment variable
  const apiKey = apiKeyFromRequest || process.env.RIOT_API_KEY;
  
  // Debug logging
  console.log('API Key check:', {
    exists: !!apiKey,
    length: apiKey?.length || 0,
    isEmpty: apiKey?.trim() === '',
    prefix: apiKey?.substring(0, 10) || 'N/A'
  });
  
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_api_key_here') {
    console.error('RIOT_API_KEY is not set, empty, or still has placeholder value.');
    return NextResponse.json(
      { 
        error: 'Riot API key is not configured. Please set API key in the app settings or .env.local file.',
        hint: 'You can set the API key in the app settings, or set RIOT_API_KEY in .env.local and restart the dev server.'
      },
      { status: 500 }
    );
  }

  try {
    console.log(`[API Route] /api/riot/summoner - Summoner: ${summonerName}, Region: ${region}`);
    console.log(`[API Route] API Key exists: ${!!apiKey}, Length: ${apiKey?.length || 0}`);
    
    const client = new RiotApiClient(apiKey, region);
    const summoner = await client.getSummonerByName(summonerName);
    return NextResponse.json(summoner);
  } catch (error) {
    console.error('[API Route] Riot API Error:', error);
    console.error('[API Route] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch summoner data';
    
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

