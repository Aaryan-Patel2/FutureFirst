/**
 * Firebase Raffle Setup Script
 * 
 * This script helps you set up the raffle system in Firebase Firestore.
 * 
 * Collections created:
 * 1. raffle-codes: Stores valid codes with dates
 * 2. raffle-entries: Stores user entries
 * 
 * To use this script:
 * 1. Make sure you're connected to Firebase
 * 2. Run this in your browser console on your app
 * 3. Or copy-paste the functions below into your browser console
 */

import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Function to add a raffle code
export async function addRaffleCode(code: string, date: string, description?: string) {
  try {
    const codesRef = collection(db, 'raffle-codes');
    await addDoc(codesRef, {
      code: code.toUpperCase(),
      date: date, // Format: YYYY-MM-DD
      active: true,
      createdAt: new Date(),
      description: description || `Study session code for ${date}`
    });
    console.log(`Added code: ${code} for date: ${date}`);
  } catch (error) {
    console.error('Error adding code:', error);
  }
}

// Function to add multiple codes
export async function setupSampleCodes() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const sampleCodes = [
    { code: 'STUDY2025', date: todayStr, description: 'Saugus Chapter Study Session' },
    { code: 'WESTRANCH01', date: todayStr, description: 'West Ranch Chapter Study Session' },
    { code: 'FBLA2025', date: tomorrowStr, description: 'District Study Session' },
    { code: 'COMPETE24', date: tomorrowStr, description: 'Competition Prep Session' }
  ];
  
  for (const codeData of sampleCodes) {
    await addRaffleCode(codeData.code, codeData.date, codeData.description);
  }
  
  console.log('Sample codes added successfully!');
}

// Function to view all codes
export async function viewAllCodes() {
  try {
    const codesRef = collection(db, 'raffle-codes');
    const snapshot = await getDocs(codesRef);
    
    console.log('=== ALL RAFFLE CODES ===');
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Code: ${data.code} | Date: ${data.date} | Active: ${data.active} | Description: ${data.description}`);
    });
  } catch (error) {
    console.error('Error viewing codes:', error);
  }
}

// Function to view all entries
export async function viewAllEntries() {
  try {
    const entriesRef = collection(db, 'raffle-entries');
    const snapshot = await getDocs(entriesRef);
    
    console.log('=== ALL RAFFLE ENTRIES ===');
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Name: ${data.userName} | Code: ${data.code} | Date: ${data.date}`);
    });
  } catch (error) {
    console.error('Error viewing entries:', error);
  }
}

// Quick setup function
export async function quickSetup() {
  console.log('Setting up raffle system...');
  await setupSampleCodes();
  await viewAllCodes();
  console.log('Setup complete! You can now use the raffle system.');
}

/* 
MANUAL SETUP INSTRUCTIONS:

If you want to manually add codes through Firebase Console:

1. Go to Firebase Console > Firestore Database
2. Create collection: "raffle-codes"
3. Add documents with these fields:
   - code (string): "STUDY2025" 
   - date (string): "2025-09-01" (YYYY-MM-DD format)
   - active (boolean): true
   - createdAt (timestamp): current time
   - description (string): "Study session description"

4. Create collection: "raffle-entries" (will be populated automatically)

SAMPLE CODES TO ADD:
- Code: STUDY2025, Date: today's date
- Code: WESTRANCH01, Date: today's date  
- Code: FBLA2025, Date: tomorrow's date
- Code: COMPETE24, Date: tomorrow's date
*/
