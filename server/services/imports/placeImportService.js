import Place from '../../models/Place.js';
import { mapApifyItemToPlace, validatePlaceData } from '../../utils/placeMapper.js';
import apifyProvider from '../providers/goongProvider.js'; // Still using same file (now renamed internally to ApifyProvider)

/**
 * @fileoverview Place Import Service
 * @description Business logic for importing places from Apify API to MongoDB
 * Handles upsert, duplicate detection, and statistics reporting
 */

class PlaceImportService {
  /**
   * @desc Import multiple places from Apify API
   * @param {Array<String>} placeIds - Array of Apify place URLs/IDs
   * @param {Object} options - { createdBy, batchSize }
   * @returns {Promise<Object>} { imported, updated, skipped, errors, places }
   */
  async importFromGoong(placeIds, options = {}) {
    const { createdBy = null, batchSize = 5 } = options;

    const stats = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    const importedPlaces = [];

    // Process in batches to avoid overwhelming API
    for (let i = 0; i < placeIds.length; i += batchSize) {
      const batch = placeIds.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(placeId => this._importSinglePlace(placeId, createdBy))
      );

      // Aggregate results
      batchResults.forEach((result, index) => {
        const placeId = batch[index];

        if (result.status === 'fulfilled') {
          const { status, place } = result.value;
          
          if (status === 'imported') {
            stats.imported++;
            importedPlaces.push(place);
          } else if (status === 'updated') {
            stats.updated++;
            importedPlaces.push(place);
          } else if (status === 'skipped') {
            stats.skipped++;
          }
        } else {
          stats.errors.push({
            placeId,
            message: result.reason?.message || 'Unknown error'
          });
        }
      });
    }

    return {
      ...stats,
      total: placeIds.length,
      success: stats.imported + stats.updated,
      places: importedPlaces
    };
  }

  /**
   * @desc Import a single place (internal method)
   * @param {String|Object} placeId - Apify place URL/ID hoặc full item object
   * @param {String} createdBy - User ID
   * @returns {Promise<Object>} { status, place }
   * @private
   */
  async _importSinglePlace(placeId, createdBy) {
    // 1. Fetch from Apify API (placeId có thể là string hoặc full object)
    let apifyData;
    let actualPlaceId;
    
    if (typeof placeId === 'object') {
      // ✅ Already have full data from autocomplete (BEST CASE)
      apifyData = placeId;
      actualPlaceId = apifyData.placeId || apifyData.url || apifyData.cid;
      console.log(`📦 Using full object for: ${apifyData.title || actualPlaceId}`);
    } else {
      // ⚠️ Only have ID string - need to lookup cache or fetch
      actualPlaceId = placeId;
      console.log(`🔍 Looking up cache for: ${actualPlaceId}`);
      apifyData = await apifyProvider.detail(actualPlaceId);
    }

    // 2. Map to Place schema
    const placeData = mapApifyItemToPlace(apifyData, { createdBy });

    // 3. Validate
    const validation = validatePlaceData(placeData);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // 4. Check if exists (by source + apifyPlaceId)
    const existingPlace = await Place.findOne({
      source: 'apify',
      apifyPlaceId: actualPlaceId
    });

    if (existingPlace) {
      // Update existing place
      const updatedPlace = await this._updateExistingPlace(existingPlace, placeData);
      return { status: 'updated', place: updatedPlace };
    } else {
      // Create new place
      const newPlace = await Place.create(placeData);
      return { status: 'imported', place: newPlace };
    }
  }

  /**
   * @desc Update existing place with new Apify data
   * @param {Object} existingPlace - Mongoose document
   * @param {Object} newData - New place data from Apify
   * @returns {Promise<Object>} Updated place
   * @private
   */
  async _updateExistingPlace(existingPlace, newData) {
    // ✅ Smart update: only update specific fields, preserve manual edits
    existingPlace.address = newData.address;
    existingPlace.location = newData.location;
    existingPlace.coordinates = newData.coordinates;
    
    // Update Apify metadata
    existingPlace.apify.lastSyncedAt = new Date();
    existingPlace.apify.rating = newData.apify?.rating || newData.averageRating;
    existingPlace.apify.reviewsCount = newData.apify?.reviewsCount || 0;
    existingPlace.apify.raw = newData.apify?.raw;

    // Update contact info if changed
    if (newData.contact.phone) {
      existingPlace.contact.phone = newData.contact.phone;
      existingPlace.contact.phoneUnformatted = newData.contact.phoneUnformatted;
    }
    if (newData.contact.website) {
      existingPlace.contact.website = newData.contact.website;
    }

    // Update images if available
    if (newData.images && newData.images.length > 0) {
      existingPlace.images = newData.images;
    }

    // Update opening hours if available
    if (newData.openingHours && newData.openingHours.length > 0) {
      existingPlace.openingHours = newData.openingHours;
    }

    await existingPlace.save();
    return existingPlace;
  }

  /**
   * @desc Get places that need AI enrichment
   * @param {Number} limit - Max number of places to return
   * @returns {Promise<Array>} Places with needsEnrich=true
   */
  async getPlacesNeedingEnrichment(limit = 50) {
    return await Place.find({
      needsEnrich: true,
      isActive: true
    })
    .limit(limit)
    .select('_id name address district category description')
    .lean();
  }

  /**
   * @desc Mark place as enriched
   * @param {String} placeId - Place ID
   * @returns {Promise<Object>} Updated place
   */
  async markAsEnriched(placeId) {
    return await Place.findByIdAndUpdate(
      placeId,
      { needsEnrich: false },
      { new: true }
    );
  }

  /**
   * @desc Get import statistics
   * @returns {Promise<Object>} Stats about imported places
   */
  async getImportStats() {
    const total = await Place.countDocuments();
    const fromGoong = await Place.countDocuments({ source: 'goong' });
    const fromApify = await Place.countDocuments({ source: 'apify' });
    const manual = await Place.countDocuments({ source: 'manual' });
    const needsEnrich = await Place.countDocuments({ needsEnrich: true });

    return {
      total,
      fromGoong, // Legacy
      fromApify, // New
      manual,
      needsEnrich,
      enriched: total - needsEnrich
    };
  }

  /**
   * @desc Sync (refresh) existing Apify place
   * @param {String} placeId - MongoDB Place ID
   * @returns {Promise<Object>} Updated place
   */
  async syncGoongPlace(placeId) {
    const place = await Place.findById(placeId);

    if (!place) {
      throw new Error('Place not found');
    }

    if (place.source !== 'apify' || !place.apifyPlaceId) {
      throw new Error('Place is not from Apify');
    }

    // Re-fetch from Apify (would need to re-run actor - not practical)
    // For now, just throw error
    throw new Error('Apify sync not supported (requires re-running actor). Please re-import instead.');
  }

  /**
   * @desc Delete all Apify places (DANGEROUS - use with caution)
   * @returns {Promise<Object>} { deletedCount }
   */
  async deleteAllGoongPlaces() {
    const result = await Place.deleteMany({ source: 'apify' });
    return { deletedCount: result.deletedCount };
  }
}

// Singleton instance
export default new PlaceImportService();
