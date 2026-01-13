/**
 * Preferences Mapper - Map user preferences to AI retrieval filters
 * Giúp cá nhân hóa kết quả tìm kiếm dựa trên sở thích người dùng
 */

/**
 * Map user preferences to Pinecone filters
 * @param {Object} userPreferences - User preferences from User model
 * @returns {Object} Pinecone filter object
 */
export const mapPreferencesToFilters = (userPreferences) => {
  if (!userPreferences) return {};

  const filters = {};

  // Map atmosphere preferences to aiTags.mood or aiTags.space
  if (userPreferences.atmosphere && userPreferences.atmosphere.length > 0) {
    // Atmosphere mapping: user preference -> aiTags
    const atmosphereMapping = {
      'quiet': ['yên tĩnh', 'yên bình', 'thư giãn'],
      'lively': ['sôi động', 'năng động', 'vui vẻ'],
      'cheerful': ['vui vẻ', 'sôi động'],
      'romantic': ['lãng mạn', 'ấm cúng'],
      'cozy': ['ấm cúng', 'thư giãn'],
      'elegant': ['chuyên nghiệp', 'thanh lịch'],
      'outdoor': ['ngoài trời', 'thoáng đãng', 'rooftop']
    };

    // Collect all matching moods
    const matchingMoods = [];
    userPreferences.atmosphere.forEach(atm => {
      if (atmosphereMapping[atm]) {
        matchingMoods.push(...atmosphereMapping[atm]);
      }
    });

    if (matchingMoods.length > 0) {
      // Use $in operator for multiple values
      filters['aiTags.mood'] = { '$in': [...new Set(matchingMoods)] };
    }
  }

  // Map activities preferences to aiTags.suitability
  if (userPreferences.activities && userPreferences.activities.length > 0) {
    const activityMapping = {
      'singing': ['karaoke', 'tụ tập'],
      'live-music': ['sôi động', 'vui vẻ'],
      'watch-football': ['tụ tập', 'nhóm lớn'],
      'hangout': ['bạn bè', 'tụ tập', 'nhóm lớn'],
      'dating': ['hẹn hò', 'lãng mạn'],
      'work-study': ['học bài', 'công việc', 'một mình']
    };

    const matchingSuitability = [];
    userPreferences.activities.forEach(activity => {
      if (activityMapping[activity]) {
        matchingSuitability.push(...activityMapping[activity]);
      }
    });

    if (matchingSuitability.length > 0) {
      filters['aiTags.suitability'] = { '$in': [...new Set(matchingSuitability)] };
    }
  }

  // Map dietary preferences (for filtering food places)
  if (userPreferences.dietary && userPreferences.dietary.length > 0) {
    // Store dietary info for later use in ranking/filtering
    filters['_userDietary'] = userPreferences.dietary;
  }

  // Map styles preferences to aiTags.space
  if (userPreferences.styles && userPreferences.styles.length > 0) {
    const styleMapping = {
      'modern': ['hiện đại', 'thoáng đãng'],
      'traditional': ['cổ điển', 'vintage'],
      'cozy': ['ấm cúng', 'riêng tư'],
      'elegant': ['thanh lịch', 'chuyên nghiệp'],
      'casual': ['thoải mái', 'đơn giản'],
      'upscale': ['cao cấp', 'sang trọng']
    };

    const matchingSpace = [];
    userPreferences.styles.forEach(style => {
      if (styleMapping[style]) {
        matchingSpace.push(...styleMapping[style]);
      }
    });

    if (matchingSpace.length > 0) {
      filters['aiTags.space'] = { '$in': [...new Set(matchingSpace)] };
    }
  }

  return filters;
};

/**
 * Create preference-enhanced context for AI prompt
 * @param {Object} userPreferences - User preferences
 * @returns {String} Formatted preference context
 */
export const formatPreferencesForPrompt = (userPreferences) => {
  if (!userPreferences) return '';

  const parts = [];

  if (userPreferences.favoriteFoods && userPreferences.favoriteFoods.length > 0) {
    parts.push(`Món ăn yêu thích: ${userPreferences.favoriteFoods.join(', ')}`);
  }

  if (userPreferences.styles && userPreferences.styles.length > 0) {
    const styleLabels = {
      'modern': 'Hiện đại',
      'traditional': 'Truyền thống',
      'cozy': 'Ấm cúng',
      'elegant': 'Thanh lịch',
      'casual': 'Giản dị',
      'upscale': 'Cao cấp'
    };
    const styles = userPreferences.styles.map(s => styleLabels[s] || s);
    parts.push(`Phong cách: ${styles.join(', ')}`);
  }

  if (userPreferences.dietary && userPreferences.dietary.length > 0) {
    const dietaryLabels = {
      'vegetarian': 'Chay',
      'vegan': 'Thuần chay',
      'non-vegetarian': 'Ăn mặn',
      'healthy': 'Ăn healthy',
      'low-spicy': 'Ít cay',
      'low-fat': 'Ít dầu mỡ',
      'low-carb': 'Ít tinh bột'
    };
    const dietary = userPreferences.dietary.map(d => dietaryLabels[d] || d);
    parts.push(`Chế độ ăn: ${dietary.join(', ')}`);
  }

  if (userPreferences.atmosphere && userPreferences.atmosphere.length > 0) {
    const atmosphereLabels = {
      'quiet': 'Yên tĩnh',
      'lively': 'Sôi động',
      'cheerful': 'Vui nhộn',
      'romantic': 'Lãng mạn',
      'cozy': 'Ấm cúng',
      'elegant': 'Thanh lịch',
      'outdoor': 'Ngoài trời'
    };
    const atmosphere = userPreferences.atmosphere.map(a => atmosphereLabels[a] || a);
    parts.push(`Không khí: ${atmosphere.join(', ')}`);
  }

  if (userPreferences.activities && userPreferences.activities.length > 0) {
    const activityLabels = {
      'singing': 'Hát hò',
      'live-music': 'Live music',
      'watch-football': 'Xem bóng đá',
      'hangout': 'Tụ tập bạn bè',
      'dating': 'Hẹn hò',
      'work-study': 'Làm việc/học bài'
    };
    const activities = userPreferences.activities.map(a => activityLabels[a] || a);
    parts.push(`Hoạt động: ${activities.join(', ')}`);
  }

  return parts.length > 0 ? parts.join(' | ') : '';
};

/**
 * Calculate preference match score for ranking
 * @param {Object} place - Place document
 * @param {Object} userPreferences - User preferences
 * @returns {Number} Match score (0-1)
 */
export const calculatePreferenceScore = (place, userPreferences) => {
  if (!userPreferences || !place.aiTags) return 0;

  let score = 0;
  let totalChecks = 0;

  // Check atmosphere match
  if (userPreferences.atmosphere && userPreferences.atmosphere.length > 0) {
    totalChecks++;
    const matchCount = userPreferences.atmosphere.filter(atm => {
      // Check if place mood/space matches user atmosphere preference
      const atmosphereMapping = {
        'quiet': ['yên tĩnh', 'yên bình'],
        'lively': ['sôi động', 'năng động'],
        'romantic': ['lãng mạn', 'ấm cúng'],
        'outdoor': ['ngoài trời', 'rooftop']
      };
      
      const targetTags = atmosphereMapping[atm] || [];
      return place.aiTags.mood?.some(m => targetTags.includes(m)) ||
             place.aiTags.space?.some(s => targetTags.includes(s));
    }).length;
    
    score += matchCount / userPreferences.atmosphere.length;
  }

  // Check activities match
  if (userPreferences.activities && userPreferences.activities.length > 0) {
    totalChecks++;
    const activityMapping = {
      'dating': ['hẹn hò', 'lãng mạn'],
      'work-study': ['học bài', 'công việc'],
      'hangout': ['bạn bè', 'tụ tập']
    };

    const matchCount = userPreferences.activities.filter(act => {
      const targetTags = activityMapping[act] || [];
      return place.aiTags.suitability?.some(s => targetTags.includes(s));
    }).length;

    score += matchCount / userPreferences.activities.length;
  }

  return totalChecks > 0 ? score / totalChecks : 0;
};

export default {
  mapPreferencesToFilters,
  formatPreferencesForPrompt,
  calculatePreferenceScore
};
