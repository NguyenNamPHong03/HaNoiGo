import Place from '../models/Place.js';
import { generateAiTagsFromGoogle, mergeAiTags, parseGoogleOpeningHours } from '../services/autoTaggerService.js';
import * as placeService from '../services/placeService.js';
import { extractOpeningHours, generateAITags } from '../utils/placeMapper.js';

// Get all places for admin with search, filter, sort, pagination
export const getAllPlaces = async (req, res) => {
  try {
    // Call service layer
    const result = await placeService.getAllPlaces(req.query);

    res.json({
      success: true,
      data: {
        places: result.places,
        pagination: result.pagination
      }
    });
  } catch (error) {
    console.error('Get places error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi khi lấy danh sách địa điểm' 
    });
  }
};

// Get place by ID
export const getPlaceById = async (req, res) => {
  try {
    // Call service layer
    const place = await placeService.getPlaceById(req.params.id);
    
    res.json({
      success: true,
      data: place
    });
  } catch (error) {
    console.error('Get place error:', error);
    
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin địa điểm'
    });
  }
};

// Get Google/Apify raw data for place (for Admin review)
export const getPlaceGoogleData = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id)
      .select('apify googleReviews googleData openingHours reviewsDistribution aiTags averageRating');
    
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa điểm'
      });
    }

    res.json({
      success: true,
      data: {
        // Raw Apify data (full response)
        apifyRaw: place.apify?.raw || null,
        
        // Parsed reviews
        googleReviews: place.googleReviews || [],
        
        // Opening hours
        openingHours: place.openingHours || [],
        
        // Reviews distribution
        reviewsDistribution: place.reviewsDistribution || {},
        
        // AI Tags suggestions
        aiTags: place.aiTags || {},
        
        // Google metadata
        googleData: place.googleData || {},
        
        // Ratings
        averageRating: place.averageRating || 0,
        totalReviews: place.apify?.reviewsCount || 0
      }
    });
  } catch (error) {
    console.error('Get Google data error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu Google'
    });
  }
};

// Create new place
export const createPlace = async (req, res) => {
  try {
    console.log('📝 Creating place with data:', JSON.stringify(req.body, null, 2));
    
    // Call service layer
    const place = await placeService.createPlace(req.body, req.user?.id);
    
    console.log('✅ Place created successfully:', place._id);
    
    res.status(201).json({
      success: true,
      data: place,
      message: 'Tạo địa điểm thành công'
    });
  } catch (error) {
    console.error('❌ Create place error:', error);
    console.error('❌ Error message:', error.message);
    
    if (error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors,
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo địa điểm',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update place
export const updatePlace = async (req, res) => {
  try {
    console.log('📝 Updating place with data:', JSON.stringify(req.body, null, 2));
    
    // Call service layer
    const place = await placeService.updatePlace(req.params.id, req.body, req.user?.id);
    
    console.log('✅ Place updated successfully:', place._id);
    
    res.json({
      success: true,
      data: place,
      message: 'Cập nhật địa điểm thành công'
    });
  } catch (error) {
    console.error('❌ Update place error:', error);
    
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors,
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật địa điểm',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete place
export const deletePlace = async (req, res) => {
  try {
    // Call service layer
    const result = await placeService.deletePlace(req.params.id);
    
    res.json({
      success: true,
      message: 'Xóa địa điểm thành công',
      data: result
    });
  } catch (error) {
    console.error('Delete place error:', error);
    
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa địa điểm'
    });
  }
};

// Bulk operations
export const bulkUpdatePlaces = async (req, res) => {
  try {
    const { placeIds, operation, updateData } = req.body;
    
    if (!placeIds || !Array.isArray(placeIds) || placeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách ID địa điểm không hợp lệ'
      });
    }
    
    let result;
    
    switch (operation) {
      case 'updateStatus':
        if (!updateData || !updateData.status) {
          return res.status(400).json({
            success: false,
            message: 'Trạng thái không hợp lệ'
          });
        }
        
        const statusUpdate = { status: updateData.status };
        if (req.user && req.user._id) {
          statusUpdate.updatedBy = req.user._id;
        }
        
        result = await Place.updateMany(
          { _id: { $in: placeIds } },
          statusUpdate
        );
        break;
        
      case 'delete':
        result = await Place.deleteMany({ _id: { $in: placeIds } });
        break;
        
      case 'toggleActive':
        // Get current status first
        const places = await Place.find({ _id: { $in: placeIds } });
        
        // Update each place with opposite isActive status
        const updates = places.map(place => {
          const updateFields = { isActive: !place.isActive };
          if (req.user && req.user._id) {
            updateFields.updatedBy = req.user._id;
          }
          
          return {
            updateOne: {
              filter: { _id: place._id },
              update: updateFields
            }
          };
        });
        
        result = await Place.bulkWrite(updates);
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Thao tác không hợp lệ'
        });
    }
    
    res.json({
      success: true,
      data: result,
      message: `Cập nhật ${result.modifiedCount || result.deletedCount} địa điểm thành công`
    });
  } catch (error) {
    console.error('Bulk update places error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật hàng loạt',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update AI tags quickly
export const updateAiTags = async (req, res) => {
  try {
    const { space, mood, suitability, crowdLevel, music, parking, specialFeatures } = req.body;
    
    const aiTags = {
      space: space || [],
      mood: mood || [],
      suitability: suitability || [],
      crowdLevel: crowdLevel || [],
      music: music || [],
      parking: parking || [],
      specialFeatures: specialFeatures || []
    };
    
    // Call service layer
    const updatedPlace = await placeService.updateAITags(req.params.id, aiTags);
    
    res.json({
      success: true,
      data: updatedPlace.aiTags,
      message: 'Cập nhật AI Tags thành công'
    });
  } catch (error) {
    console.error('Update AI tags error:', error);
    
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật AI Tags'
    });
  }
};

// Get place statistics
export const getPlaceStats = async (req, res) => {
  try {
    const [
      totalPlaces,
      publishedPlaces,
      draftPlaces,
      archivedPlaces,
      avgRating
    ] = await Promise.all([
      Place.countDocuments(),
      Place.countDocuments({ status: 'Published' }),
      Place.countDocuments({ status: 'Draft' }),
      Place.countDocuments({ status: 'Archived' }),
      Place.aggregate([
        { $match: { totalReviews: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$averageRating' } } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalPlaces,
        published: publishedPlaces,
        draft: draftPlaces,
        archived: archivedPlaces,
        avgRating: avgRating[0]?.avgRating || 0
      }
    });
  } catch (error) {
    console.error('Get place stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê'
    });
  }
};

// Get latest places for homepage (public endpoint)
export const getLatestPlaces = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const places = await Place.find({ 
      status: 'Published',
      isActive: true 
    })
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo mới nhất
      .limit(limit)
      .select('name description images priceRange category district')
      .lean();
    
    res.json({
      success: true,
      data: places
    });
  } catch (error) {
    console.error('Get latest places error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy địa điểm mới nhất'
    });
  }
};

// Get districts list (for dropdown)
export const getDistricts = (req, res) => {
  const districts = [
    'Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy', 
    'Đống Đa', 'Thanh Xuân', 'Nam Từ Liêm', 'Bắc Từ Liêm', 
    'Hà Đông', 'Hoàng Mai', 'Hai Bà Trưng'
  ];
  
  res.json({
    success: true,
    data: districts
  });
};

// Get AI tags options (for form dropdowns)
export const getAiTagsOptions = (req, res) => {
  const aiTagsOptions = {
    space: ['ấm cúng', 'rộng rãi', 'riêng tư', 'thoáng đãng', 'yên tĩnh', 'sôi động', 'hiện đại', 'cổ điển', 'ngoài trời', 'rooftop', 'vintage'],
    mood: ['chill', 'lãng mạn', 'sôi động', 'thư giãn', 'năng động', 'chuyên nghiệp', 'vui vẻ', 'yên bình', 'phiêu lưu', 'ấm cúng'],
    suitability: ['hẹn hò', 'gia đình', 'bạn bè', 'công việc', 'một mình', 'nhóm lớn', 'học bài', 'tụ tập', 'họp mặt', 'sinh nhật', 'thư giãn'],
    crowdLevel: ['ít người', 'vừa phải', 'đông đúc', 'rất đông'],
    music: ['nhạc nhẹ', 'nhạc sôi động', 'không có nhạc', 'karaoke', 'live music'],
    parking: ['có chỗ đậu xe', 'khó đậu xe', 'gửi xe miễn phí', 'gửi xe có phí'],
    specialFeatures: ['wifi miễn phí', 'điều hòa', 'view đẹp', 'phục vụ 24h', 'delivery', 'pet friendly', 'có khu vui chơi trẻ em']
  };
  
  res.json({
    success: true,
    data: aiTagsOptions
  });
};

/**
 * Refresh Google data & auto-generate AI tags
 * POST /api/admin/places/:id/refresh-google
 */
export const refreshGoogleData = async (req, res) => {
  try {
    const placeId = req.params.id;
    
    // Lấy place hiện tại
    const place = await Place.findById(placeId);
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa điểm'
      });
    }

    // Kiểm tra xem place có phải từ Google/Apify không
    if (!['google', 'apify'].includes(place.source)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể refresh AI tags cho địa điểm từ Google/Apify import'
      });
    }

    console.log(`🔄 Refreshing AI tags for place: ${place.name} (source: ${place.source})`);

    let aiTagsNew, operatingHoursParsed;

    // 🔁 Xử lý theo source
    if (place.source === 'apify') {
      // Lấy raw data từ Apify (có fallback cho places import từ version cũ)
      let apifyRawData = place.apify?.raw;
      
      // 🔄 Fallback: Nếu không có apify.raw, reconstruct từ additionalInfo (giống Google)
      if (!apifyRawData && place.additionalInfo) {
        console.log(`⚠️ No apify.raw found, reconstructing from additionalInfo for: ${place.name}`);
        apifyRawData = {
          title: place.name,
          address: place.address,
          totalScore: place.averageRating,
          reviewsCount: place.totalReviews,
          categoryName: place.category,
          price: place.priceDisplay,
          openingHours: place.openingHours || [],
          additionalInfo: place.additionalInfo,
          reviews: place.additionalInfo?.reviews || [],
          location: {
            lat: place.location?.coordinates[1],
            lng: place.location?.coordinates[0]
          }
        };
      }
      
      if (!apifyRawData) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy dữ liệu để refresh. Vui lòng re-import place này từ Apify.',
        });
      }

      // Import generateAITags và extractOpeningHours từ placeMapper
      const { generateAITags, extractOpeningHours } = await import('../utils/placeMapper.js');
      
      // Re-generate AI tags từ Apify raw data
      aiTagsNew = generateAITags(apifyRawData, place.category);
      
      // Re-parse opening hours
      const openingHoursUpdated = extractOpeningHours(apifyRawData);
      if (openingHoursUpdated && openingHoursUpdated.length > 0) {
        place.openingHours = openingHoursUpdated;
        console.log(`🕒 Updated opening hours from Apify data`);
      }
      
      // Parse sang 24h format nếu có
      if (place.openingHours && Array.isArray(place.openingHours)) {
        operatingHoursParsed = parseGoogleOpeningHours(place.openingHours);
        place.operatingHours = operatingHoursParsed;
      }
      
    } else {
      // Source = 'google' - logic cũ
      const googleData = {
        additionalInfo: place.additionalInfo,
        reviews: place.additionalInfo?.reviews || [],
        category: place.category
      };

      // Auto-generate AI tags mới
      aiTagsNew = generateAiTagsFromGoogle(googleData);

      // 🕒 Auto-parse operating hours từ Google (24h format)
      if (place.openingHours && Array.isArray(place.openingHours)) {
        console.log('🕒 Parsing Google openingHours to 24h format...');
        operatingHoursParsed = parseGoogleOpeningHours(place.openingHours);
        place.operatingHours = operatingHoursParsed;
      }
    }

    // Merge với AI tags hiện tại
    const aiTagsFinal = mergeAiTags(place.aiTags, aiTagsNew);

    // Update place
    place.aiTags = aiTagsFinal;
    await place.save();

    console.log(`✅ AI tags refreshed for: ${place.name}`);

    res.json({
      success: true,
      data: {
        place: place,
        aiTagsNew: aiTagsNew,
        aiTagsFinal: aiTagsFinal,
        operatingHours: operatingHoursParsed // ✅ Trả về operating hours đã parse
      },
      message: `Đã cập nhật AI tags và giờ mở cửa tự động từ ${place.source === 'apify' ? 'Apify' : 'Google'} data`
    });
  } catch (error) {
    console.error('Refresh Google data error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi refresh AI tags',
      error: error.message
    });
  }
};

/**
 * Bulk refresh Google data cho nhiều places
 * POST /api/admin/places/bulk-refresh-google
 */
export const bulkRefreshGoogleData = async (req, res) => {
  try {
    const { placeIds } = req.body;

    if (!placeIds || !Array.isArray(placeIds) || placeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách placeIds không hợp lệ'
      });
    }

    console.log(`🔄 Bulk refreshing ${placeIds.length} places...`);

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const placeId of placeIds) {
      try {
        const place = await Place.findById(placeId);
        
        if (!place) {
          results.failed.push({ placeId, reason: 'Không tìm thấy địa điểm' });
          continue;
        }

        // Skip nếu không phải từ Google hoặc Apify
        if (place.source !== 'google' && place.source !== 'apify') {
          results.skipped.push({ placeId, name: place.name, reason: 'Không phải từ Google/Apify' });
          continue;
        }

        let aiTagsNew = {};
        
        // 🔄 Refresh từ Apify raw data (có fallback)
        if (place.source === 'apify') {
          let apifyRawData = place.apify?.raw;
          
          // 🔄 Fallback: Reconstruct từ additionalInfo (cho places import version cũ)
          if (!apifyRawData && place.additionalInfo) {
            console.log(`⚠️ No apify.raw, reconstructing for: ${place.name}`);
            apifyRawData = {
              title: place.name,
              address: place.address,
              totalScore: place.averageRating,
              reviewsCount: place.totalReviews,
              categoryName: place.category,
              price: place.priceDisplay,
              openingHours: place.openingHours || [],
              additionalInfo: place.additionalInfo,
              reviews: place.additionalInfo?.reviews || [],
              location: {
                lat: place.location?.coordinates[1],
                lng: place.location?.coordinates[0]
              }
            };
          }
          
          if (!apifyRawData) {
            results.skipped.push({ placeId, name: place.name, reason: 'Không có dữ liệu để refresh' });
            continue;
          }
          
          console.log(`🤖 Refreshing from Apify data: ${place.name}`);
          aiTagsNew = generateAITags(apifyRawData, place.category);
          
          // Extract opening hours từ Apify
          const openingHoursNew = extractOpeningHours(apifyRawData);
          if (openingHoursNew && openingHoursNew.length > 0) {
            place.openingHours = openingHoursNew;
            
            // Parse sang 24h format
            if (Array.isArray(openingHoursNew)) {
              place.operatingHours = parseGoogleOpeningHours(openingHoursNew);
            }
          }
        } 
        // 🔄 Refresh từ Google data
        else if (place.source === 'google') {
          console.log(`🌐 Refreshing from Google data: ${place.name}`);
          const googleData = {
            additionalInfo: place.additionalInfo,
            reviews: place.additionalInfo?.reviews || [],
            category: place.category
          };

          aiTagsNew = generateAiTagsFromGoogle(googleData);

          // Parse operating hours từ Google
          if (place.openingHours && Array.isArray(place.openingHours)) {
            const operatingHoursParsed = parseGoogleOpeningHours(place.openingHours);
            place.operatingHours = operatingHoursParsed;
          }
        }

        const aiTagsFinal = mergeAiTags(place.aiTags, aiTagsNew);

        place.aiTags = aiTagsFinal;
        await place.save();

        results.success.push({ placeId, name: place.name });
        console.log(`✅ Refreshed: ${place.name}`);
      } catch (error) {
        results.failed.push({ placeId, reason: error.message });
        console.error(`❌ Failed to refresh ${placeId}:`, error);
      }
    }

    console.log(`✅ Bulk refresh completed: ${results.success.length} success, ${results.failed.length} failed, ${results.skipped.length} skipped`);

    res.json({
      success: true,
      data: results,
      message: `Đã refresh ${results.success.length}/${placeIds.length} địa điểm từ Google`
    });
  } catch (error) {
    console.error('Bulk refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi bulk refresh',
      error: error.message
    });
  }
};