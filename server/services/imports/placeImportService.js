import Place from '../../models/Place.js';
import { mapGoongDetailToPlace, validatePlaceData } from '../../utils/placeMapper.js';
import goongProvider from '../providers/goongProvider.js';

/**
 * @fileoverview Place Import Service
 * @description Business logic for importing places from Goong API to MongoDB
 * Handles upsert, duplicate detection, and statistics reporting
 */

class PlaceImportService {
  /**
   * @desc Import multiple places from Goong API
   * @param {Array<String>} placeIds - Array of Goong place_ids
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
   * @param {String} placeId - Goong place_id
   * @param {String} createdBy - User ID
   * @returns {Promise<Object>} { status, place }
   * @private
   */
  async _importSinglePlace(placeId, createdBy) {
    // 1. Fetch from Goong API
    const goongData = await goongProvider.detail(placeId);

    // 2. Map to Place schema
    const placeData = mapGoongDetailToPlace(goongData, { createdBy });

    // 3. Validate
    const validation = validatePlaceData(placeData);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // 4. Check if exists (by source + goongPlaceId)
    const existingPlace = await Place.findOne({
      source: 'goong',
      goongPlaceId: placeId
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
   * @desc Update existing place with new Goong data
   * @param {Object} existingPlace - Mongoose document
   * @param {Object} newData - New place data from Goong
   * @returns {Promise<Object>} Updated place
   * @private
   */
  async _updateExistingPlace(existingPlace, newData) {
    // ✅ Smart update: only update specific fields, preserve manual edits
    existingPlace.address = newData.address;
    existingPlace.location = newData.location;
    existingPlace.coordinates = newData.coordinates;
    
    // Update Goong metadata
    existingPlace.goong.lastSyncedAt = new Date();
    existingPlace.goong.rating = newData.goong.rating;
    existingPlace.goong.raw = newData.goong.raw;

    // Update contact info if changed
    if (newData.contact.phone) {
      existingPlace.contact.phone = newData.contact.phone;
    }
    if (newData.contact.website) {
      existingPlace.contact.website = newData.contact.website;
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
    const manual = await Place.countDocuments({ source: 'manual' });
    const needsEnrich = await Place.countDocuments({ needsEnrich: true });

    return {
      total,
      fromGoong,
      manual,
      needsEnrich,
      enriched: total - needsEnrich
    };
  }

  /**
   * @desc Sync (refresh) existing Goong place
   * @param {String} placeId - MongoDB Place ID
   * @returns {Promise<Object>} Updated place
   */
  async syncGoongPlace(placeId) {
    const place = await Place.findById(placeId);

    if (!place) {
      throw new Error('Place not found');
    }

    if (place.source !== 'goong' || !place.goongPlaceId) {
      throw new Error('Place is not from Goong');
    }

    // Re-fetch from Goong
    const goongData = await goongProvider.detail(place.goongPlaceId);
    const newData = mapGoongDetailToPlace(goongData, { createdBy: place.createdBy });

    // Update
    const updatedPlace = await this._updateExistingPlace(place, newData);
    return updatedPlace;
  }

  /**
   * @desc Delete all Goong places (DANGEROUS - use with caution)
   * @returns {Promise<Object>} { deletedCount }
   */
  async deleteAllGoongPlaces() {
    const result = await Place.deleteMany({ source: 'goong' });
    return { deletedCount: result.deletedCount };
  }
}

// Singleton instance
export default new PlaceImportService();
