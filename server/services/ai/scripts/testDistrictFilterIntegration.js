/**
 * Quick Test - District Filter Integration
 * Test full pipeline với district filter
 */

import mainChatPipeline from '../pipelines/mainChatPipeline.js';

console.log('\n🧪 TESTING DISTRICT FILTER - FULL PIPELINE\n');
console.log('='.repeat(70));

async function testQuery(question) {
    console.log(`\n📝 Query: "${question}"`);
    console.log('-'.repeat(70));
    
    try {
        await mainChatPipeline.initialize();
        
        const result = await mainChatPipeline.execute(question, {
            userId: 'test-user',
            userPreferences: null,
            useLocation: false,
            usePersonalization: false
        });
        
        console.log(`\n✅ Results:`);
        console.log(`   - Retrieved Docs: ${result.retrievedDocs?.length || 0}`);
        console.log(`   - District Constraint: ${result.queryDistrict || 'None'}`);
        
        if (result.retrievedDocs && result.retrievedDocs.length > 0) {
            console.log(`\n📊 Top 5 Results:`);
            result.retrievedDocs.slice(0, 5).forEach((doc, i) => {
                const name = doc.metadata?.name || 'N/A';
                const district = doc.metadata?.district || 'NO DISTRICT';
                const address = doc.metadata?.address || 'N/A';
                console.log(`   ${i + 1}. ${name}`);
                console.log(`      District: ${district}`);
                console.log(`      Address: ${address.substring(0, 60)}`);
            });
        }
        
        return result;
    } catch (error) {
        console.error(`\n❌ Error:`, error.message);
        return null;
    }
}

// Test cases
const testCases = [
    'quán cafe ở đống đa',
    'tìm quán phở ở ba đình',
    'quán ăn ngon ở thanh xuân'
];

(async () => {
    for (const testCase of testCases) {
        await testQuery(testCase);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between tests
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✨ Test completed!\n');
    process.exit(0);
})();
