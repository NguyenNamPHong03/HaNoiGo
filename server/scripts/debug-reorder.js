import { sortPlacesByAnswerOrder } from '../services/ai/utils/reorderUtils.js';

// Mock Data based on screenshot
const mockAnswer = `Chào bạn! 🌼 Minh rất vui khi được giúp bạn tìm quán chè ở ngõ Tự Do!
Ở ngõ Tự Do, mình tìm thấy quán chè anh đẹp trai nè! ✨

🗺️ DANH SÁCH ĐỀ XUẤT

* Chè anh đẹp trai - Giá: 1000 VND
_(Địa chỉ: Ng. Tự Do, Đồng Tâm, Hai Bà Trưng, Hà Nội, Việt Nam)_

⚠️ Ở ngõ Tự Do mình chỉ tìm thấy quán này. Bạn có muốn mình gợi ý thêm các quán ở cùng quận Hai Bà Trưng không? 😊`;

const mockPlaces = [
    { _id: '1', name: 'Quán chè An Nhiên', address: '136 Tây Tựu, thôn Trung, Bắc Từ Liêm, Hà Nội, Vietnam' },
    { _id: '2', name: 'Chè anh đẹp trai', address: 'Ng. Tự Do, Đồng Tâm, Hai Bà Trưng, Hà Nội, Việt Nam' }
];

console.log('--- Debug Reorder Utils ---');
console.log('Answer Text Length:', mockAnswer.length);
console.log('Places before sort:', mockPlaces.map(p => p.name));

const sorted = sortPlacesByAnswerOrder(mockPlaces, mockAnswer);

console.log('Places after sort:', sorted.map(p => p.name));

// Detailed scoring check
console.log('\n--- Detailed Scoring ---');
const answerLower = mockAnswer.toLowerCase();
mockPlaces.forEach(p => {
    const nameLower = p.name.toLowerCase();
    const index = answerLower.indexOf(nameLower);
    console.log(`Place: "${p.name}"`);
    console.log(`  Lower Name: "${nameLower}"`);
    console.log(`  Found index: ${index}`);

    if (index === -1) {
        // Test strategies
        const shortName = nameLower.split(' - ')[0].trim();
        const indexShort = answerLower.indexOf(shortName);
        console.log(`  Short Name Strategy ("${shortName}"): ${indexShort}`);
    }
});
