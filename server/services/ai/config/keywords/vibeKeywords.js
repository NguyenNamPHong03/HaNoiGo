/**
 * Vibe Keywords Configuration
 * Keywords for PLACE_VIBE intent classification
 */

export const VIBE_KEYWORDS = [
    // Dating & Romance
    'hẹn hò', 'date', 'dating', 'lãng mạn', 'romantic', 'romance',
    'riêng tư', 'private', 'kín đáo', 'ấm cúng', 'cozy',
    'buổi hẹn', 'đi hẹn', 'hẹn với crush', 'đưa crush', 'đưa bạn gái', 'đưa bạn trai',
    'couple', 'đôi lứa', 'tình nhân', 'người yêu',
    
    // Mood & Atmosphere
    'chill', 'thư giãn', 'relax', 'yên tĩnh', 'quiet', 'peaceful',
    'sôi động', 'lively', 'náo nhiệt', 'vui vẻ', 'fun',
    
    // Visual & Aesthetic
    'view đẹp', 'view', 'cảnh đẹp', 'scenic', 'sống ảo', 'instagram',
    'đẹp', 'aesthetic', 'vintage', 'sang trọng', 'luxury', 'cao cấp',
    'ánh sáng đẹp', 'không gian đẹp', 'trang trí đẹp',
    
    // Social Context
    'gia đình', 'family', 'bạn bè', 'friends', 'đám đông', 'nhóm',
    
    // Study/Work
    'học bài', 'study', 'làm việc', 'work', 'làm việc nhóm'
];

/**
 * Vibe to Tags Mapping
 * Maps vibe keywords to aiTags for filtering
 */
export const VIBE_TO_TAGS_MAP = {
    // Dating & Romance
    'hẹn hò': ['lãng mạn', 'romantic', 'view đẹp', 'ấm cúng', 'riêng tư', 'rooftop', 'fine dining'],
    'date': ['lãng mạn', 'romantic', 'view đẹp', 'ấm cúng', 'riêng tư', 'rooftop'],
    'dating': ['lãng mạn', 'romantic', 'view đẹp', 'ấm cúng', 'riêng tư'],
    'buổi hẹn': ['lãng mạn', 'view đẹp', 'ấm cúng', 'riêng tư', 'rooftop'],
    'lãng mạn': ['lãng mạn', 'romantic', 'ấm cúng', 'view đẹp', 'riêng tư', 'rooftop'],
    'romantic': ['lãng mạn', 'romantic', 'ấm cúng', 'view đẹp', 'riêng tư'],
    'riêng tư': ['riêng tư', 'private', 'kín đáo', 'yên tĩnh', 'ấm cúng'],
    'couple': ['lãng mạn', 'romantic', 'view đẹp', 'ấm cúng', 'riêng tư'],
    'đôi lứa': ['lãng mạn', 'view đẹp', 'ấm cúng', 'riêng tư'],
    
    // Mood
    'chill': ['chill', 'thư giãn', 'relax', 'yên tĩnh'],
    'yên tĩnh': ['yên tĩnh', 'quiet', 'peaceful', 'chill'],
    'sôi động': ['sôi động', 'lively', 'vui vẻ', 'náo nhiệt'],
    
    // Visual
    'view đẹp': ['view đẹp', 'scenic', 'cảnh đẹp', 'sống ảo'],
    'sống ảo': ['sống ảo', 'instagram', 'aesthetic', 'đẹp'],
    
    // Social
    'gia đình': ['gia đình', 'family-friendly', 'thân thiện'],
    'bạn bè': ['bạn bè', 'nhóm', 'tụ tập'],
    
    // Study/Work
    'học bài': ['yên tĩnh', 'study-friendly', 'wifi', 'ổ điện'],
    'làm việc': ['work-friendly', 'wifi', 'yên tĩnh', 'ổ điện']
};
