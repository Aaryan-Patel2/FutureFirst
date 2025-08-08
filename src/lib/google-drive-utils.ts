
import { googleDriveService } from './google-drive-service';

/**
 * Utility functions for Google Drive token management
 */

/**
 * Test the token refresh functionality
 */
export async function testTokenRefresh() {
  try {
    console.log('Testing Google Drive token refresh...');
    
    // Test the API endpoint directly
    const response = await fetch('/api/google-drive/token', { method: 'POST' });
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Token refresh failed');
    }

    console.log('Token refresh test completed successfully');
    return {
      success: true,
      message: 'Token refresh test completed successfully',
      tokenInfo: {
        hasAccessToken: !!result.access_token,
        expiresAt: result.expires_at,
        isValid: result.expires_at > Date.now(),
      },
    };
  } catch (error) {
    console.error('Token refresh test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error,
    };
  }
}

/**
 * Get a valid access token for Google Drive API calls
 */
export async function getGoogleDriveAccessToken(): Promise<string> {
  const response = await fetch('/api/google-drive/token');
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to get access token');
  }
  
  return result.access_token;
}

/**
 * Check if Google Drive credentials are properly configured
 */
export function validateGoogleDriveConfig(): { isValid: boolean; missingKeys: string[] } {
  const requiredEnvVars = ['CLIENT_ID', 'CLIENT_SECRET', 'REFRESH_TOKEN'];
  const missingKeys = requiredEnvVars.filter(key => !process.env[key]);
  
  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
}

/**
 * Validate that the refresh token has the correct Google Drive readonly scope
 */
export async function validateGoogleDriveScope(): Promise<{ hasRequiredScope: boolean; currentScope?: string; requiredScope: string }> {
  const requiredScope = 'https://www.googleapis.com/auth/drive.readonly';
  
  try {
    // Test if we can get an access token
    await getGoogleDriveAccessToken();
    
    return {
      hasRequiredScope: true, // If we get here, the scope is likely correct
      requiredScope,
    };
  } catch (error) {
    console.error('Error validating Google Drive scope:', error);
    return {
      hasRequiredScope: false,
      requiredScope,
    };
  }
}

/**
 * Get instructions for obtaining a refresh token with the correct scope
 */
export function getGoogleDriveScopeInstructions(): {
  authUrl: string;
  requiredScope: string;
  instructions: string[];
} {
  const clientId = process.env.CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
  const scope = 'https://www.googleapis.com/auth/drive.readonly';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `prompt=consent`;

  return {
    authUrl,
    requiredScope: scope,
    instructions: [
      '1. Visit the OAuth Playground or use the generated auth URL',
      '2. Authorize the application with the Google Drive readonly scope',
      '3. Exchange the authorization code for tokens',
      '4. Copy the refresh_token to your .env file',
      '5. Make sure the scope includes: ' + scope,
    ],
  };
}
