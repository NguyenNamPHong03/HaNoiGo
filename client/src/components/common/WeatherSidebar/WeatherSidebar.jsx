import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWeatherForecast } from '../../../services/weatherService';
import styles from './WeatherSidebar.module.css';

const WeatherIcon = ({ type, size = 24, className }) => {
    // Simple SVG paths for weather icons
    const icons = {
        sun: <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 9c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000 1.41.996.996 0 001.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06z" fill="gold" />,
        cloud: <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#90A4AE" />,
        rain: <g><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#90A4AE" /><path d="M9 22l2-4M13 22l2-4" stroke="#4FC3F7" strokeWidth="2" strokeLinecap="round" /></g>,
        storm: <g><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#546E7A" /><path d="M11 22l2-4-1-1 3-3" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" /></g>,
        'cloud-sun': <g><circle cx="20" cy="8" r="4" fill="gold" /><path d="M17 10h-2.5C13.5 10 12 11.5 12 13.5S13.5 17 15 17h6c2.2 0 4-1.8 4-4s-1.8-4-4-4z" fill="#90A4AE" /></g>,
        'rain-night': <g><path d="M12 4a5 5 0 014.5 7.05A6 6 0 0012 16a6 6 0 00-6-6 6 6 0 00-6 6 6 6 0 006 6h10a4 4 0 000-8" fill="#455A64" /><path d="M9 24l2-4M13 24l2-4" stroke="#4FC3F7" strokeWidth="2" /></g>,
        'cloud-night': <g><circle cx="6" cy="6" r="3" fill="#F4F4F4" /><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#546E7A" /></g>
    };

    return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {icons[type] || icons.sun}
        </svg>
    );
};

const WeatherSidebar = memo(() => {
    // Fetch real weather data
    const { data: weather, isLoading } = useQuery({
        queryKey: ['weather', 'hanoi'],
        queryFn: () => getWeatherForecast(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    if (isLoading || !weather) {
        return (
            <aside className={styles.sidebar}>
                <div className={styles.weatherHeader}>
                    <div style={{ marginTop: 50 }}>Đang tải thời tiết...</div>
                </div>
            </aside>
        );
    }

    const { current, daily, hourly } = weather;

    // Determine gradient for hourly background based on isDay
    const hourlyBg = current.isDay ?
        'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)' : // Sunset/Day
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';  // Night

    return (
        <aside className={styles.sidebar}>
            {/* Header: Location & Current Temp */}
            <div className={styles.weatherHeader}>
                <div className={styles.topNav} style={{ justifyContent: 'center' }}>
                    <h2>Hà Nội</h2>
                </div>

                <div className={styles.currentWeather}>
                    <h1 className={styles.temp}>{current.temp}°</h1>
                    <span className={styles.timeLabel}>
                        {new Date().toLocaleTimeString('vi-VN', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                </div>
                <div className={styles.tempRange}>
                    Ngày {current.high}° • Đêm {current.low}°
                </div>
            </div>

            {/* 7-Day Forecast */}
            <div className={styles.forecastCard}>
                <div className={styles.cardHeader}>
                    <span>📅 DỰ BÁO 7 NGÀY</span>
                </div>
                <div className={styles.forecastList}>
                    {daily.map((item, index) => (
                        <div key={index} className={styles.forecastItem}>
                            <span className={styles.dayName}>{item.day}</span>
                            <div className={styles.iconWrapper}>
                                <WeatherIcon type={item.icon || 'sun'} size={20} />
                                {item.chance && <span className={styles.rainChance}>{item.chance}</span>}
                            </div>
                            <span className={styles.tempLow}>{item.low}°</span>
                            <div className={styles.tempBar}>
                                <div
                                    className={styles.tempFill}
                                    style={{
                                        left: `${Math.max(0, (item.low - 5) * 4)}%`,
                                        width: `${Math.max(0, (item.high - item.low) * 4)}%`
                                    }}
                                />
                            </div>
                            <span className={styles.tempHigh}>{item.high}°</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hourly Forecast */}
            <div className={styles.hourlySection} style={{ background: hourlyBg }}>
                <div className={styles.sectionTitle}>
                    <span>Hôm nay</span>
                    <span className={styles.dateLabel}>
                        {new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' })}
                    </span>
                </div>
                <div className={styles.hourlyList}>
                    {hourly.map((hour, idx) => (
                        <div key={idx} className={styles.hourlyItem}>
                            <span className={styles.hourTime}>{hour.time}</span>
                            <WeatherIcon type={hour.icon || 'sun'} size={24} />
                            <span className={styles.hourTemp}>{hour.temp}°</span>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
});

WeatherSidebar.displayName = 'WeatherSidebar';
export default WeatherSidebar;
