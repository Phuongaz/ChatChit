/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base colors
        background: {
          cream: '#f8f4f0',    // Nền chính
          paper: '#f4f0e8',    // Nền card nhạt hơn
          white: '#ffffff',    // Nền card trắng
        },
        
        // Text colors
        text: {
          primary: '#2c2c2c',   // Text chính
          secondary: '#666666', // Text phụ
          light: '#888888',    // Text nhạt
        },
        
        // Brand colors
        brand: {
          green: {
            light: '#8bc34a',   // Icon và switch
            DEFAULT: '#7cb342', // Hover
            dark: '#689f38',    // Active
          },
          blue: {
            light: '#64b5f6',   // Icon
            DEFAULT: '#42a5f5', // Hover
            dark: '#1e88e5',    // Active
          },
          orange: {
            light: '#ffa726',   // Icon
            DEFAULT: '#fb8c00', // Hover
            dark: '#f57c00',    // Active
          },
          yellow: {
            light: '#ffd54f',   // Icon
            DEFAULT: '#ffca28', // Hover
            dark: '#ffb300',    // Active
          },
        },

        // UI Elements
        ui: {
          card: '#faf7f2',      // Card background
          border: '#e8e4df',    // Border color
          divider: '#f0ece7',   // Divider lines
          hover: '#f5f2ed',     // Hover state
          active: '#efeae5',    // Active state
          focus: 'rgba(139, 195, 74, 0.2)', // Focus ring
        },

        // Status colors
        status: {
          success: '#8bc34a',
          warning: '#ffa726',
          error: '#ef5350',
          info: '#64b5f6',
        },

        // Switch colors
        switch: {
          on: '#8bc34a',      // Switch on state
          off: '#cccccc',     // Switch off state
          track: '#e0e0e0',   // Switch track
        },

        // Icon colors
        icon: {
          green: '#8bc34a',   // Settings, time
          blue: '#64b5f6',    // Face ID
          orange: '#ffa726',  // Notification, currency
          yellow: '#ffd54f',  // Upcoming
        },
      },
      borderRadius: {
        'card': '1rem',      // Card radius
        'button': '0.75rem', // Button radius
        'input': '0.5rem',   // Input radius
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'button': '0 2px 4px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
} 