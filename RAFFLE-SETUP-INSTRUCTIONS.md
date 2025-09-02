/**
 * FIREBASE RAFFLE SETUP INSTRUCTIONS
 * 
 * HOW TO SET UP THE RAFFLE DATABASE:
 * 
 * 1. Go to Firebase Console (https://console.firebase.google.com)
 * 2. Select your FutureFirst project
 * 3. Go to Firestore Database
 * 4. Click "Start collection" if you don't have any collections yet
 * 
 * STEP 1: Create "raffle-codes" collection
 * ========================================
 * 
 * Collection ID: raffle-codes
 * 
 * Add these documents (click "Add document" for each):
 * 
 * Document 1:
 * - Document ID: (auto)
 * - Fields:
 *   - code (string): STUDY2025
 *   - date (string): 2025-09-01  (today's date in YYYY-MM-DD format)
 *   - active (boolean): true
 *   - createdAt (timestamp): September 1, 2025 at 12:00:00 AM UTC-7
 *   - description (string): Saugus Chapter Study Session
 * 
 * Document 2:
 * - Document ID: (auto)
 * - Fields:
 *   - code (string): WESTRANCH01
 *   - date (string): 2025-09-01
 *   - active (boolean): true
 *   - createdAt (timestamp): September 1, 2025 at 12:00:00 AM UTC-7
 *   - description (string): West Ranch Chapter Study Session
 * 
 * Document 3:
 * - Document ID: (auto)
 * - Fields:
 *   - code (string): DISTRICT01
 *   - date (string): 2025-09-02  (tomorrow's date)
 *   - active (boolean): true
 *   - createdAt (timestamp): September 1, 2025 at 12:00:00 AM UTC-7
 *   - description (string): District Study Session
 * 
 * STEP 2: Create "raffle-entries" collection
 * =========================================
 * 
 * Collection ID: raffle-entries
 * 
 * Leave this empty - it will be populated automatically when users enter the raffle.
 * 
 * DONE! Your raffle system is now ready to use.
 * 
 * HOW TO ADD MORE CODES:
 * ======================
 * 
 * Option 1: Through Firebase Console
 * - Go to raffle-codes collection
 * - Click "Add document"
 * - Fill in the fields as shown above
 * 
 * Option 2: Through the app (Admin only)
 * - Go to /dashboard/raffle
 * - Use the "Add New Raffle Code" form at the bottom
 * 
 * SAMPLE CODES YOU CAN USE:
 * ========================
 * 
 * STUDY2025 - General study session
 * WESTRANCH01 - West Ranch chapter
 * SAUGUS01 - Saugus chapter
 * DISTRICT01 - District session
 * COMPETE24 - Competition prep
 * FBLA2025 - General FBLA session
 * PREP01 - Test preparation
 * REVIEW01 - Review session
 * 
 * IMPORTANT NOTES:
 * ===============
 * 
 * 1. Codes are case-insensitive (automatically converted to uppercase)
 * 2. Each code is tied to a specific date
 * 3. Students can only enter once per code per day
 * 4. Students can enter multiple times with different codes
 * 5. The date format MUST be YYYY-MM-DD (e.g., 2025-09-01)
 * 6. Only admin email (aaryanp0302@gmail.com) can see admin functions
 * 
 * WORKFLOW:
 * ========
 * 
 * 1. Create raffle codes for study sessions
 * 2. Students attend study sessions and get the code
 * 3. Students enter code in app → verified against database
 * 4. Students get entered into raffle
 * 5. View all entries through admin panel
 * 6. Copy names to Wheel of Names for drawing
 * 
 */

// If you want to run this in browser console:
console.log(`
🎟️ RAFFLE SYSTEM SETUP COMPLETE!

Your raffle system is ready to use at: /dashboard/raffle

Quick setup summary:
1. ✅ raffle-codes collection (stores valid codes)
2. ✅ raffle-entries collection (stores user entries)
3. ✅ Admin interface for managing codes
4. ✅ Wheel of Names integration
5. ✅ Copy names functionality

Next steps:
1. Add some codes through Firebase Console
2. Test with students
3. Use admin panel to view entries
4. Copy names for Wheel of Names drawing

Happy raffling! 🎁
`);
