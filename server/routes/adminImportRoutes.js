import express from 'express';
import {
    getGoongAutocomplete,
    getImportStats,
    getPlacesNeedingEnrichment,
    importFromGoong,
    markPlaceAsEnriched,
    syncGoongPlace,
    validateGoongApiKey
} from '../controllers/adminImportController.js';

const router = express.Router();

/**
 * @fileoverview Admin Import Routes
 * @description Routes for importing places from Goong API
 * All routes require admin authentication
 */

// ⚠️ TEMPORARY: Disable auth for testing
// TODO: Re-enable after implementing admin login UI
// router.use(authenticateAdmin);

// ========================================
// Goong Import Routes
// ========================================

/**
 * @route   GET /api/admin/import/goong/autocomplete
 * @desc    Get place suggestions from Goong (preview)
 * @query   input (required), location (optional), radius (optional)
 * @access  Admin only
 */
router.get('/goong/autocomplete', getGoongAutocomplete);

/**
 * @route   POST /api/admin/import/goong
 * @desc    Import selected places from Goong to MongoDB
 * @body    { placeIds: ["goong_abc123", ...] }
 * @access  Admin only
 */
router.post('/goong', importFromGoong);

/**
 * @route   GET /api/admin/import/stats
 * @desc    Get import statistics
 * @access  Admin only
 */
router.get('/stats', getImportStats);

/**
 * @route   POST /api/admin/import/goong/:placeId/sync
 * @desc    Re-sync existing Goong place (refresh data)
 * @params  placeId (MongoDB _id)
 * @access  Admin only
 */
router.post('/goong/:placeId/sync', syncGoongPlace);

/**
 * @route   GET /api/admin/import/goong/needs-enrichment
 * @desc    Get places that need AI enrichment
 * @query   limit (optional, default 50)
 * @access  Admin only
 */
router.get('/goong/needs-enrichment', getPlacesNeedingEnrichment);

/**
 * @route   POST /api/admin/import/goong/:placeId/mark-enriched
 * @desc    Mark place as AI enriched
 * @params  placeId (MongoDB _id)
 * @access  Admin only
 */
router.post('/goong/:placeId/mark-enriched', markPlaceAsEnriched);

/**
 * @route   GET /api/admin/import/goong/validate-api-key
 * @desc    Validate Goong API key configuration
 * @access  Admin only
 */
router.get('/goong/validate-api-key', validateGoongApiKey);

export default router;
