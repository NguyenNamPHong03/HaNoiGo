import axios from 'axios';
import logger from '../ai/utils/logger.js';

class WeatherService {
    constructor() {
        this.baseUrl = 'https://api.open-meteo.com/v1/forecast';
        this.cache = {
            data: null,
            lastFetch: 0,
            ttl: 30 * 60 * 1000 // 30 minutes
        };
    }

    async getForecast(lat = 21.0285, lon = 105.8542) {
        // Create cache key based on location
        const cacheKey = `${lat},${lon}`;
        const now = Date.now();

        if (this.cache.data && this.cache.key === cacheKey && (now - this.cache.lastFetch < this.cache.ttl)) {
            return this.cache.data;
        }

        try {
            // Fetch comprehensive data
            const response = await axios.get(this.baseUrl, {
                params: {
                    latitude: lat,
                    longitude: lon,
                    current: 'temperature_2m,weather_code,is_day',
                    hourly: 'temperature_2m,weather_code',
                    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
                    timezone: 'Asia/Bangkok',
                    forecast_days: 7
                }
            });

            const data = response.data;
            const current = data.current;
            const daily = data.daily;
            const hourly = data.hourly;

            // Format Current
            const weatherDesc = this.getWeatherDescription(current.weather_code);

            // Format Daily (7 days)
            const dailyForecast = daily.time.map((time, index) => {
                const date = new Date(time);
                let dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' }); // Th 2, Th 3...
                // Clean up Vietnamese day names if needed (e.g. "T2", "CN")
                // vi-VN usually returns "Th 2", "CN"
                if (index === 0) dayName = 'Hôm nay';

                return {
                    day: dayName,
                    code: daily.weather_code[index],
                    icon: this.getIconFromCode(daily.weather_code[index]),
                    low: Math.round(daily.temperature_2m_min[index]),
                    high: Math.round(daily.temperature_2m_max[index]),
                    chance: daily.precipitation_probability_max[index] > 20 ? `${daily.precipitation_probability_max[index]}%` : null
                };
            });

            // Format Hourly (Next 5 hours from current time)
            // OpenMeteo returns local time strings if timezone is specified, e.g. "2024-01-14T20:00"
            // But javascript Date parsers might treat them as UTC if Z is missing, or local.
            // Safest is to compare timestamps.

            const nowTime = Date.now();
            // Find the index closest to current time
            let startIndex = 0;
            let minDiff = Infinity;

            hourly.time.forEach((t, i) => {
                const itemTime = new Date(t).getTime();
                const diff = Math.abs(itemTime - nowTime);
                if (diff < minDiff) {
                    minDiff = diff;
                    startIndex = i;
                }
            });

            // We want the current hour and next 4
            // Ensure we don't go out of bounds
            const hourlyForecast = hourly.time.slice(startIndex, startIndex + 5).map((time, i) => {
                const date = new Date(time);
                // "14h", "15h"
                const hourStr = `${date.getHours()}h`;
                return {
                    time: hourStr,
                    temp: Math.round(hourly.temperature_2m[startIndex + i]),
                    icon: this.getIconFromCode(hourly.weather_code[startIndex + i]),
                    code: hourly.weather_code[startIndex + i]
                };
            });

            const formattedData = {
                current: {
                    temp: Math.round(current.temperature_2m),
                    condition: weatherDesc,
                    isDay: current.is_day === 1,
                    low: Math.round(daily.temperature_2m_min[0]),
                    high: Math.round(daily.temperature_2m_max[0]),
                    fullDescription: `${Math.round(current.temperature_2m)}°C, ${weatherDesc}`
                },
                daily: dailyForecast,
                hourly: hourlyForecast
            };

            this.cache.data = formattedData;
            this.cache.key = cacheKey;
            this.cache.lastFetch = now;

            return formattedData;

        } catch (error) {
            logger.error('⚠️ Failed to fetch weather forecast:', error.message);
            // Fallback mock data
            return null;
        }
    }

    // Alias for backward compatibility if needed, using the new structure
    async getCurrentWeather() {
        const forecast = await this.getForecast();
        if (!forecast) return super.getCurrentWeather(); // Recursion risk if super doesn't exist? No, this is replacing logic.
        // Return minimal structure compatible with old calls
        return {
            temp: forecast.current.temp,
            condition: forecast.current.condition,
            isDay: forecast.current.isDay,
            fullDescription: forecast.current.fullDescription,
            description: forecast.current.condition, // Backward compat
            skyConditions: forecast.current.condition // Backward compat
        };
    }

    getIconFromCode(code) {
        if (code === 0) return 'sun';
        if (code >= 1 && code <= 3) return 'cloud';
        if (code >= 45 && code <= 48) return 'cloud';
        if (code >= 51 && code <= 67) return 'rain';
        if (code >= 80 && code <= 82) return 'rain';
        if (code >= 95) return 'storm';
        return 'sun';
    }

    getWeatherDescription(code) {
        // WMO Weather interpretation codes (WW)
        if (code === 0) return 'Trời quang đãng';
        if (code >= 1 && code <= 3) return 'Có mây';
        if (code >= 45 && code <= 48) return 'Có sương mù';
        if (code >= 51 && code <= 55) return 'Mưa phùn';
        if (code >= 61 && code <= 67) return 'Mưa rào';
        if (code >= 80 && code <= 82) return 'Mưa to';
        if (code >= 95) return 'Có dông';
        return 'Mát mẻ';
    }
}

export default new WeatherService();
