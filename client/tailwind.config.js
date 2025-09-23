module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cryptocurrency-focused color palette
        crypto: {
          orange: '#F7931A', // Bitcoin orange
          'orange-dark': '#E8851C',
          green: '#00D4AA', // Crypto green
          'green-dark': '#00B894',
          blue: '#627EEA', // Ethereum blue
        },
        // Legacy gold colors (to be phased out)
        gold: '#F7931A', // Replaced with crypto orange
        goldDark: '#E8851C',
        dark: '#0F0F0F',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Playfair Display', 'ui-serif', 'Georgia'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
        'crypto-glow': '0 0 20px rgba(247, 147, 26, 0.3)',
        'profit-glow': '0 0 20px rgba(16, 185, 129, 0.3)',
        'loss-glow': '0 0 20px rgba(239, 68, 68, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
      },
      borderColor: {
        gold: '#F7931A', // Updated to crypto orange
      },
      animation: {
        'pulse-crypto': 'pulse-crypto 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-crypto': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(247, 147, 26, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(247, 147, 26, 0.6)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}