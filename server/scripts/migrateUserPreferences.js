/**
 * Migration Script: Add atmosphere & activities to existing users
 * 
 * Usage: node server/scripts/migrateUserPreferences.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const migrateUserPreferences = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find users without new preference fields
    const usersToUpdate = await User.find({
      $or: [
        { 'preferences.atmosphere': { $exists: false } },
        { 'preferences.activities': { $exists: false } }
      ]
    });

    console.log(`📊 Found ${usersToUpdate.length} users to update`);

    if (usersToUpdate.length === 0) {
      console.log('✨ All users already have new preference fields!');
      process.exit(0);
    }

    // Update users with empty arrays for new fields
    const result = await User.updateMany(
      {
        $or: [
          { 'preferences.atmosphere': { $exists: false } },
          { 'preferences.activities': { $exists: false } }
        ]
      },
      {
        $set: {
          'preferences.atmosphere': [],
          'preferences.activities': []
        }
      }
    );

    console.log(`✅ Successfully updated ${result.modifiedCount} users`);
    console.log(`📝 Details:
      - Matched: ${result.matchedCount}
      - Modified: ${result.modifiedCount}
    `);

    // Verify migration
    const updatedUsers = await User.find({
      'preferences.atmosphere': { $exists: true },
      'preferences.activities': { $exists: true }
    }).countDocuments();

    console.log(`✨ Total users with new fields: ${updatedUsers}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
migrateUserPreferences();
