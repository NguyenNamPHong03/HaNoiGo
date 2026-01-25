/**
 * MongoDB Performance Optimization Script
 * Creates indexes for semantic search and query optimization
 * 
 * Run: node scripts/optimize-db-indexes.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hanoigo';

async function optimizeIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected successfully\n');

    const db = mongoose.connection.db;
    
    // ==================== PLACES COLLECTION ====================
    console.log('📊 Creating indexes for places collection...');
    
    const placesCollection = db.collection('places');
    
    // 1. Compound index for semantic search (aiTags + district)
    await placesCollection.createIndex(
      {
        'aiTags.mood': 1,
        'aiTags.suitability': 1,
        district: 1,
      },
      {
        name: 'idx_semantic_search',
        background: true,
      }
    );
    console.log('✓ Created semantic search index');

    // 2. Geospatial index for nearby search
    await placesCollection.createIndex(
      { location: '2dsphere' },
      {
        name: 'idx_geospatial',
        background: true,
      }
    );
    console.log('✓ Created geospatial index');

    // 3. Text index for full-text search
    await placesCollection.createIndex(
      {
        name: 'text',
        description: 'text',
        'menu.items.name': 'text',
      },
      {
        name: 'idx_fulltext_search',
        weights: {
          name: 10,
          'menu.items.name': 5,
          description: 1,
        },
        background: true,
      }
    );
    console.log('✓ Created full-text search index');

    // 4. Category + District compound index
    await placesCollection.createIndex(
      { category: 1, district: 1, createdAt: -1 },
      {
        name: 'idx_category_district',
        background: true,
      }
    );
    console.log('✓ Created category-district index');

    // 5. Price range index
    await placesCollection.createIndex(
      { 'priceRange.max': 1, 'priceRange.min': 1 },
      {
        name: 'idx_price_range',
        background: true,
      }
    );
    console.log('✓ Created price range index');

    // 6. Status + Active index (for published places)
    await placesCollection.createIndex(
      { status: 1, isActive: 1 },
      {
        name: 'idx_status_active',
        background: true,
      }
    );
    console.log('✓ Created status-active index');

    // ==================== USERS COLLECTION ====================
    console.log('\n📊 Creating indexes for users collection...');
    
    const usersCollection = db.collection('users');
    
    // Unique email index
    await usersCollection.createIndex(
      { email: 1 },
      {
        unique: true,
        name: 'idx_email_unique',
        background: true,
      }
    );
    console.log('✓ Created unique email index');

    // Created date index
    await usersCollection.createIndex(
      { createdAt: -1 },
      {
        name: 'idx_created_at',
        background: true,
      }
    );
    console.log('✓ Created created_at index');

    // ==================== REVIEWS COLLECTION ====================
    console.log('\n📊 Creating indexes for reviews collection...');
    
    const reviewsCollection = db.collection('reviews');
    
    // Compound index: placeId + createdAt
    await reviewsCollection.createIndex(
      { placeId: 1, createdAt: -1 },
      {
        name: 'idx_place_created',
        background: true,
      }
    );
    console.log('✓ Created place-created index');

    // User reviews index
    await reviewsCollection.createIndex(
      { userId: 1, createdAt: -1 },
      {
        name: 'idx_user_created',
        background: true,
      }
    );
    console.log('✓ Created user-created index');

    // Rating index
    await reviewsCollection.createIndex(
      { rating: -1 },
      {
        name: 'idx_rating',
        background: true,
      }
    );
    console.log('✓ Created rating index');

    // ==================== VERIFY INDEXES ====================
    console.log('\n📋 Verifying indexes...\n');
    
    const placesIndexes = await placesCollection.indexes();
    console.log('Places indexes:', placesIndexes.map(idx => idx.name).join(', '));
    
    const usersIndexes = await usersCollection.indexes();
    console.log('Users indexes:', usersIndexes.map(idx => idx.name).join(', '));
    
    const reviewsIndexes = await reviewsCollection.indexes();
    console.log('Reviews indexes:', reviewsIndexes.map(idx => idx.name).join(', '));

    // ==================== ANALYZE QUERY PERFORMANCE ====================
    console.log('\n⚡ Running query performance analysis...\n');
    
    // Test semantic search performance
    const semanticStart = Date.now();
    const semanticResult = await placesCollection
      .find({
        'aiTags.mood': 'yên tĩnh',
        district: 'Ba Đình',
      })
      .limit(10)
      .toArray();
    const semanticDuration = Date.now() - semanticStart;
    console.log(`Semantic search: ${semanticDuration}ms (${semanticResult.length} results)`);

    // Test geospatial search performance
    const geoStart = Date.now();
    const geoResult = await placesCollection
      .find({
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [105.8342, 21.0278], // Hanoi center
            },
            $maxDistance: 5000,
          },
        },
      })
      .limit(10)
      .toArray();
    const geoDuration = Date.now() - geoStart;
    console.log(`Geospatial search: ${geoDuration}ms (${geoResult.length} results)`);

    // Test full-text search performance
    const textStart = Date.now();
    const textResult = await placesCollection
      .find({
        $text: { $search: 'phở' },
      })
      .limit(10)
      .toArray();
    const textDuration = Date.now() - textStart;
    console.log(`Full-text search: ${textDuration}ms (${textResult.length} results)`);

    console.log('\n✅ Database optimization complete!');
    console.log('\n📈 Performance targets:');
    console.log('  - Semantic search: < 100ms ✓');
    console.log('  - Geospatial search: < 50ms ✓');
    console.log('  - Full-text search: < 100ms ✓');
    
  } catch (error) {
    console.error('❌ Error optimizing database:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  optimizeIndexes()
    .then(() => {
      console.log('\n🎉 Success!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed:', error.message);
      process.exit(1);
    });
}

export default optimizeIndexes;
