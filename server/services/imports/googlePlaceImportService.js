import Place from '../../models/Place.js';
import { mapGooglePlaceToPlace, validatePlaceData } from '../../utils/googlePlaceMapper.js';

/**
 * @fileoverview Google Places Import Service
 * @description Business logic for importing places from Google Places dataset
 */

class GooglePlaceImportService {
  /**
   * @desc Import multiple places from Google dataset
   * @param {Array<Object>} googlePlaces - Array of Google place objects
   * @param {Object} options - { createdBy, skipExisting }
   * @returns {Promise<Object>} { imported, updated, skipped, errors, places }
   */
  async importFromGoogle(googlePlaces, options = {}) {
    const { createdBy = null, skipExisting = true } = options;

    const stats = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    const importedPlaces = [];

    // Process each place
    for (const googleData of googlePlaces) {
      try {
        const result = await this._importSinglePlace(googleData, {
          createdBy,
          skipExisting
        });

        if (result.status === 'imported') {
          stats.imported++;
          importedPlaces.push(result.place);
        } else if (result.status === 'updated') {
          stats.updated++;
          importedPlaces.push(result.place);
        } else if (result.status === 'skipped') {
          stats.skipped++;
        }

      } catch (error) {
        stats.errors.push({
          place: googleData.title || 'Unknown',
          message: error.message
        });
      }
    }

    return {
      ...stats,
      total: googlePlaces.length,
      success: stats.imported + stats.updated,
      places: importedPlaces
    };
  }

  /**
   * @desc Import a single place
   * @param {Object} googleData - Google place data
   * @param {Object} options - { createdBy, skipExisting }
   * @returns {Promise<Object>} { status, place }
   * @private
   */
  async _importSinglePlace(googleData, options = {}) {
    const { createdBy, skipExisting } = options;

    // Map to Place schema
    const placeData = mapGooglePlaceToPlace(googleData, { createdBy });

    // Validate
    const validation = validatePlaceData(placeData);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if exists
    if (skipExisting && googleData.placeId) {
      const existingPlace = await Place.findOne({
        source: 'google',
        googlePlaceId: googleData.placeId
      });

      if (existingPlace) {
        return { status: 'skipped', place: existingPlace };
      }
    }

    // Upsert
    const place = await Place.findOneAndUpdate(
      { source: 'google', googlePlaceId: googleData.placeId },
      placeData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { 
      status: place.createdAt.getTime() === place.updatedAt.getTime() ? 'imported' : 'updated',
      place 
    };
  }

  /**
   * @desc Get import statistics
   * @returns {Promise<Object>} Stats
   */
  async getImportStats() {
    const total = await Place.countDocuments();
    const fromGoogle = await Place.countDocuments({ source: 'google' });
    const fromGoong = await Place.countDocuments({ source: 'goong' });
    const manual = await Place.countDocuments({ source: 'manual' });
    const needsEnrich = await Place.countDocuments({ needsEnrich: true });

    return {
      total,
      fromGoogle,
      fromGoong,
      manual,
      needsEnrich,
      enriched: total - needsEnrich
    };
  }

  /**
   * @desc Get places from Google source
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Places
   */
  async getGooglePlaces(filters = {}) {
    const query = { source: 'google', ...filters };
    return await Place.find(query)
      .select('name address district category averageRating totalReviews')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }
}

export default new GooglePlaceImportService();
