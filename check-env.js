import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
config({ path: join(__dirname, '.env') });

console.log('\n🔍 Checking Environment Variables...\n');

const checks = [
    { name: 'OPENAI_API_KEY', required: true, minLength: 20 },
    { name: 'PINECONE_API_KEY', required: true, minLength: 20 },
    { name: 'PINECONE_INDEX_NAME', required: false },
    { name: 'PINECONE_ENVIRONMENT', required: false },
    { name: 'MONGODB_URI', required: true, minLength: 20 },
    { name: 'COHERE_API_KEY', required: false },
    { name: 'REDIS_URL', required: false }
];

let hasErrors = false;
let warnings = 0;

checks.forEach(check => {
    const value = process.env[check.name];
    const exists = !!value;
    const isValid = exists && value.length >= (check.minLength || 0);
    const isPlaceholder = value && (
        value.includes('your-') || 
        value.includes('xxx') || 
        value.includes('placeholder')
    );

    let status = '';
    if (!exists) {
        status = check.required ? '❌ MISSING (Required)' : '⚠️  Not set (Optional)';
        if (check.required) hasErrors = true;
        else warnings++;
    } else if (isPlaceholder) {
        status = '⚠️  PLACEHOLDER (Replace with real value)';
        if (check.required) hasErrors = true;
        else warnings++;
    } else if (!isValid) {
        status = `⚠️  Too short (expected ${check.minLength}+ chars)`;
        if (check.required) hasErrors = true;
        else warnings++;
    } else {
        status = `✅ OK (${value.length} chars)`;
    }

    const displayValue = exists 
        ? (value.length > 40 ? value.substring(0, 20) + '...' : value)
        : 'undefined';

    console.log(`${status}`);
    console.log(`   ${check.name}: ${displayValue}`);
    console.log();
});

console.log('═'.repeat(60));
if (hasErrors) {
    console.log('❌ Environment NOT ready - Fix required variables above');
    console.log('\n💡 Steps:');
    console.log('   1. Get OpenAI key: https://platform.openai.com/api-keys');
    console.log('   2. Get Pinecone key: https://app.pinecone.io/');
    console.log('   3. Update .env file with real values');
    process.exit(1);
} else if (warnings > 0) {
    console.log(`⚠️  Environment ready with ${warnings} optional warnings`);
    process.exit(0);
} else {
    console.log('✅ Environment fully configured!');
    process.exit(0);
}
