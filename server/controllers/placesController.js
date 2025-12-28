import Place from '../models/Place.js';

// Get all places for admin with search, filter, sort, pagination
export const getAllPlaces = async (req, res) => {
  try {
    const {
      // Search
      q,
      
      // Filters
      district,
      category,
      status,
      minPrice,
      maxPrice,
      mood,
      space,
      suitability,
      
      // Sort
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      
      // Pagination
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Text search
    if (q) {
      filter.$text = { $search: q };
    }
    
    // District filter
    if (district) {
      filter.district = district;
    }
    
    // Category filter
    if (category) {
      filter.category = category;
    }
    
    // Status filter
    if (status) {
      filter.status = status;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter['priceRange.min'] = {};
      filter['priceRange.max'] = {};
      
      if (minPrice) {
        filter['priceRange.min'].$gte = parseInt(minPrice);
      }
      if (maxPrice) {
        filter['priceRange.max'].$lte = parseInt(maxPrice);
      }
    }
    
    // AI Tags filters
    if (mood) {
      filter['aiTags.mood'] = { $in: mood.split(',') };
    }
    if (space) {
      filter['aiTags.space'] = { $in: space.split(',') };
    }
    if (suitability) {
      filter['aiTags.suitability'] = { $in: suitability.split(',') };
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const [places, total] = await Promise.all([
      Place.find(filter)
        .populate('createdBy', 'displayName username')
        .populate('updatedBy', 'displayName username')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Place.countDocuments(filter)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;
    
    res.json({
      success: true,
      data: {
        places,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (error) {
    console.error('Get places error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy danh sách địa điểm' 
    });
  }
};

// Get place by ID
export const getPlaceById = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id)
      .populate('createdBy', 'displayName username email')
      .populate('updatedBy', 'displayName username email');
    
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa điểm'
      });
    }
    
    res.json({
      success: true,
      data: place
    });
  } catch (error) {
    console.error('Get place error:', error);
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
    
    // Chuẩn hóa dữ liệu để match với schema
    const placeData = {
      name: req.body.name,
      address: req.body.address,
      district: req.body.district,
      category: req.body.category,
      description: req.body.description,
      priceRange: req.body.priceRange,
      images: req.body.images || [],
      menu: req.body.menu || [],
      aiTags: req.body.aiTags || {},
      coordinates: req.body.coordinates,
      operatingHours: req.body.operatingHours,
      // Map phone/website từ top-level về contact object
      contact: {
        phone: req.body.phone || req.body.contact?.phone || '',
        website: req.body.website || req.body.contact?.website || ''
      },
      // Normalize status - schema dùng 'Published' chứ không phải 'published'
      status: req.body.status === 'published' ? 'Published' : 
              req.body.status === 'draft' ? 'Draft' :
              req.body.status === 'archived' ? 'Archived' :
              req.body.status || 'Draft',
      isActive: req.body.isActive !== false,
      featured: req.body.featured || false,
      // Tạm thời không cần user (admin tạo không cần auth)
      // createdBy: req.user?.id,
      // updatedBy: req.user?.id
    };
    
    console.log('💾 Processed place data:', JSON.stringify(placeData, null, 2));
    
    const place = new Place(placeData);
    await place.save();
    
    // Populate nếu có user
    if (req.user) {
      await place.populate('createdBy', 'displayName username');
      await place.populate('updatedBy', 'displayName username');
    }
    
    console.log('✅ Place created successfully:', place._id);
    
    res.status(201).json({
      success: true,
      data: place,
      message: 'Tạo địa điểm thành công'
    });
  } catch (error) {
    console.error('❌ Create place error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    if (error.name === 'ValidationError') {
      console.error('❌ Validation errors:', error.errors);
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors,
        details: error.errors // Thêm chi tiết để debug
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không đúng định dạng',
        details: error.message
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
    
    // Chuẩn hóa dữ liệu giống createPlace
    const updateData = {
      name: req.body.name,
      address: req.body.address,
      district: req.body.district,
      category: req.body.category,
      description: req.body.description,
      priceRange: req.body.priceRange,
      images: req.body.images,
      menu: req.body.menu,
      aiTags: req.body.aiTags,
      coordinates: req.body.coordinates,
      operatingHours: req.body.operatingHours,
      // Map phone/website từ top-level về contact object
      contact: {
        phone: req.body.phone || req.body.contact?.phone || '',
        website: req.body.website || req.body.contact?.website || ''
      },
      // Normalize status
      status: req.body.status === 'published' ? 'Published' : 
              req.body.status === 'draft' ? 'Draft' :
              req.body.status === 'archived' ? 'Archived' :
              req.body.status || 'Draft',
      isActive: req.body.isActive,
      featured: req.body.featured,
      // updatedBy: req.user?.id
    };
    
    const place = await Place.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
      
    // Populate nếu có user
    if (req.user) {
      await place.populate('createdBy', 'displayName username');
      await place.populate('updatedBy', 'displayName username');
    }
    
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa điểm'
      });
    }
    
    console.log('✅ Place updated successfully:', place._id);
    
    res.json({
      success: true,
      data: place,
      message: 'Cập nhật địa điểm thành công'
    });
  } catch (error) {
    console.error('❌ Update place error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors,
        details: error.errors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không đúng định dạng',
        details: error.message
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
    const place = await Place.findByIdAndDelete(req.params.id);
    
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa điểm'
      });
    }
    
    res.json({
      success: true,
      message: 'Xóa địa điểm thành công'
    });
  } catch (error) {
    console.error('Delete place error:', error);
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
    
    const updateData = {
      aiTags: {
        space: space || [],
        mood: mood || [],
        suitability: suitability || [],
        crowdLevel: crowdLevel || [],
        music: music || [],
        parking: parking || [],
        specialFeatures: specialFeatures || []
      },
      updatedBy: req.user.id
    };
    
    const place = await Place.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa điểm'
      });
    }
    
    res.json({
      success: true,
      data: place.aiTags,
      message: 'Cập nhật AI Tags thành công'
    });
  } catch (error) {
    console.error('Update AI tags error:', error);
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