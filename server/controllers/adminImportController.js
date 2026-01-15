import placeImportService from '../services/imports/placeImportService.js';
import apifyProvider from '../services/providers/goongProvider.js'; // Still using same file (now ApifyProvider)
import { mapApifyItemToPreview } from '../utils/placeMapper.js';

/**
 * @fileoverview Admin Import Controller
 * @description Handle admin requests for importing places from Apify API
 * Endpoints: autocomplete preview & batch import
 */

/**
 * @route   GET /api/admin/import/goong/autocomplete
 * @desc    Get place suggestions from Apify (preview before import)
 * @access  Admin only
 */
export const getGoongAutocomplete = async (req, res) => {
  try {
    const { input, location, maxResults } = req.query;
    console.log('[APIFY AUTOCOMPLETE REQUEST]', { input, location, maxResults });

    // Validation
    if (!input || input.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập từ khóa tìm kiếm'
      });
    }

    // Apify Actor cần location text (VD: "Hanoi, Vietnam"), không dùng lat/lng
    // Luôn dùng APIFY_DEFAULT_LOCATION, ignore location từ frontend
    const locationQuery = process.env.APIFY_DEFAULT_LOCATION || 'Hanoi, Vietnam';

    // Call Apify API (runs actor and gets dataset items)
    const items = await apifyProvider.autocomplete({
      input: input.trim(),
      location: locationQuery,
      maxResults: maxResults ? parseInt(maxResults) : parseInt(process.env.APIFY_MAX_RESULTS || '20')
    });

    // Map to preview format (compatible with frontend)
    const previewItems = items.map(mapApifyItemToPreview);

    res.status(200).json({
      success: true,
      count: previewItems.length,
      items: previewItems,
      rawItems: items // ✅ Trả về full raw items để frontend cache và import
    });

  } catch (error) {
    console.error('❌ AUTOCOMPLETE ERROR DETAILS:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Không thể lấy gợi ý từ Apify',
      detail: error.response?.data || error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @route   POST /api/admin/import/goong
 * @desc    Import selected places from Goong to MongoDB
 * @access  Admin only
 * @body    { placeIds: ["goong_abc123", "goong_def456"] }
 */
export const importFromGoong = async (req, res) => {
  try {
    const { placeIds, items } = req.body; // items = full objects từ autocomplete
    const adminId = req.user?._id; // From auth middleware

    // Validation
    if (!placeIds || !Array.isArray(placeIds) || placeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất 1 địa điểm để import'
      });
    }

    if (placeIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể import tối đa 50 địa điểm cùng lúc'
      });
    }

    // ✅ Ưu tiên import từ full items (nếu frontend gửi)
    const importData = items || placeIds;

    // Import từ Apify
    const result = await placeImportService.importFromGoong(importData, {
      createdBy: adminId,
      batchSize: 5
    });

    // Response with statistics
    res.status(200).json({
      success: true,
      message: `Đã xử lý ${result.total} địa điểm`,
      data: {
        total: result.total,
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        success: result.success,
        errors: result.errors,
        places: result.places.map(p => ({
          _id: p._id,
          name: p.name,
          address: p.address,
          district: p.district,
          category: p.category
        }))
      }
    });

  } catch (error) {
    console.error('❌ Import error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Không thể import địa điểm',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @route   GET /api/admin/import/stats
 * @desc    Get import statistics
 * @access  Admin only
 */
export const getImportStats = async (req, res) => {
  try {
    const stats = await placeImportService.getImportStats();

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Stats error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Không thể lấy thống kê',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @route   POST /api/admin/import/goong/:placeId/sync
 * @desc    Re-sync existing Goong place (refresh data)
 * @access  Admin only
 */
export const syncGoongPlace = async (req, res) => {
  try {
    const { placeId } = req.params;

    const updatedPlace = await placeImportService.syncGoongPlace(placeId);

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật dữ liệu từ Goong',
      data: updatedPlace
    });

  } catch (error) {
    console.error('❌ Sync error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Không thể đồng bộ dữ liệu',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @route   GET /api/admin/import/goong/needs-enrichment
 * @desc    Get places that need AI enrichment
 * @access  Admin only
 */
export const getPlacesNeedingEnrichment = async (req, res) => {
  try {
    const { limit } = req.query;

    const places = await placeImportService.getPlacesNeedingEnrichment(
      limit ? parseInt(limit) : 50
    );

    res.status(200).json({
      success: true,
      count: places.length,
      data: places
    });

  } catch (error) {
    console.error('❌ Enrichment query error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Không thể lấy danh sách',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @route   POST /api/admin/import/goong/:placeId/mark-enriched
 * @desc    Mark place as AI enriched
 * @access  Admin only
 */
export const markPlaceAsEnriched = async (req, res) => {
  try {
    const { placeId } = req.params;

    const updatedPlace = await placeImportService.markAsEnriched(placeId);

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu là đã enrichment',
      data: updatedPlace
    });

  } catch (error) {
    console.error('❌ Mark enriched error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Không thể cập nhật',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @route   GET /api/admin/import/goong/validate-api-key
 * @desc    Validate Apify API token
 * @access  Admin only
 */
export const validateGoongApiKey = async (req, res) => {
  try {
    const isValid = await apifyProvider.validateApiKey();

    res.status(200).json({
      success: true,
      valid: isValid,
      message: isValid ? 'Apify API token hợp lệ' : 'Apify API token không hợp lệ'
    });

  } catch (error) {
    console.error('❌ API key validation error:', error);

    res.status(500).json({
      success: false,
      valid: false,
      message: 'Không thể kiểm tra API token'
    });
  }
};
