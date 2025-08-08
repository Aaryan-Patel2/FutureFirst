/**
 * Google Drive Token Manager
 * Handles access token refresh using the stored refresh token
 */

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

export class GoogleTokenManager {
  private tokenData: TokenData | null = null;
  private readonly REQUIRED_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

  constructor() {
    // Initialize with stored refresh token from environment
    this.tokenData = {
      access_token: '', // Will be generated when needed
      refresh_token: process.env.REFRESH_TOKEN!,
      expires_at: 0, // Will trigger immediate refresh
    };
  }

  /**
   * Gets a valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string> {
    if (!this.tokenData) {
      throw new Error('No token data available. Refresh token missing.');
    }

    // Check if token is expired (with 5-minute buffer)
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    if (this.tokenData.expires_at < fiveMinutesFromNow) {
      console.log('Access token expired or missing, refreshing...');
      await this.refreshAccessToken();
    }

    return this.tokenData.access_token;
  }

  /**
   * Refreshes the access token using the stored refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.tokenData?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.CLIENT_ID!,
          client_secret: process.env.CLIENT_SECRET!,
          refresh_token: this.tokenData.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to refresh access token: ${response.status} ${errorText}`);
      }

      const data: RefreshTokenResponse = await response.json();

      // Update token data
      this.tokenData = {
        ...this.tokenData,
        access_token: data.access_token,
        expires_at: Date.now() + (data.expires_in * 1000),
        token_type: data.token_type,
        scope: data.scope,
      };

      console.log('Access token refreshed successfully');
      
      // Validate that the token has the required scope
      this.validateScope();
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  /**
   * Checks if the current access token is valid (not expired)
   */
  isAccessTokenValid(): boolean {
    if (!this.tokenData?.access_token) return false;
    return Date.now() < this.tokenData.expires_at;
  }

  /**
   * Gets token information for debugging
   */
  getTokenInfo(): { hasAccessToken: boolean; hasRefreshToken: boolean; expiresAt: number; isValid: boolean; scope?: string; hasRequiredScope: boolean } {
    return {
      hasAccessToken: !!this.tokenData?.access_token,
      hasRefreshToken: !!this.tokenData?.refresh_token,
      expiresAt: this.tokenData?.expires_at || 0,
      isValid: this.isAccessTokenValid(),
      scope: this.tokenData?.scope,
      hasRequiredScope: this.hasRequiredScope(),
    };
  }

  /**
   * Validates that the token has the required Google Drive readonly scope
   */
  private validateScope(): void {
    if (!this.hasRequiredScope()) {
      console.warn(
        `Token does not have required scope: ${this.REQUIRED_SCOPE}. ` +
        `Current scope: ${this.tokenData?.scope || 'unknown'}`
      );
    }
  }

  /**
   * Checks if the token has the required Google Drive readonly scope
   */
  hasRequiredScope(): boolean {
    if (!this.tokenData?.scope) return false;
    return this.tokenData.scope.includes(this.REQUIRED_SCOPE);
  }

  /**
   * Gets the required scope for Google Drive readonly access
   */
  getRequiredScope(): string {
    return this.REQUIRED_SCOPE;
  }

  /**
   * Forces a token refresh (useful for testing)
   */
  async forceRefresh(): Promise<void> {
    await this.refreshAccessToken();
  }
}

// Export singleton instance
export const googleTokenManager = new GoogleTokenManager();
