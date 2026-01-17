/**
 * AI Routes - API endpoints for AI chat service
 */

import express from 'express';
import Place from '../models/Place.js';
import { healthCheck, processMessage } from '../services/ai/index.js';
import { sortPlacesByDistance } from '../services/ai/utils/distanceUtils.js';
import { sortPlacesByAnswerOrder } from '../services/ai/utils/reorderUtils.js';

const router = express.Router();

/**
 * POST /api/ai/chat
 * Process a natural language query and return AI response with places
 */
router.post('/chat', async (req, res) => {
  try {
    const { question, userId = 'anonymous', latitude, longitude, localTime, nearMe } = req.body;

    const context = {
      location: (latitude && longitude) ? { lat: latitude, lng: longitude } : null,
      localTime,
      nearMe: nearMe || false
    };

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    // Process the question through AI pipeline
    const aiResult = await processMessage(question, userId, context);

    // Extract place identifiers from sources
    // Try id first, fallback to name
    const placeIds = [];
    const placeNames = [];

    for (const src of aiResult.sources || []) {
      const id = src.metadata?.id;
      const name = src.metadata?.name || src.name;

      if (id) placeIds.push(id);
      if (name) placeNames.push(name);
    }

    // Fetch actual Place documents for richer data
    let places = [];

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

    // REORDERING FIX 2.1: Use shared utility
    // Sort places by appearance in AI answer
    if (aiResult.answer && places.length > 0) {
      places = sortPlacesByAnswerOrder(places, aiResult.answer);
    }

    // 📍 DISTANCE SORTING: If user provided location, sort by distance (nearest first)
    if (latitude && longitude && typeof latitude === 'number' && typeof longitude === 'number') {
      console.log(`📍 Sorting ${places.length} places by distance from (${latitude}, ${longitude})`);
      places = sortPlacesByDistance(places, latitude, longitude);
      
      // Optional: Limit to top 30 nearest for performance
      if (places.length > 30) {
        console.log(`✂️ Trimming to 30 nearest places (was ${places.length})`);
        places = places.slice(0, 30);
      }
    }

    // Build sources with actual names
    const enrichedSources = (aiResult.sources || []).map((src, idx) => ({
      name: src.metadata?.name || src.name || `Source ${idx + 1}`,
      score: src.score,
      id: src.metadata?.id,
      address: src.metadata?.address
    }));

    res.json({
      success: true,
      data: {
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
      }
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
router.post('/chat/stream', async (req, res) => {
  try {
    const { question, userId = 'anonymous' } = req.body;

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

    const aiResult = await processMessage(question, userId);

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
    if (aiResult.answer && places.length > 0) {
      places = sortPlacesByAnswerOrder(places, aiResult.answer);
    }

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