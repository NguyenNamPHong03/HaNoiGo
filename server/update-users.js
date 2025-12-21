import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

async function updateUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const result = await mongoose.connection.db.collection('users').updateMany(
      { role: { $exists: false } },
      { $set: { role: 'user' } }
    );
    
    console.log('Updated users:', result.modifiedCount);
    
    // Check all users now
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('All users now have role field:');
    users.forEach(user => {
      console.log(`- ${user.displayName}: ${user.role}`);
    });
    
    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

updateUsers();