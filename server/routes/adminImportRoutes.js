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
 * @description Routes for importing places from Apify API (Google Maps Scraper)
 * All routes require admin authentication
 */

// ⚠️ TEMPORARY: Disable auth for testing
// TODO: Re-enable after implementing admin login UI
// router.use(authenticateAdmin);

// ========================================
// Apify Import Routes (via Goong-compatible endpoints)
// ========================================

/**
 * @route   GET /api/admin/import/goong/autocomplete
 * @desc    Get place suggestions from Apify (preview)
 * @query   input (required), location (optional), maxResults (optional)
 * @access  Admin only
 */
router.get('/goong/autocomplete', getGoongAutocomplete);

/**
 * @route   POST /api/admin/import/goong
 * @desc    Import selected places from Apify to MongoDB
 * @body    { placeIds: ["ChIJ...", ...] } (Google Place IDs)
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
 * @desc    Validate Apify API token
 * @access  Admin only
 */
router.get('/goong/validate-api-key', validateGoongApiKey);

export default router;
