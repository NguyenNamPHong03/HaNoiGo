import * as placeService from '../services/placeService.js';

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
        if (!updateData.status) {
          return res.status(400).json({
            success: false,
            message: 'Trạng thái không hợp lệ'
          });
        }
        
        result = await Place.updateMany(
          { _id: { $in: placeIds } },
          { 
            status: updateData.status,
            updatedBy: req.user.id
          }
        );
        break;
        
      case 'delete':
        result = await Place.deleteMany({ _id: { $in: placeIds } });
        break;
        
      case 'toggleActive':
        // Get current status first
        const places = await Place.find({ _id: { $in: placeIds } });
        
        // Update each place with opposite isActive status
        const updates = places.map(place => ({
          updateOne: {
            filter: { _id: place._id },
            update: { 
              isActive: !place.isActive,
              updatedBy: req.user.id
            }
          }
        }));
        
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
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật hàng loạt'
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