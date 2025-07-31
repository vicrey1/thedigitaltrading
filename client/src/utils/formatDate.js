// src/utils/formatDate.js
export const formatDate = (date, options = {}) => {
  const isMobile = window.innerWidth < 768;
  const defaultOptions = {
    month: isMobile ? 'short' : 'long',
    day: 'numeric',
    year: 'numeric'
  };
  
  return new Date(date).toLocaleDateString(undefined, {
    ...defaultOptions,
    ...options
  });
};

// Usage: formatDate(investment.startDate)