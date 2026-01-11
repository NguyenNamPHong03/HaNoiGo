/**
 * Document Processor - Convert raw DB documents to LangChain Documents
 * Mục đích: Format dữ liệu Model (Place) thành text ngữ nghĩa để Embedding
 */

import { Document } from '@langchain/core/documents';
import logger from './logger.js';

class DocumentProcessor {
    /**
     * Process Documents based on collection name
     */
    process(collectionName, rawDocs) {
        logger.info(`🔄 Processing ${rawDocs.length} documents from ${collectionName}...`);

        switch (collectionName) {
            case 'places':
            case 'col_places': // Handle potential collection naming variations
                return this._processPlaces(rawDocs);

            // Có thể mở rộng cho 'reviews', 'users', etc.
            default:
                logger.warn(`⚠️  No specific processor for ${collectionName}, using default fallback`);
                return this._processDefault(rawDocs);
        }
    }

    /**
     * Process Place documents
     * Strategy: Combine rich semantic fields into pageContent
     */
    _processPlaces(places) {
        return places.map(place => {
            // 1. Flatten Tags
            const aiTags = place.aiTags || {};
            const moodTags = aiTags.mood?.join(', ') || '';
            const spaceTags = aiTags.space?.join(', ') || '';
            const suitabilityTags = aiTags.suitability?.join(', ') || '';
            const specialFeatures = aiTags.specialFeatures?.join(', ') || '';
            const crowdLevel = aiTags.crowdLevel?.join(', ') || '';
            const musicTags = aiTags.music?.join(', ') || '';
            const parkingTags = aiTags.parking?.join(', ') || '';

            // Format Menu Highlights (Top 5 items)
            const menuHighlights = place.menu?.slice(0, 5).map(m => `- ${m.name} (${m.price.toLocaleString()}đ)`).join('\n') || 'N/A';

            // 2. Construct Rich Context String
            const content = `
Name: ${place.name}
Category: ${place.category}
Address: ${place.address} (${place.district})
Price Range: ${place.priceDisplay || 'N/A'}
Opening Hours: ${this._formatOpeningHours(place)}

Description:
${place.description}

Atmosphere & Vibe:
Mood: ${moodTags}
Space: ${spaceTags}
Crowd: ${crowdLevel}
Music: ${musicTags}

Facilities:
Parking: ${parkingTags}
Highlights: ${specialFeatures}

Suitable For: ${suitabilityTags}

Menu Highlights:
${menuHighlights}
      `.trim();

            // 3. Select Metadata for Filtering
            const metadata = {
                id: place._id.toString(),
                source: 'places',
                name: place.name,
                district: place.district,
                category: place.category,
                minPrice: place.priceRange?.min,
                maxPrice: place.priceRange?.max,
                rating: place.averageRating || 0,
                ...this._flattenMetadataTags(aiTags) // Flatten tags for metadata filtering if needed
            };

            return new Document({
                pageContent: content,
                metadata: metadata
            });
        });
    }

    /**
     * Default processor (just JSON stringify)
     */
    _processDefault(docs) {
        return docs.map(doc => new Document({
            pageContent: JSON.stringify(doc),
            metadata: { source: 'unknown', id: doc._id?.toString() }
        }));
    }

    /**
     * Helper: Format Opening Hours
     */
    _formatOpeningHours(place) {
        if (place.openingHours && place.openingHours.length > 0) {
            return place.openingHours.map(h => `${h.day}: ${h.hours}`).join(', ');
        }
        return 'N/A';
    }

    /**
     * Helper: Flatten tags for metadata
     */
    _flattenMetadataTags(aiTags) {
        const flat = {};
        if (aiTags.mood) flat.mood = aiTags.mood;
        if (aiTags.suitability) flat.suitability = aiTags.suitability;
        return flat;
    }
}

export default new DocumentProcessor();
