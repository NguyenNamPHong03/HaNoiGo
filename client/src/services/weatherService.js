import api from './api';

export const getWeatherForecast = async (lat, lon) => {
    try {
        const response = await api.get('/weather', {
            params: { lat, lon }
        });
        return response.data.data;
    } catch (error) {
        console.error("Weather fetch error:", error);
        return null;
    }
};
