// Test Firebase connection
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    console.log('Current user:', auth.currentUser);
    console.log('User authenticated:', !!auth.currentUser);
    
    // Test if we can read a simple document (this might fail due to security rules)
    const testRef = doc(db, 'test', 'connection');
    console.log('Attempting to read document...');
    
    const testDoc = await getDoc(testRef);
    
    console.log('Firebase connection successful!');
    console.log('Document exists:', testDoc.exists());
    
    return { success: true, exists: testDoc.exists(), authenticated: !!auth.currentUser };
  } catch (error: any) {
    console.error('Firebase connection test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.log('Current user during error:', auth.currentUser);
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      code: error.code,
      authenticated: !!auth.currentUser
    };
  }
}
