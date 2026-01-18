/**
 * Keyword Matchers for AI Pipeline
 * Used for Intent Classification and Query Augmentation
 */

export const ACCOMMODATION_KEYWORDS = [
    'về muộn', 'về khuya', 'hẹn hò về muộn', 'hẹn hò tối muộn',
    'cần chỗ nghỉ', 'ở lại qua đêm', 'chỗ nghỉ qua đêm',
    'nghỉ qua đêm', 'ngủ qua đêm', 'nghỉ đêm', 'qua đêm',
    'nhà nghỉ', 'homestay', 'khách sạn', 'resort', 'chỗ ngủ',
    'chỗ ở', 'thuê phòng', 'đặt phòng', 'book phòng'
];

export const LUXURY_KEYWORDS = [
    'cao cấp', 'xịn', 'sang trọng', 'luxury', 'đẳng cấp',
    'high-end', 'premium', '5 sao', 'sang', 'vip',
    'đắt', 'chất lượng cao', 'resort', 'khách sạn tốt'
];

export const VEGETARIAN_KEYWORDS = [
    'chay', 'thuần chay', 'thuan chay', 'vegetarian', 'vegan',
    // Match enum values from User model
    'vegetarian', 'vegan'
];

export const SPECIFIC_FOOD_KEYWORDS = [
    'phở', 'pho', 'bún chả', 'bun cha', 'thịt', 'thit', 'lẩu', 'lau',
    'bò', 'bo', 'gà', 'ga', 'heo', 'cá', 'ca', 'hải sản', 'hai san',
    'nhậu', 'nhau', 'bia', 'bar', 'pub', 'bbq', 'nướng', 'nuong',
    'bún bò', 'bun bo', 'cơm tấm', 'com tam', 'bánh mì thịt', 'banh mi thit'
];

export const GENERIC_FOOD_KEYWORDS = [
    'quán ăn', 'quan an', 'ăn gì', 'an gi', 'tìm quán', 'tim quan',
    'gợi ý quán', 'goi y quan', 'ăn ở đâu', 'an o dau', 'đi ăn', 'di an',
    'tìm chỗ ăn', 'tim cho an', 'muốn ăn', 'muon an'
];

export const ADDRESS_MARKERS = [
    { key: 'ngõ', regex: '(?:ngõ|ng\\.?)' },
    { key: 'ngách', regex: '(?:ngách|ngh\\.?)' },
    { key: 'phố', regex: '(?:phố|p\\.?)' },
    { key: 'đường', regex: '(?:đường|đ\\.?)' },
    { key: 'quận', regex: '(?:quận|q\\.?)' },
    { key: 'phường', regex: '(?:phường|p\\.?)' }
];

export const STOP_WORDS = [
    ' với ', ' giá ', ' khoảng ', ' tầm ', ' hết ', ' cho ', ' có ',
    ' không', ' nào', ' nhỉ', ' ạ', ' ở đâu', ' đâu',
    ' để ', ' làm ', ' việc ', ' ở ', ' muốn '
];
