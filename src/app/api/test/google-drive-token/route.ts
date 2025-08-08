import { NextRequest, NextResponse } from 'next/server';
import { testTokenRefresh, validateGoogleDriveConfig, validateGoogleDriveScope, getGoogleDriveScopeInstructions } from '@/lib/google-drive-utils';

/**
 * Test API route for Google Drive token functionality
 * GET /api/test/google-drive-token
 */
export async function GET(request: NextRequest) {
  try {
    // First validate configuration
    const configValidation = validateGoogleDriveConfig();
    if (!configValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required environment variables',
          missingKeys: configValidation.missingKeys,
        },
        { status: 400 }
      );
    }

    // Test token refresh
    const testResult = await testTokenRefresh();

    // Validate Google Drive scope
    const scopeValidation = await validateGoogleDriveScope();

    const response: any = {
      ...testResult,
      scopeValidation,
    };

    // If scope is invalid, add instructions
    if (!scopeValidation.hasRequiredScope) {
      const instructions = getGoogleDriveScopeInstructions();
      response.scopeInstructions = instructions;
    }

    return NextResponse.json(response, {
      status: testResult.success ? 200 : 500,
    });
  } catch (error) {
    console.error('Error in Google Drive token test:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
