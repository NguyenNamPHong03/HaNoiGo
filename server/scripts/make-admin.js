
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function makeAdmin(email) {
    try {
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const user = await User.findOne({ email: email });

        if (!user) {
            console.log(`❌ User with email ${email} not found.`);
            return;
        }

        console.log(`🔍 Found user: ${user.displayName} (${user.email})`);
        console.log(`Current Role: ${user.role}`);

        user.role = 'admin';
        await user.save();

        console.log(`✅ successfully updated role to 'admin' for user: ${email}`);

    } catch (error) {
        console.error('❌ Error updating user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

makeAdmin('lehy6903@gmail.com');
