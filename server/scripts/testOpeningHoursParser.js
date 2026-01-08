import { parseGoogleOpeningHours } from '../services/autoTaggerService.js';

console.log('🧪 Testing Google openingHours Parser\n');

// Test case 1: Normal hours (single period)
const testCase1 = [
  { day: 'Thứ Hai', hours: '11:00 to 15:00' },
  { day: 'Thứ Ba', hours: '11:00 to 22:30' },
  { day: 'Thứ Tư', hours: '07:00 to 22:30' },
  { day: 'Thứ Năm', hours: '07:00 to 22:30' },
  { day: 'Thứ Sáu', hours: '07:00 to 22:30' },
  { day: 'Thứ Bảy', hours: '10:30 to 22:30' },
  { day: 'Chủ Nhật', hours: '10:30 to 22:30' }
];

console.log('📋 Test Case 1: Normal single period hours');
const result1 = parseGoogleOpeningHours(testCase1);
console.log(JSON.stringify(result1, null, 2));

// Test case 2: Multiple periods (lunch + dinner)
const testCase2 = [
  { day: 'Thứ Hai', hours: '11:00 to 15:00, 17:00 to 21:30' },
  { day: 'Thứ Ba', hours: '11:00 to 15:00, 17:00 to 21:30' },
  { day: 'Thứ Tư', hours: '11:00 to 15:00, 17:00 to 21:30' },
  { day: 'Thứ Năm', hours: '11:00 to 15:00, 17:00 to 21:30' },
  { day: 'Thứ Sáu', hours: '11:00 to 15:00, 17:00 to 21:30' },
  { day: 'Thứ Bảy', hours: '10:30 to 15:00, 17:00 to 21:30' },
  { day: 'Chủ Nhật', hours: '10:30 to 15:00, 17:00 to 21:30' }
];

console.log('\n\n📋 Test Case 2: Multiple periods (lunch + dinner)');
const result2 = parseGoogleOpeningHours(testCase2);
console.log('✅ Result (should take first period only):');
console.log(JSON.stringify(result2, null, 2));

// Test case 3: Closed day
const testCase3 = [
  { day: 'Thứ Hai', hours: '11:00 to 22:00' },
  { day: 'Thứ Ba', hours: 'Đóng cửa' },
  { day: 'Thứ Tư', hours: '11:00 to 22:00' }
];

console.log('\n\n📋 Test Case 3: Closed day');
const result3 = parseGoogleOpeningHours(testCase3);
console.log(JSON.stringify(result3, null, 2));

// Test case 4: Time normalization
const testCase4 = [
  { day: 'Thứ Hai', hours: '7:00 to 22:30' }, // Should normalize to 07:00
  { day: 'Thứ Ba', hours: '09:00 to 23:45' }
];

console.log('\n\n📋 Test Case 4: Time normalization (7:00 → 07:00)');
const result4 = parseGoogleOpeningHours(testCase4);
console.log(JSON.stringify(result4, null, 2));

console.log('\n\n✅ All tests completed!');
