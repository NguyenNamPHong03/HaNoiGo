import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Place from '../models/Place.js';

dotenv.config();

async function checkStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check unique status values
    const statusValues = await Place.distinct('status');
    console.log('📊 Các giá trị status trong database:', statusValues);
    
    // Count by status
    const counts = await Promise.all(
      statusValues.map(async (status) => {
        const count = await Place.countDocuments({ status });
        return { status, count };
      })
    );
    
    console.log('\n📈 Thống kê theo status:');
    counts.forEach(({ status, count }) => {
      console.log(`   ${status || '(null)'}: ${count}`);
    });

    // Total
    const total = await Place.countDocuments();
    console.log(`\n   TỔNG: ${total}`);

    // Sample documents
    console.log('\n📝 Sample 5 documents:');
    const samples = await Place.find().limit(5).select('name status');
    samples.forEach(doc => {
      console.log(`   - ${doc.name}: status="${doc.status}"`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStatus();
