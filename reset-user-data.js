// Simple script to reset all user data while preserving master account
console.log('Resetting all user data...');

// This would be executed in browser console since we need access to localStorage
const resetScript = `
// Execute this in browser console to reset user data
function resetUserData() {
  const MASTER_ACCOUNT_EMAIL = 'aaryanp0302@gmail.com';
  
  try {
    let keysToRemove = [];
    let preservedKeys = [];
    
    // Get all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user_')) {
        // Check if this belongs to master account raffle data
        if (key.includes(MASTER_ACCOUNT_EMAIL.replace('@', '_').replace('.', '_')) && 
            key.includes('raffle')) {
          preservedKeys.push(key);
          console.log('Preserving master account raffle data:', key);
          continue;
        }
        keysToRemove.push(key);
      }
    }
    
    // Remove all non-master raffle data
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('Reset complete!');
    console.log('Removed:', keysToRemove.length, 'items');
    console.log('Preserved:', preservedKeys.length, 'master account items');
    
    // Also clear session storage for good measure
    sessionStorage.clear();
    console.log('Session storage cleared');
    
    return {
      removed: keysToRemove.length,
      preserved: preservedKeys.length,
      removedKeys: keysToRemove,
      preservedKeys: preservedKeys
    };
  } catch (error) {
    console.error('Failed to reset user data:', error);
    return null;
  }
}

// Execute the reset
const result = resetUserData();
if (result) {
  console.log('User data reset successfully:', result);
} else {
  console.error('Failed to reset user data');
}
`;

console.log('Copy and paste this script into your browser console:');
console.log('='.repeat(50));
console.log(resetScript);
console.log('='.repeat(50));