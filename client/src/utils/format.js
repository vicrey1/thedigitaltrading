/**
 * Format a number as currency with $ symbol and thousands separators
 * @param {number} value - The number to format
 * @param {number} [decimals=2] - Number of decimal places to show
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, decimals = 2) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
};

/**
 * Format a number with thousands separators
 * @param {number} value - The number to format
 * @param {number} [decimals=0] - Number of decimal places to show
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 0) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return '0';
    }
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
};