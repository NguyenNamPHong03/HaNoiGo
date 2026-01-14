import express from 'express';
import weatherService from '../services/weather/weatherService.js';

const router = express.Router();

/**
 * GET /api/weather
 * Get current, daily, and hourly weather forecast
 */
router.get('/', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        // Default to Hanoi
        const latitude = lat ? parseFloat(lat) : 21.0285;
        const longitude = lon ? parseFloat(lon) : 105.8542;

        const data = await weatherService.getForecast(latitude, longitude);

        if (!data) {
            return res.status(503).json({ success: false, message: 'Weather service unavailable' });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
