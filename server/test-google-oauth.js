#!/usr/bin/env node

/**
 * Test Google OAuth URL Generation
 * Run this to verify OAuth URL contains client_id and redirect_uri
 */

import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
dotenv.config({ path: join(__dirname, '.env') });

console.log('🧪 Testing Google OAuth Configuration...\n');

// Check env variables
console.log('📋 Environment Variables:');
console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ SET' : '❌ NOT SET');
console.log('  GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ SET' : '❌ NOT SET');
console.log('  GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || '❌ NOT SET');
console.log('  CLIENT_URL:', process.env.CLIENT_URL || '❌ NOT SET');
console.log();

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
  console.error('❌ Missing required Google OAuth environment variables!');
  process.exit(1);
}

// Create OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generate URL
const url = googleClient.generateAuthUrl({
  access_type: 'offline',
  scope: ['openid', 'email', 'profile'],
  prompt: 'consent',
});

console.log('🔗 Generated Google OAuth URL:\n');
console.log(url);
console.log();

// Parse URL to check parameters
const urlObj = new URL(url);
const clientId = urlObj.searchParams.get('client_id');
const redirectUri = urlObj.searchParams.get('redirect_uri');

console.log('✅ URL Parameters Check:');
console.log('  client_id:', clientId ? '✅ Present' : '❌ Missing');
console.log('  redirect_uri:', redirectUri ? '✅ Present' : '❌ Missing');
console.log();

if (clientId && redirectUri) {
  console.log('🎉 SUCCESS! OAuth URL is correctly generated.');
  console.log('   You can now test Google login.');
  console.log();
  console.log('📝 Next steps:');
  console.log('   1. Start server: npm run dev');
  console.log('   2. Open: http://localhost:5173/login');
  console.log('   3. Click "Continue with Google"');
} else {
  console.log('❌ FAILED! OAuth URL is missing required parameters.');
  console.log('   Please check your .env configuration.');
}
