/**
 * Mood Mapping Configuration
 * Maps user emotions/moods to searchable place tags and keywords
 */

const MOOD_MAPPING = {
    sad: {
        keywords: ['buồn', 'sầu', 'tâm trạng', 'chán', 'thất tình', 'cô đơn', 'lòng nặng trĩu'],
        relatedTags: ['yên tĩnh', 'riêng tư', 'chill', 'nhạc nhẹ', 'acoustic', 'góc nhỏ', 'trầm lắng'],
        excludeTags: ['sôi động', 'edm', 'tụ tập đông', 'náo nhiệt', 'bar sàn', 'nhạc mạnh']
    },
    happy: {
        keywords: ['vui', 'phấn khích', 'ăn mừng', 'quẩy', 'hạnh phúc', 'yêu đời'],
        relatedTags: ['sôi động', 'năng động', 'nhạc sống', 'view đẹp', 'tụ tập', 'party', 'vui vẻ'],
        excludeTags: ['yên tĩnh', 'trầm lắng', 'buồn']
    },
    stress: {
        keywords: ['áp lực', 'mệt mỏi', 'stress', 'căng thẳng', 'bế tắc', 'muốn đi trốn'],
        relatedTags: ['thiên nhiên', 'thoáng đãng', 'chữa lành', 'spa', 'massage', 'thư giãn', 'bình yên', 'trong lành'],
        excludeTags: ['ồn ào', 'đông đúc', 'chen chúc']
    },
    romantic: {
        keywords: ['hẹn hò', 'người yêu', 'lãng mạn', 'tỏ tình', 'cầu hôn', 'kỷ niệm', 'date'],
        relatedTags: ['lãng mạn', 'ấm cúng', 'view hồ', 'rooftop', 'fine dining', 'nhà hàng pháp', 'nến'],
        excludeTags: ['bình dân', 'vỉa hè ồn ào', 'quán nhậu', 'bụi bặm']
    },
    chill: {
        keywords: ['chill', 'thư giãn', 'nhẹ nhàng', 'bình thản', 'relax'],
        relatedTags: ['chill', 'view đẹp', 'nhạc chill', 'lofi', 'nhẹ nhàng', 'cafe sách'],
        excludeTags: ['xập xình', 'ồn ào']
    }
};

export default MOOD_MAPPING;
