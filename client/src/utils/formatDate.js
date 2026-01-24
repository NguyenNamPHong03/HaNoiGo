/**
 * Format date thành relative time (Hôm nay, Hôm qua, X ngày trước...)
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    // Reset hours to compare only dates
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = nowOnly - dateOnly;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return date.toLocaleDateString('vi-VN');
};

/**
 * Format date thành absolute time với ngày giờ chính xác
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted absolute date and time (e.g., "24/01/2026 lúc 21:30")
 */
export const formatAbsoluteDateTime = (dateString) => {
    const date = new Date(dateString);

    const dateOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    };

    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
    };

    const formattedDate = date.toLocaleDateString('vi-VN', dateOptions);
    const formattedTime = date.toLocaleTimeString('vi-VN', timeOptions);

    return `${formattedDate} lúc ${formattedTime}`;
};

export default formatDate;
