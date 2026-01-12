import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Place from '../models/Place.js';

dotenv.config();

async function checkLocationData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Lấy một số địa điểm mẫu
    const samplePlaces = await Place.find()
      .select('name location address district')
      .limit(10);

    console.log('📍 Kiểm tra 10 địa điểm mẫu:\n');
    
    samplePlaces.forEach((place, idx) => {
      console.log(`${idx + 1}. ${place.name}`);
      console.log(`   Địa chỉ: ${place.address}`);
      console.log(`   Quận: ${place.district}`);
      
      if (place.location && place.location.coordinates) {
        const [lng, lat] = place.location.coordinates;
        console.log(`   ✅ Tọa độ: ${lat}, ${lng}`);
        console.log(`   🗺️  Google Maps: https://www.google.com/maps?q=${lat},${lng}`);
      } else {
        console.log(`   ❌ KHÔNG CÓ tọa độ`);
      }
      console.log('');
    });

    // Thống kê
    const total = await Place.countDocuments();
    const withCoords = await Place.countDocuments({
      'location.coordinates': { $exists: true, $ne: null }
    });
    const withoutCoords = total - withCoords;

    console.log('📊 THỐNG KÊ:');
    console.log(`   Tổng số địa điểm: ${total}`);
    console.log(`   ✅ Có tọa độ GPS: ${withCoords} (${((withCoords/total)*100).toFixed(1)}%)`);
    console.log(`   ❌ Chưa có tọa độ: ${withoutCoords} (${((withoutCoords/total)*100).toFixed(1)}%)`);

    // Tìm địa điểm cụ thể: Karaoke KTV Havana
    console.log('\n🔍 Tìm địa điểm: Karaoke KTV Havana');
    const havana = await Place.findOne({ 
      name: /Karaoke.*Havana/i 
    }).select('name location address');

    if (havana) {
      console.log(`   ✅ Tìm thấy: ${havana.name}`);
      if (havana.location && havana.location.coordinates) {
        const [lng, lat] = havana.location.coordinates;
        console.log(`   📍 Tọa độ: ${lat}, ${lng}`);
        console.log(`   🗺️  Google Maps: https://www.google.com/maps?q=${lat},${lng}`);
      } else {
        console.log(`   ❌ Địa điểm này CHƯA có tọa độ GPS`);
      }
    } else {
      console.log(`   ❌ Không tìm thấy địa điểm này trong database`);
    }

    mongoose.connection.close();
    console.log('\n✅ Hoàn tất!');

  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

checkLocationData();
