/**
 * Debug Script: Check District Data in DB and Pinecone
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Place from '../../../models/Place.js';
import vectorStoreFactory from '../core/vectorStoreFactory.js';

dotenv.config();

async function debugDistrictData() {
    try {
        console.log('\n🔍 DISTRICT DATA DEBUG\n');
        console.log('='.repeat(70));
        
        // Connect to MongoDB
        console.log('\n1. Checking MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Get sample places with "cafe" in Dong Da
        const dongDaPlaces = await Place.find({
            name: /cafe/i,
            district: 'Đống Đa',
            status: 'Published',
            isActive: true
        }).limit(5).lean();
        
        console.log(`\n✅ Found ${dongDaPlaces.length} cafes in Đống Đa (MongoDB):`);
        dongDaPlaces.forEach((place, i) => {
            console.log(`\n   ${i + 1}. ${place.name}`);
            console.log(`      District: ${place.district}`);
            console.log(`      Address: ${place.address}`);
        });
        
        // Get places from OTHER districts with "cafe"
        const otherPlaces = await Place.find({
            name: /cafe/i,
            district: { $ne: 'Đống Đa' },
            status: 'Published',
            isActive: true
        }).limit(5).lean();
        
        console.log(`\n\n✅ Found ${otherPlaces.length} cafes in OTHER districts (MongoDB):`);
        otherPlaces.forEach((place, i) => {
            console.log(`\n   ${i + 1}. ${place.name}`);
            console.log(`      District: ${place.district}`);
            console.log(`      Address: ${place.address}`);
        });
        
        // Check Pinecone
        console.log('\n\n2. Checking Pinecone...');
        await vectorStoreFactory.initialize();
        
        const pineconeResults = await vectorStoreFactory.querySimilar('cafe dong da', 10);
        
        console.log(`\n✅ Pinecone returned ${pineconeResults.length} results for "cafe dong da":`);
        pineconeResults.forEach((result, i) => {
            const name = result.metadata?.name || 'N/A';
            const district = result.metadata?.district || 'NO DISTRICT';
            const address = result.metadata?.address || 'N/A';
            
            console.log(`\n   ${i + 1}. ${name}`);
            console.log(`      District in metadata: "${district}"`);
            console.log(`      Address: ${address.substring(0, 60)}`);
        });
        
        console.log('\n' + '='.repeat(70));
        console.log('✨ Debug completed!\n');
        
        await mongoose.disconnect();
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Debug failed:', error);
        process.exit(1);
    }
}

debugDistrictData();
