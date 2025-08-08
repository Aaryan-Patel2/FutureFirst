/**
 * Utility functions for debugging and managing the GCCR store
 */

/**
 * Clear GCCR localStorage data (useful for debugging)
 */
export function clearGccrStorage() {
  try {
    localStorage.removeItem('gccr-storage');
    console.log('GCCR storage cleared successfully');
    return true;
  } catch (error) {
    console.error('Failed to clear GCCR storage:', error);
    return false;
  }
}

/**
 * Reset GCCR store to default state
 */
export function resetGccrStore() {
  if (clearGccrStorage()) {
    // Reload the page to reinitialize the store
    window.location.reload();
  }
}

/**
 * Get GCCR storage info for debugging
 */
export function getGccrStorageInfo() {
  try {
    const stored = localStorage.getItem('gccr-storage');
    if (!stored) {
      return { exists: false, data: null };
    }
    
    const parsed = JSON.parse(stored);
    return {
      exists: true,
      data: parsed,
      size: stored.length,
      favorites: parsed.state?.favorites || [],
      useRealData: parsed.state?.useRealData,
    };
  } catch (error) {
    return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Add to window for debugging (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).gccrDebug = {
    clearStorage: clearGccrStorage,
    resetStore: resetGccrStore,
    getStorageInfo: getGccrStorageInfo,
  };
}
