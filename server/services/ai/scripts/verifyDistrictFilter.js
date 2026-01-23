#!/usr/bin/env node

/**
 * Verification Script - District Filter Implementation
 * Kiểm tra xem tất cả các files đã được update chưa
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 DISTRICT FILTER - Implementation Verification\n');
console.log('='.repeat(70));

const checks = [
    {
        name: 'District Extractor exists',
        file: '../retrieval/extractors/districtExtractor.js',
        check: (content) => content.includes('class DistrictExtractor')
    },
    {
        name: 'QueryAnalyzer imports districtExtractor',
        file: '../pipelines/stages/02-QueryAnalyzer.js',
        check: (content) => content.includes("import districtExtractor from '../../retrieval/extractors/districtExtractor.js'")
    },
    {
        name: 'QueryAnalyzer has extractDistrict method',
        file: '../pipelines/stages/02-QueryAnalyzer.js',
        check: (content) => content.includes('async extractDistrict(input)')
    },
    {
        name: 'QueryAnalyzer calls extractDistrict in parallel',
        file: '../pipelines/stages/02-QueryAnalyzer.js',
        check: (content) => content.includes('this.extractDistrict(input)')
    },
    {
        name: 'KeywordSearchStrategy accepts districtFilter',
        file: '../pipelines/stages/retrieval/KeywordSearchStrategy.js',
        check: (content) => content.includes('districtFilter = input.districtMustQuery')
    },
    {
        name: 'AddressRegexStrategy accepts districtFilter',
        file: '../pipelines/stages/retrieval/AddressRegexStrategy.js',
        check: (content) => content.includes('districtFilter = null')
    },
    {
        name: 'NearbySearchStrategy accepts districtFilter',
        file: '../pipelines/stages/retrieval/NearbySearchStrategy.js',
        check: (content) => content.includes('districtFilter = null')
    },
    {
        name: 'HybridSearchEngine passes districtFilter',
        file: '../pipelines/stages/04-HybridSearchEngine.js',
        check: (content) => content.includes('const districtFilter = input.districtMustQuery')
    },
    {
        name: 'searchPlaces accepts districtFilter',
        file: '../../placeService.js',
        check: (content) => content.includes('districtFilter = null) =>')
    },
    {
        name: 'searchPlacesByRegex accepts districtFilter',
        file: '../../placeService.js',
        check: (content) => content.match(/searchPlacesByRegex.*districtFilter/)
    },
    {
        name: 'searchPlacesByVibe accepts districtFilter',
        file: '../../placeService.js',
        check: (content) => content.match(/searchPlacesByVibe.*districtFilter/)
    },
    {
        name: 'searchNearbyPlaces supports district in filters',
        file: '../../placeService.js',
        check: (content) => content.includes('district } = filters')
    }
];

let passed = 0;
let failed = 0;

checks.forEach((test, index) => {
    const filePath = path.resolve(__dirname, test.file);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`\n${index + 1}. ❌ ${test.name}`);
            console.log(`   File not found: ${test.file}`);
            failed++;
            return;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const result = test.check(content);

        if (result) {
            console.log(`\n${index + 1}. ✅ ${test.name}`);
            passed++;
        } else {
            console.log(`\n${index + 1}. ❌ ${test.name}`);
            console.log(`   Check failed in: ${test.file}`);
            failed++;
        }
    } catch (error) {
        console.log(`\n${index + 1}. ❌ ${test.name}`);
        console.log(`   Error: ${error.message}`);
        failed++;
    }
});

console.log('\n' + '='.repeat(70));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
    console.log('✨ All checks passed! Implementation is complete.\n');
    console.log('Next steps:');
    console.log('1. Run test script: node testDistrictFilter.js');
    console.log('2. Start server and test API');
    console.log('3. Monitor logs for "📍 DISTRICT MODE" messages\n');
} else {
    console.log('⚠️  Some checks failed. Please review the implementation.\n');
    process.exit(1);
}
