/**
 * AI Routes - API endpoints for AI chat service
 */

import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import Place from '../models/Place.js';
import { healthCheck, processMessage } from '../services/ai/index.js';
import { sortPlacesByDistance } from '../services/ai/utils/distanceUtils.js';

const router = express.Router();

/**
 * POST /api/ai/chat
 * Process a natural language query and return AI response with places
 */
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const {
      question, userId = 'anonymous',
      latitude, longitude, localTime, nearMe,
      useRealtime, useLocation, usePersonalization, // Extract new flags
      userPreferences: bodyPreferences // User preferences from request body
    } = req.body;

    // Get user preferences: prioritize body preferences, fallback to logged-in user preferences
    const userPreferences = bodyPreferences || req.user?.preferences || null;
    const actualUserId = req.user?._id?.toString() || userId;

    // Debug logging
    console.log('🤖 AI Chat Request:', {
      question: question.substring(0, 50) + '...',
      userId: actualUserId,
      hasBodyPreferences: !!bodyPreferences,
      hasUserPreferences: !!req.user?.preferences,
      finalPreferences: userPreferences ? {
        dietary: userPreferences.dietary || [],
        favoriteFoods: userPreferences.favoriteFoods?.length || 0,
        styles: userPreferences.styles?.length || 0
      } : 'null',
      usePersonalization
    });

    // Handle location from flatness or nested object
    let loc = null;
    if (latitude && longitude) {
      loc = { lat: latitude, lng: longitude };
    } else if (req.body.location && req.body.location.lat && req.body.location.lng) {
      loc = req.body.location;
    }

    const context = {
      location: loc,
      localTime,
      nearMe: nearMe || false,
      useRealtime,         // Pass to pipeline
      useLocation: nearMe || useLocation || false,  // Enable location sorting when nearMe is true
      usePersonalization,  // Pass to pipeline
      userPreferences // Pass user preferences to AI pipeline
    };

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    // Process the question through AI pipeline
    const aiResult = await processMessage(question, actualUserId, context);

    // PRIORITY: Use places from pipeline if available (already processed and ordered)
    // Only fallback to DB fetch if pipeline didn't return places
    let places = [];

    if (aiResult.places && aiResult.places.length > 0) {
      // Use places directly from pipeline (already in correct order)
      console.log(`✅ Using ${aiResult.places.length} places from AI pipeline (pre-ordered)`);
      places = aiResult.places;

      // Fetch full Place documents to get complete data (images, menu, etc.)
      // 🔧 FIX: Filter out temp IDs (not valid MongoDB ObjectIds) before querying
      const validPlaceIds = places
        .map(p => p._id)
        .filter(id => id && !String(id).startsWith('temp-') && /^[a-f\d]{24}$/i.test(String(id)));

      console.log(`   📊 Valid MongoDB IDs: ${validPlaceIds.length}/${places.length}`);

      if (validPlaceIds.length > 0) {
        const fullPlaces = await Place.find({
          _id: { $in: validPlaceIds },
          status: 'Published',
          isActive: true
        }).lean();

        // Merge full data while preserving order
        const placeMap = new Map(fullPlaces.map(p => [p._id.toString(), p]));

        // 🔧 Also search by name for places with temp IDs
        const placesWithTempIds = places.filter(p => String(p._id).startsWith('temp-') && p.name);
        let nameToPlaceMap = new Map();

        if (placesWithTempIds.length > 0) {
          const tempPlaceNames = placesWithTempIds.map(p => p.name);
          console.log(`   🔍 Searching MongoDB by name for ${tempPlaceNames.length} temp-ID places...`);

          const nameMatchedPlaces = await Place.find({
            name: { $in: tempPlaceNames },
            status: 'Published',
            isActive: true
          }).lean();

          nameToPlaceMap = new Map(nameMatchedPlaces.map(p => [p.name, p]));
          console.log(`   ✅ Found ${nameMatchedPlaces.length} places by name`);
        }

        places = places.map(p => {
          const idStr = String(p._id);

          // Try 1: Match by ID
          const fullPlace = placeMap.get(idStr);
          if (fullPlace) {
            return { ...fullPlace, distanceKm: p.distanceKm };
          }

          // Try 2: Match by name (for temp IDs)
          if (idStr.startsWith('temp-') && p.name) {
            const nameMatchedPlace = nameToPlaceMap.get(p.name);
            if (nameMatchedPlace) {
              console.log(`   ✅ Matched by name: ${p.name} → ID: ${nameMatchedPlace._id}`);
              return { ...nameMatchedPlace, distanceKm: p.distanceKm };
            }
          }

          return p; // Keep original place data if no match found
        }).filter(Boolean);
      }
    } else {
      // Fallback: Extract from sources (old logic)
      console.log(`⚠️ Pipeline didn't return places, extracting from sources...`);
      const placeIds = [];
      const placeNames = [];

      for (const src of aiResult.sources || []) {
        const id = src.metadata?.id;
        const name = src.metadata?.name || src.name;

        if (id) placeIds.push(id);
        if (name) placeNames.push(name);
      }

      // Try by ID first
      if (placeIds.length > 0) {
        const fetchedPlaces = await Place.find({
          _id: { $in: placeIds },
          status: 'Published',
          isActive: true
        }).lean();

        // IMPORTANT: Reorder to match the original placeIds order (by relevance score)
        // MongoDB $in does not preserve order
        const placeMap = new Map(fetchedPlaces.map(p => [p._id.toString(), p]));
        places = placeIds
          .map(id => placeMap.get(id.toString()))
          .filter(Boolean);
      }

      // If no places found by ID, try by name
      if (places.length === 0 && placeNames.length > 0) {
        const fetchedPlaces = await Place.find({
          name: { $in: placeNames },
          status: 'Published',
          isActive: true
        }).lean();

        // Reorder by name order
        const nameMap = new Map(fetchedPlaces.map(p => [p.name, p]));
        places = placeNames
          .map(name => nameMap.get(name))
          .filter(Boolean);
      }
    }

    console.log(`\n📊 ===== BEFORE REORDERING DEBUG =====`);
    console.log(`📊 Intent: ${aiResult.intent}`);
    console.log(`📊 Has schedule: ${!!aiResult.structuredData?.schedule}`);
    console.log(`📊 Places count: ${places.length}`);
    if (places.length > 0) {
      console.log(`📊 Current places order:`);
      places.forEach((p, i) => {
        console.log(`   [${i}] → ${p.name} (ID: ${p._id})`);
      });
    }
    console.log(`📊 =====================================\n`);

    // SPECIAL CASE: ITINERARY - Sort by schedule order using placeId
    // 🔥 CRITICAL FIX: ALWAYS run reordering for ITINERARY intent
    if (aiResult.intent === 'ITINERARY' && aiResult.structuredData?.schedule) {
      console.log(`📅 [ITINERARY] Reordering places by schedule placeId order`);
      console.log(`📅 Schedule has ${aiResult.structuredData.schedule.length} items`);

      // Create map by ID for fast lookup
      const placeMapById = new Map();
      places.forEach(p => {
        const idStr = p._id.toString();
        placeMapById.set(idStr, p);
        console.log(`   📍 Available place: ${p.name} (ID: ${idStr})`);
      });

      // Reorder places to match schedule using placeId
      const orderedPlaces = [];
      const usedIds = new Set();

      // Process each schedule item
      for (const [idx, scheduleItem] of aiResult.structuredData.schedule.entries()) {
        const placeId = scheduleItem.placeId;
        const placeName = scheduleItem.placeName;

        console.log(`\n   🔍 Processing schedule[${idx}]:`);
        console.log(`      Activity: ${scheduleItem.activity}`);
        console.log(`      PlaceId from schedule: ${placeId}`);
        console.log(`      PlaceName: ${placeName}`);

        // Try 1: Match by placeId
        if (placeId && placeMapById.has(placeId)) {
          const place = placeMapById.get(placeId);
          if (!usedIds.has(placeId)) {
            orderedPlaces.push(place);
            usedIds.add(placeId);
            console.log(`      ✅ MATCHED by ID → ${place.name}`);
          } else {
            console.log(`      ⚠️ Already used this placeId`);
          }
        }
        // Try 2: Search MongoDB by name (for missing places like Lăng Bác, Văn Miếu)
        else if (placeName) {
          // Remove text in parentheses and trim FIRST
          let cleanName = placeName.replace(/\s*\(.*?\)\s*/g, '').trim();

          // 🔧 STRIP ACTION VERBS (Dạo, Tham quan, Đi, Xem, v.v.)
          // "Dạo hồ Hoàn Kiếm" → "Hồ Hoàn Kiếm"
          // "Tham quan Văn Miếu" → "Văn Miếu"
          cleanName = cleanName.replace(/^(Dạo|Tham quan|Đi|Xem|Thăm|Ghé)\s+/i, '').trim();

          // Capitalize first letter (fix "hồ" → "Hồ")
          if (cleanName.length > 0) {
            cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
          }

          // 🌊 SPECIAL CASE: Only create placeholder for truly generic terms
          if (!cleanName || cleanName.match(/^(gần đây|các quán|quán gần)$/i)) {
            console.log(`      🏞️ Truly generic place, creating placeholder for: "${placeName}"`);

            const placeholderPlace = {
              _id: `placeholder_${idx}`,
              name: placeName,
              address: 'Địa điểm tự do - Không cần đặt chỗ trước',
              category: 'Vui chơi',
              priceRange: { min: 0, max: 0 },
              averageRating: 0,
              totalReviews: 0,
              images: ['https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800'],
              aiTags: { space: [], specialFeatures: [] },
              isPlaceholder: true,
              description: scheduleItem.reason || 'Địa điểm tự do'
            };

            orderedPlaces.push(placeholderPlace);
            console.log(`      ✅ Added PLACEHOLDER → ${placeName}`);
          } else {
            console.log(`      🔎 Searching MongoDB by name: "${cleanName}" (from "${placeName}")`);

            try {

              // Alias mapping for common landmarks (Hồ Gươm = Hồ Hoàn Kiếm)
              const aliasMap = {
                'Hồ Gươm': 'Hồ Hoàn Kiếm',
                'Hồ Hoàn Kiếm': 'Hồ Gươm',
                'Lăng Bác': 'Lăng Chủ tịch Hồ Chí Minh',
                'Lăng Hồ Chí Minh': 'Lăng Chủ tịch Hồ Chí Minh',
                'Văn Miếu': 'Văn Miếu – Quốc Tử Giám',
                'Quốc Tử Giám': 'Văn Miếu – Quốc Tử Giám',
                'Hồ Tây': 'Hồ Tây' // Ensure exact match
              };

              // Get all possible names (original + alias)
              const searchNames = [cleanName];
              if (aliasMap[cleanName]) {
                searchNames.push(aliasMap[cleanName]);
              }

              console.log(`      🔍 Search aliases: [${searchNames.join(', ')}]`);

              // Priority 1: Exact match (case-insensitive) with any alias
              let foundPlace = await Place.findOne({
                name: {
                  $in: searchNames.map(n => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'))
                },
                status: 'Published'
              }).lean();

              // Priority 2: Starts with name (any alias)
              if (!foundPlace) {
                foundPlace = await Place.findOne({
                  $or: searchNames.map(n => ({
                    name: { $regex: new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i') }
                  })),
                  status: 'Published'
                }).lean();
              }

              // Priority 3: Contains name (fuzzy) + Category filter for landmarks
              if (!foundPlace) {
                const isLandmark = /hồ|lăng|văn miếu|đền|chùa|bảo tàng|di tích/i.test(cleanName);

                // Extract first significant word for search (from any alias)
                const firstWords = searchNames.map(n => n.split(/\s+/)[0]);
                const query = {
                  name: {
                    $regex: new RegExp(firstWords.join('|'), 'i') // Search any first word
                  },
                  status: 'Published'
                };

                // For landmarks: prioritize category "Khác" or "Vui chơi"
                // Exclude restaurants/cafes when searching for landmarks
                if (isLandmark) {
                  query.category = { $in: ['Khác', 'Vui chơi'] };
                  // Further filter: exclude places with "CGV", "Cinema", "Rạp" in name
                  query.name = {
                    $regex: new RegExp(firstWords.join('|'), 'i'),
                    $not: /CGV|Cinema|Rạp|LOTTE|BHD|Plaza/i
                  };
                }

                const candidates = await Place.find(query).limit(10).lean();

                // Find best match by similarity
                if (candidates.length > 0) {
                  console.log(`      🔍 Found ${candidates.length} candidates, finding best match...`);
                  candidates.forEach(c => console.log(`         - ${c.name} (${c.category})`));

                  foundPlace = candidates.reduce((best, curr) => {
                    const currNameLower = curr.name.toLowerCase();

                    // Check if name contains ANY of the search terms
                    const currMatchScore = searchNames.reduce((score, searchName) => {
                      const searchLower = searchName.toLowerCase();
                      if (currNameLower === searchLower) return score + 100; // Exact match
                      if (currNameLower.includes(searchLower)) return score + 50; // Contains
                      if (searchLower.includes(currNameLower)) return score + 30; // Reverse contains
                      return score;
                    }, 0);

                    const bestMatchScore = best ? searchNames.reduce((score, searchName) => {
                      const searchLower = searchName.toLowerCase();
                      const bestLower = best.name.toLowerCase();
                      if (bestLower === searchLower) return score + 100;
                      if (bestLower.includes(searchLower)) return score + 50;
                      if (searchLower.includes(bestLower)) return score + 30;
                      return score;
                    }, 0) : 0;

                    if (currMatchScore > bestMatchScore) return curr;
                    if (currMatchScore < bestMatchScore) return best;

                    // Same score → prefer shorter name (more specific)
                    if (!best || curr.name.length < best.name.length) return curr;
                    return best;
                  }, null);
                }
              }

              if (foundPlace) {
                const foundIdStr = foundPlace._id.toString();
                console.log(`      ✅ FOUND in DB → ${foundPlace.name} (${foundPlace.category}, ID: ${foundIdStr})`);

                if (!usedIds.has(foundIdStr)) {
                  orderedPlaces.push(foundPlace);
                  usedIds.add(foundIdStr);

                  // Update placeId in schedule for future reference
                  scheduleItem.placeId = foundIdStr;
                } else {
                  console.log(`      ⚠️ Already used this place`);
                }
              } else {
                console.log(`      ⚠️ Not found in DB for: "${cleanName}"`);
              }
            } catch (error) {
              console.error(`      ❌ Error searching DB:`, error.message);
            }
          }
        } else {
          console.log(`      ⚠️ Skipping (no placeName)`);
        }
      }

      // Add remaining places not in schedule
      places.forEach(p => {
        if (!usedIds.has(p._id.toString())) {
          orderedPlaces.push(p);
          console.log(`   📍 Extra place (not in schedule): ${p.name}`);
        }
      });

      places = orderedPlaces;
      console.log(`\n✅ FINAL: Reordered to ${places.length} places (${usedIds.size} from schedule, ${places.length - usedIds.size} extra)`);
      console.log(`📊 Final order:`);
      places.forEach((p, i) => {
        console.log(`   [${i}] → ${p.name}`);
      });
    }
    // NORMAL CASE: nearMe mode
    else if (nearMe && latitude && longitude) {
      console.log(`📍 [nearMe=true] Preserving distance-sorted order from pipeline`);
      // Sort by distance to ensure consistency
      places = sortPlacesByDistance(places, latitude, longitude);
    }
    // DISABLED: sortPlacesByAnswerOrder causes RANK #1 to appear at wrong position
    // else if (aiResult.answer && places.length > 0) {
    //   // Normal mode: sort by AI answer order
    //   places = sortPlacesByAnswerOrder(places, aiResult.answer);
    // }

    // Add distance info even in non-nearMe mode (for display purposes)
    if (!nearMe && latitude && longitude && typeof latitude === 'number' && typeof longitude === 'number') {
      console.log(`📍 [nearMe=false] Adding distance info without re-sorting`);
      const placesWithDistance = sortPlacesByDistance(places, latitude, longitude);
      // Restore original order but keep distanceKm field
      const distanceMap = new Map(placesWithDistance.map(p => [p._id.toString(), p.distanceKm]));
      places = places.map(p => ({
        ...p,
        distanceKm: distanceMap.get(p._id.toString())
      }));
    }

    // Build sources with actual names
    const enrichedSources = (aiResult.sources || []).map((src, idx) => ({
      name: src.metadata?.name || src.name || `Source ${idx + 1}`,
      score: src.score,
      id: src.metadata?.id,
      address: src.metadata?.address
    }));

    const responseData = {
      question: aiResult.question,
      answer: aiResult.answer,
      cached: aiResult.cached,
      sources: enrichedSources,
      intent: aiResult.intent,
      structuredData: aiResult.structuredData,
      places: places.map(p => ({
        _id: p._id,
        name: p.name,
        address: p.address,
        district: p.district,
        category: p.category,
        priceRange: p.priceRange,
        priceDisplay: p.priceDisplay,
        averageRating: p.averageRating,
        totalReviews: p.totalReviews,
        images: p.images,
        aiTags: p.aiTags,
        openingHours: p.openingHours,
        operatingHours: p.operatingHours,
        contact: p.contact,
        additionalInfo: p.additionalInfo,
        googleData: p.googleData,
        distanceKm: p.distanceKm // Include distance if available
      }))
    };

    console.log(`\n🎯 ===== FINAL API RESPONSE =====`);
    console.log(`🎯 Places count: ${responseData.places.length}`);
    console.log(`🎯 Places names:`, responseData.places.map(p => p.name));
    console.log(`🎯 Answer preview: ${responseData.answer?.substring(0, 200) || 'N/A'}...`);
    console.log(`🎯 ================================\n`);

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI processing failed'
    });
  }
});

/**
 * POST /api/ai/chat/stream
 * Streaming version using Server-Sent Events for faster perceived response
 */
router.post('/chat/stream', optionalAuth, async (req, res) => {
  try {
    const { question, userId = 'anonymous' } = req.body;

    // Get user preferences if logged in
    const userPreferences = req.user?.preferences || null;
    const actualUserId = req.user?._id?.toString() || userId;

    const context = {
      userPreferences // Pass user preferences to AI pipeline
    };

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Process the question through AI pipeline with streaming
    // For now, we still use the non-streaming pipeline but send metadata early
    // Full streaming requires LLM streaming integration

    // Send "thinking" event immediately
    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Đang tìm kiếm...' })}\n\n`);

    const aiResult = await processMessage(question, actualUserId, context);

    // Send places data first for fast UI update
    const placeIds = (aiResult.sources || [])
      .map(src => src.metadata?.id)
      .filter(Boolean);

    let places = [];
    if (placeIds.length > 0) {
      const fetchedPlaces = await Place.find({
        _id: { $in: placeIds },
        status: 'Published',
        isActive: true
      }).lean();

      // Reorder to match the original placeIds order (by relevance score)
      const placeMap = new Map(fetchedPlaces.map(p => [p._id.toString(), p]));
      places = placeIds
        .map(id => placeMap.get(id.toString()))
        .filter(Boolean);
    }

    // REORDERING FIX 2.1 (Stream): Use shared utility
    // DISABLED: sortPlacesByAnswerOrder causes RANK #1 to appear at wrong position
    // if (aiResult.answer && places.length > 0) {
    //   places = sortPlacesByAnswerOrder(places, aiResult.answer);
    // }

    // Send places event
    res.write(`data: ${JSON.stringify({
      type: 'places',
      data: places.map(p => ({
        _id: p._id,
        name: p.name,
        address: p.address,
        priceRange: p.priceRange,
        averageRating: p.averageRating,
        totalReviews: p.totalReviews,
        images: p.images,
        category: p.category,
        aiTags: p.aiTags,
        openingHours: p.openingHours,
        operatingHours: p.operatingHours,
        contact: p.contact,
        additionalInfo: p.additionalInfo,
        googleData: p.googleData
      }))
    })}\n\n`);

    // Send answer event
    res.write(`data: ${JSON.stringify({
      type: 'answer',
      data: aiResult.answer
    })}\n\n`);

    // Send done event
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error) {
    console.error('AI Chat Stream Error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/ai/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await healthCheck();
    res.json({
      success: true,
      healthy: isHealthy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      healthy: false,
      error: error.message
    });
  }
});

export default router;