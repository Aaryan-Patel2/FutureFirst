import { resetAllUserData } from './user-localStorage';

// Simple function to reset all user data while preserving master account
export function performUserDataReset() {
  console.log('Starting user data reset...');
  
  try {
    // This will preserve master account raffle data automatically
    resetAllUserData();
    
    console.log('User data reset completed successfully!');
    console.log('All user data has been cleared except master account raffle access.');
    console.log('Users will start with fresh data on next login.');
    
    return true;
  } catch (error) {
    console.error('Failed to reset user data:', error);
    return false;
  }
}

// Execute if run directly
if (typeof window !== 'undefined') {
  // Browser environment
  performUserDataReset();
}