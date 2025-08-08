import { NextRequest, NextResponse } from 'next/server';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type?: string;
  scope?: string;
}

interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

// In-memory token storage (in production, use a database or secure cache)
let tokenCache: TokenData | null = null;

/**
 * API route to get a valid access token
 * GET /api/google-drive/token
 */
export async function GET(request: NextRequest) {
  try {
    // Check if we need to refresh the token
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    if (!tokenCache || tokenCache.expires_at < fiveMinutesFromNow) {
      console.log('Access token expired or missing, refreshing...');
      await refreshAccessToken();
    }

    return NextResponse.json({
      success: true,
      access_token: tokenCache?.access_token,
      expires_at: tokenCache?.expires_at,
    });

  } catch (error) {
    console.error('Error getting access token:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get access token',
      },
      { status: 500 }
    );
  }
}

/**
 * Force refresh the access token
 * POST /api/google-drive/token
 */
export async function POST(request: NextRequest) {
  try {
    await refreshAccessToken();
    
    return NextResponse.json({
      success: true,
      access_token: tokenCache?.access_token,
      expires_at: tokenCache?.expires_at,
    });

  } catch (error) {
    console.error('Error refreshing access token:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh access token',
      },
      { status: 500 }
    );
  }
}

async function refreshAccessToken(): Promise<void> {
  const refreshToken = process.env.REFRESH_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!refreshToken) {
    throw new Error('No refresh token available in environment variables');
  }

  if (!clientId || !clientSecret) {
    throw new Error('Missing CLIENT_ID or CLIENT_SECRET environment variables');
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh access token: ${response.status} ${errorText}`);
    }

    const data: RefreshTokenResponse = await response.json();

    // Update token cache
    tokenCache = {
      access_token: data.access_token,
      refresh_token: refreshToken, // Refresh token usually stays the same
      expires_at: Date.now() + (data.expires_in * 1000),
      token_type: data.token_type,
      scope: data.scope,
    };

    console.log('Access token refreshed successfully');
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}
