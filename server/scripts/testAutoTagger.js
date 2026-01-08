import { generateAiTagsFromGoogle, mergeAiTags } from '../services/autoTaggerService.js';

console.log('🧪 Testing Auto-Tagger Service\n');

// Test case 1: Cafe with additionalInfo
const testCase1 = {
  additionalInfo: {
    'Các tùy chọn dịch vụ': [
      { 'Đồ ăn mang đi': true },
      { 'Ăn tại chỗ': true }
    ],
    'Tiện nghi': [
      { 'Wi-Fi': true },
      { 'Điều hòa': true }
    ],
    'Bầu không khí': [
      { 'Ấm cúng': true },
      { 'Yên tĩnh': true },
      { 'Lãng mạn': true }
    ]
  },
  reviews: [
    { text: 'Quán cafe yên tĩnh, phù hợp học bài. Wifi tốt.' },
    { text: 'Không gian ấm cúng, thích hợp hẹn hò. View đẹp!' }
  ],
  category: 'Quán cà phê'
};

console.log('📋 Test Case 1: Cafe với additionalInfo tiếng Việt');
const result1 = generateAiTagsFromGoogle(testCase1);
console.log('\n✅ Generated AI Tags:');
console.log(JSON.stringify(result1, null, 2));

// Test case 2: Restaurant
const testCase2 = {
  additionalInfo: {
    'Các tùy chọn dịch vụ': [
      { 'Giao hàng': true },
      { 'Chỗ ngồi ngoài trời': true }
    ],
    'Tiện nghi': [
      { 'Chấp nhận thẻ tín dụng': true },
      { 'Bãi đỗ xe': true }
    ],
    'Bầu không khí': [
      { 'Sôi động': true },
      { 'Nhộn nhịp': true }
    ]
  },
  category: 'Nhà hàng'
};

console.log('\n\n📋 Test Case 2: Nhà hàng');
const result2 = generateAiTagsFromGoogle(testCase2);
console.log('\n✅ Generated AI Tags:');
console.log(JSON.stringify(result2, null, 2));

// Test case 3: Merge existing tags
console.log('\n\n📋 Test Case 3: Merge tags');
const existingTags = {
  space: ['ấm cúng', 'rộng rãi'],
  mood: ['chill'],
  suitability: ['hẹn hò']
};

const newTags = {
  space: ['ấm cúng', 'yên tĩnh'], // duplicate + new
  mood: ['lãng mạn'],
  suitability: ['học bài']
};

const merged = mergeAiTags(existingTags, newTags);
console.log('Existing:', existingTags);
console.log('New:', newTags);
console.log('\n✅ Merged (unique):');
console.log(JSON.stringify(merged, null, 2));

console.log('\n\n✅ All tests completed!');
