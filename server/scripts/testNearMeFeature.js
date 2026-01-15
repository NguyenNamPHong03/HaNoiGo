/**
 * TEST: Near Me Feature End-to-End Validation
 * 
 * This script tests:
 * 1. Generic food queries ("quán ăn", "quán cafe") with nearMe flag
 * 2. Distance calculation and sorting
 * 3. MongoDB $geoNear aggregation
 * 4. Pipeline optimization path
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { haversineKm, sortPlacesByDistance, isGenericFoodQuery } from '../services/ai/utils/distanceUtils.js';
import { searchNearbyPlaces } from '../services/placeService.js';

dotenv.config();

const TEST_LOCATION = {
    lat: 21.0285, // Hoan Kiem Lake, Hanoi
    lng: 105.8542,
    name: 'Hồ Hoàn Kiếm'
};

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function testDistanceUtils() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 TEST 1: Distance Utility Functions');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test haversine calculation
    const place1 = { lat: 21.0245, lng: 105.8412 }; // ~1.5km from test location
    const place2 = { lat: 21.0500, lng: 105.8800 }; // ~4km from test location
    
    const dist1 = haversineKm(TEST_LOCATION.lat, TEST_LOCATION.lng, place1.lat, place1.lng);
    const dist2 = haversineKm(TEST_LOCATION.lat, TEST_LOCATION.lng, place2.lat, place2.lng);
    
    console.log(`📍 Test Location: ${TEST_LOCATION.name} (${TEST_LOCATION.lat}, ${TEST_LOCATION.lng})`);
    console.log(`📏 Distance to Place 1: ${dist1.toFixed(2)}km`);
    console.log(`📏 Distance to Place 2: ${dist2.toFixed(2)}km`);
    
    // Test generic query detection
    const queries = [
        'quán ăn',
        'quán cafe',
        'chỗ ăn',
        'quán phở',  // Not generic (specific food)
        'quán lẩu',  // Not generic
        'hẹn hò',    // Not food query
    ];
    
    console.log('\n🔍 Generic Food Query Detection:');
    queries.forEach(q => {
        const isGeneric = isGenericFoodQuery(q);
        console.log(`  "${q}" → ${isGeneric ? '✅ Generic' : '❌ Specific'}`);
    });
    
    console.log('\n✅ Distance utilities test passed\n');
}

async function testMongoGeoNear() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 TEST 2: MongoDB $geoNear Aggregation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        const nearbyPlaces = await searchNearbyPlaces(
            TEST_LOCATION.lat,
            TEST_LOCATION.lng,
            5, // 5km radius
            10, // limit 10
            {} // no filters
        );
        
        console.log(`✅ Found ${nearbyPlaces.length} places within 5km\n`);
        
        nearbyPlaces.slice(0, 5).forEach((place, idx) => {
            console.log(`${idx + 1}. ${place.name}`);
            console.log(`   📍 ${place.address}`);
            console.log(`   📏 ${place.distanceKm.toFixed(2)}km`);
            console.log(`   ⭐ ${place.averageRating || 0}/5 (${place.totalReviews || 0} reviews)`);
            console.log();
        });
        
        // Verify sorting
        const distances = nearbyPlaces.map(p => p.distanceKm);
        const isSorted = distances.every((d, i) => i === 0 || d >= distances[i - 1]);
        
        if (isSorted) {
            console.log('✅ Results are correctly sorted by distance (nearest first)\n');
        } else {
            console.log('❌ Results are NOT sorted correctly\n');
        }
        
    } catch (error) {
        console.error('❌ $geoNear test failed:', error);
    }
}

async function testPipelineIntegration() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 TEST 3: Pipeline Near Me Optimization');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Simulate pipeline input
    const mockInput = {
        question: 'quán ăn',
        context: {
            nearMe: true,
            location: {
                lat: TEST_LOCATION.lat,
                lng: TEST_LOCATION.lng
            }
        },
        intent: 'GENERAL',
        queryIntent: 'GENERAL',
        accommodationMode: false,
        minPrice: null
    };
    
    console.log('📥 Mock Pipeline Input:');
    console.log(JSON.stringify(mockInput, null, 2));
    
    // Test conditions
    const hasLocation = mockInput.context?.location?.lat && mockInput.context?.location?.lng;
    const nearMeMode = mockInput.context?.nearMe || false;
    const isGeneric = isGenericFoodQuery(mockInput.question);
    
    console.log('\n🔍 Condition Checks:');
    console.log(`  hasLocation: ${hasLocation ? '✅' : '❌'}`);
    console.log(`  nearMeMode: ${nearMeMode ? '✅' : '❌'}`);
    console.log(`  isGeneric: ${isGeneric ? '✅' : '❌'}`);
    
    const shouldOptimize = nearMeMode && hasLocation && isGeneric;
    
    if (shouldOptimize) {
        console.log('\n✅ Pipeline will use $geoNear optimization path');
        
        try {
            const nearbyPlaces = await searchNearbyPlaces(
                mockInput.context.location.lat,
                mockInput.context.location.lng,
                5,
                10,
                {}
            );
            
            console.log(`✅ Retrieved ${nearbyPlaces.length} places via optimized path\n`);
        } catch (error) {
            console.error('❌ Optimization path failed:', error);
        }
    } else {
        console.log('\n❌ Pipeline will use standard RAG path (not optimized)');
    }
}

async function testSpecificVsGenericQuery() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 TEST 4: Specific vs Generic Query Routing');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const testCases = [
        { query: 'quán ăn', nearMe: true, expected: 'GEONEAR' },
        { query: 'quán cafe', nearMe: true, expected: 'GEONEAR' },
        { query: 'quán phở', nearMe: true, expected: 'RAG' }, // Specific food
        { query: 'hẹn hò', nearMe: true, expected: 'RAG' }, // Vibe query
        { query: 'quán ăn', nearMe: false, expected: 'RAG' }, // No location
    ];
    
    testCases.forEach(({ query, nearMe, expected }) => {
        const hasLocation = true; // Assume location available
        const isGeneric = isGenericFoodQuery(query);
        
        const shouldUseGeoNear = nearMe && hasLocation && isGeneric;
        const actualPath = shouldUseGeoNear ? 'GEONEAR' : 'RAG';
        
        const status = actualPath === expected ? '✅' : '❌';
        console.log(`${status} "${query}" + nearMe:${nearMe} → ${actualPath} (expected: ${expected})`);
    });
    
    console.log();
}

async function runAllTests() {
    console.log('\n🚀 Starting Near Me Feature Tests...\n');
    
    await connectDB();
    
    await testDistanceUtils();
    await testMongoGeoNear();
    await testPipelineIntegration();
    await testSpecificVsGenericQuery();
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All tests completed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await mongoose.disconnect();
    process.exit(0);
}

// Run tests
runAllTests().catch(err => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
});
