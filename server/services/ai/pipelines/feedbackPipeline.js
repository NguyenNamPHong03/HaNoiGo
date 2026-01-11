/**
 * Feedback Pipeline - Collect user feedback để improve
 * Mục đích: Track user satisfaction, collect data for fine-tuning
 */

import { MongoClient } from 'mongodb';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class FeedbackPipeline {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize MongoDB connection
     */
    async initialize() {
        if (this.db) return this.db;

        try {
            const client = new MongoClient(config.mongodb.uri);
            await client.connect();
            this.db = client.db(config.mongodb.dbName);
            logger.info('✅ Feedback DB initialized');
            return this.db;
        } catch (error) {
            logger.error('❌ Feedback DB initialization failed:', error);
            throw error;
        }
    }

    /**
     * Store user feedback
     */
    async recordFeedback({
        questionId,
        question,
        answer,
        rating, // 1-5
        isAccurate, // boolean
        isHelpful, // boolean
        comment,
        sources,
    }) {
        try {
            const db = await this.initialize();

            const feedback = {
                questionId,
                question,
                answer,
                rating,
                isAccurate,
                isHelpful,
                comment,
                sources,
                timestamp: new Date(),
                userId: this.getCurrentUserId(), // Implement this
            };

            const result = await db.collection('feedback').insertOne(feedback);

            logger.info(`✅ Feedback recorded: ${result.insertedId}`);

            return result;
        } catch (error) {
            logger.error('❌ Feedback recording failed:', error);
        }
    }

    /**
     * Get feedback summary
     */
    async getFeedbackSummary(timeframeHours = 24) {
        try {
            const db = await this.initialize();

            const since = new Date(Date.now() - timeframeHours * 60 * 60 * 1000);

            const summary = await db.collection('feedback').aggregate([
                {
                    $match: { timestamp: { $gte: since } },
                },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: '$rating' },
                        helpfulCount: {
                            $sum: { $cond: ['$isHelpful', 1, 0] },
                        },
                        accurateCount: {
                            $sum: { $cond: ['$isAccurate', 1, 0] },
                        },
                        totalFeedback: { $sum: 1 },
                    },
                },
            ]).toArray();

            return summary[0] || {};
        } catch (error) {
            logger.error('❌ Feedback summary retrieval failed:', error);
            return {};
        }
    }

    getCurrentUserId() {
        // Implementation depends on auth system
        return 'anonymous';
    }
}

export default new FeedbackPipeline();
