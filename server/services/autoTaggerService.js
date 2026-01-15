import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load tag rules từ config
const tagRulesPath = path.join(__dirname, '../config/tagRules.json');
const tagRules = JSON.parse(fs.readFileSync(tagRulesPath, 'utf8'));

/**
 * Tự động sinh AI tags từ Google/Goong data
 * @param {Object} googleData - Dữ liệu từ Google/Goong
 * @returns {Object} aiTags object với các categories đã được populate
 */
export const generateAiTagsFromGoogle = (googleData) => {
  const aiTags = {
    space: [],
    mood: [],
    suitability: [],
    crowdLevel: [],
    music: [],
    parking: [],
    specialFeatures: []
  };

  if (!googleData) {
    console.log('⚠️ No Google data provided for auto-tagging');
    return aiTags;
  }

  console.log('🤖 Auto-generating AI tags from Google data...');

  // 1. Parse additionalInfo (tiếng Việt từ Goong/Google)
  if (googleData.additionalInfo && typeof googleData.additionalInfo === 'object') {
    const additionalInfoText = extractTextFromAdditionalInfo(googleData.additionalInfo);
    matchKeywordsToTags(additionalInfoText, aiTags);
    console.log(`📋 Parsed additionalInfo: ${additionalInfoText.length} chars`);
  }

  // 2. Parse reviews (text content)
  if (googleData.reviews && Array.isArray(googleData.reviews)) {
    const reviewTexts = googleData.reviews
      .map(r => r.text || r.snippet || '')
      .join(' ')
      .toLowerCase();
    matchKeywordsToTags(reviewTexts, aiTags);
    console.log(`💬 Parsed ${googleData.reviews.length} reviews`);
  }

  // 3. Parse categories/types
  if (googleData.category || googleData.categoryName) {
    const categoryText = googleData.category || googleData.categoryName;
    matchCategoryToTags(categoryText.toLowerCase(), aiTags);
    console.log(`🏷️ Category: ${categoryText}`);
  }

  // 4. Remove duplicates
  Object.keys(aiTags).forEach(key => {
    aiTags[key] = [...new Set(aiTags[key])];
  });

  const totalTags = Object.values(aiTags).flat().length;
  console.log(`✅ Generated ${totalTags} AI tags automatically`);
  
  return aiTags;
};

/**
 * Extract text từ additionalInfo object (nested structure)
 * @param {Object} additionalInfo - Nested object từ Goong
 * @returns {String} Combined text
 */
const extractTextFromAdditionalInfo = (additionalInfo) => {
  const texts = [];

  Object.entries(additionalInfo).forEach(([category, items]) => {
    // Skip reviews array
    if (category === 'reviews') return;

    if (typeof items === 'string') {
      texts.push(items);
    } else if (Array.isArray(items)) {
      items.forEach(item => {
        if (typeof item === 'object') {
          // Format: { "Wifi miễn phí": true }
          Object.entries(item).forEach(([key, value]) => {
            if (value === true) {
              texts.push(key);
            }
          });
        } else if (typeof item === 'string') {
          texts.push(item);
        }
      });
    }
  });

  return texts.join(' ').toLowerCase();
};

/**
 * Match keywords trong text với tag rules
 * @param {String} text - Text cần parse
 * @param {Object} aiTags - Object aiTags để populate (mutated)
 */
const matchKeywordsToTags = (text, aiTags) => {
  if (!text) return;

  Object.entries(tagRules).forEach(([category, rules]) => {
    rules.forEach(rule => {
      // Check if any keyword matches
      const hasMatch = rule.match.some(keyword => 
        text.includes(keyword.toLowerCase())
      );

      if (hasMatch && !aiTags[category].includes(rule.tag)) {
        aiTags[category].push(rule.tag);
        console.log(`  ✓ Matched "${rule.match[0]}" → ${category}: ${rule.tag}`);
      }
    });
  });
};

/**
 * Map category name sang suitability tags
 * @param {String} category - Category name (e.g., "Nhà hàng", "Quán cà phê")
 * @param {Object} aiTags - Object aiTags để populate (mutated)
 */
const matchCategoryToTags = (category, aiTags) => {
  // Category-based logic
  if (category.includes('cà phê') || category.includes('cafe')) {
    if (!aiTags.suitability.includes('học bài')) {
      aiTags.suitability.push('học bài');
    }
    if (!aiTags.suitability.includes('một mình')) {
      aiTags.suitability.push('một mình');
    }
    if (!aiTags.mood.includes('thư giãn')) {
      aiTags.mood.push('thư giãn');
    }
  }

  if (category.includes('nhà hàng') || category.includes('restaurant')) {
    if (!aiTags.suitability.includes('gia đình')) {
      aiTags.suitability.push('gia đình');
    }
    if (!aiTags.suitability.includes('bạn bè')) {
      aiTags.suitability.push('bạn bè');
    }
  }

  if (category.includes('bar') || category.includes('pub')) {
    if (!aiTags.mood.includes('sôi động')) {
      aiTags.mood.push('sôi động');
    }
    if (!aiTags.suitability.includes('bạn bè')) {
      aiTags.suitability.push('bạn bè');
    }
  }

  if (category.includes('bakery') || category.includes('tiệm bánh')) {
    if (!aiTags.suitability.includes('hẹn hò')) {
      aiTags.suitability.push('hẹn hò');
    }
  }
};

/**
 * Merge AI tags (union strategy)
 * @param {Object} existingTags - Current aiTags from DB
 * @param {Object} newTags - Newly generated aiTags
 * @returns {Object} Merged aiTags (unique values)
 */
export const mergeAiTags = (existingTags, newTags) => {
  const merged = {
    space: [],
    mood: [],
    suitability: [],
    crowdLevel: [],
    music: [],
    parking: [],
    specialFeatures: []
  };

  Object.keys(merged).forEach(category => {
    const existing = existingTags?.[category] || [];
    const newValues = newTags?.[category] || [];
    merged[category] = [...new Set([...existing, ...newValues])];
  });

  return merged;
};

/**
 * Get metadata về quá trình auto-tagging (optional, dùng để debug)
 * @param {Object} googleData - Google data
 * @param {Object} aiTags - Generated aiTags
 * @returns {Object} Metadata
 */
export const getAutoTagMeta = (googleData, aiTags) => {
  return {
    generatedAt: new Date(),
    sources: [
      googleData?.additionalInfo ? 'additionalInfo' : null,
      googleData?.reviews?.length ? 'reviews' : null,
      googleData?.category ? 'category' : null
    ].filter(Boolean),
    confidence: calculateConfidence(aiTags),
    totalTags: Object.values(aiTags).flat().length
  };
};

/**
 * Calculate confidence score (simple heuristic)
 * @param {Object} aiTags - Generated aiTags
 * @returns {Object} Confidence scores per category
 */
const calculateConfidence = (aiTags) => {
  const confidence = {};
  
  Object.entries(aiTags).forEach(([category, tags]) => {
    // Simple logic: more tags = higher confidence
    if (tags.length === 0) {
      confidence[category] = 0;
    } else if (tags.length >= 3) {
      confidence[category] = 0.9;
    } else if (tags.length === 2) {
      confidence[category] = 0.7;
    } else {
      confidence[category] = 0.5;
    }
  });

  return confidence;
};

/**
 * Parse Google openingHours sang operatingHours format (24h)
 * @param {Array} googleOpeningHours - Array từ Google với format [{day: "Thứ Hai", hours: "11:00 to 15:00"}]
 * @returns {Object} operatingHours object cho 7 ngày tuần
 */
export const parseGoogleOpeningHours = (googleOpeningHours) => {
  const operatingHours = {
    monday: { open: '', close: '' },
    tuesday: { open: '', close: '' },
    wednesday: { open: '', close: '' },
    thursday: { open: '', close: '' },
    friday: { open: '', close: '' },
    saturday: { open: '', close: '' },
    sunday: { open: '', close: '' }
  };

  if (!googleOpeningHours || !Array.isArray(googleOpeningHours)) {
    return operatingHours;
  }

  // Map Vietnamese day names to English keys
  const dayMap = {
    'Thứ Hai': 'monday',
    'Thứ Ba': 'tuesday',
    'Thứ Tư': 'wednesday',
    'Thứ Năm': 'thursday',
    'Thứ Sáu': 'friday',
    'Thứ Bảy': 'saturday',
    'Chủ Nhật': 'sunday'
  };

  googleOpeningHours.forEach(dayInfo => {
    const dayKey = dayMap[dayInfo.day];
    if (!dayKey) return;

    const hoursString = dayInfo.hours;
    
    // 🚫 Ngày đóng cửa
    if (!hoursString || hoursString.toLowerCase().includes('closed') || hoursString.toLowerCase().includes('đóng cửa')) {
      operatingHours[dayKey] = { open: '', close: '' };
      return;
    }
    
    // ✅ Mở cửa cả ngày (24/7)
    if (hoursString.toLowerCase().includes('open 24 hours') || 
        hoursString.toLowerCase().includes('mở cửa cả ngày') ||
        hoursString.toLowerCase().includes('24 giờ') ||
        hoursString.toLowerCase().includes('24h')) {
      operatingHours[dayKey] = { open: '00:00', close: '23:59' };
      return;
    }

    // Parse hours: "11:00 to 15:00" hoặc "11:00 to 15:00, 17:00 to 21:30"
    const periods = parseHoursPeriods(hoursString);
    
    if (periods.length > 0) {
      // Lấy ca đầu tiên (vì UI hiện tại chỉ support 1 ca/ngày)
      operatingHours[dayKey] = {
        open: periods[0].open,
        close: periods[0].close
      };
    }
  });

  console.log('✅ Parsed Google openingHours to 24h format:', operatingHours);
  return operatingHours;
};

/**
 * Parse hours string thành array of periods
 * @param {String} hoursString - "11:00 to 15:00" hoặc "11:00 to 15:00, 17:00 to 21:30"
 * @returns {Array} [{open: "11:00", close: "15:00"}, ...]
 */
const parseHoursPeriods = (hoursString) => {
  const periods = [];
  
  // Tách theo dấu phẩy để lấy nhiều ca
  const segments = hoursString.split(',').map(s => s.trim());
  
  segments.forEach(segment => {
    // Parse "11:00 to 15:00" hoặc "11:00-15:00"
    const match = segment.match(/(\d{1,2}:\d{2})\s*(?:to|-)\s*(\d{1,2}:\d{2})/i);
    
    if (match) {
      periods.push({
        open: normalizeTime24h(match[1]),
        close: normalizeTime24h(match[2])
      });
    }
  });
  
  return periods;
};

/**
 * Normalize time to 24h format HH:mm
 * @param {String} time - "7:00" hoặc "07:00"
 * @returns {String} "07:00"
 */
const normalizeTime24h = (time) => {
  const [hours, minutes] = time.split(':');
  const h = hours.padStart(2, '0');
  const m = (minutes || '00').padStart(2, '0');
  return `${h}:${m}`;
};
