/** @type {import('tailwindcss').Config} */
export default {
  // CRITICAL: Configure the 'content' paths for a standard Vite/React project.
  // This tells Tailwind to scan all files inside the 'src' directory 
  // with extensions .js, .jsx, .ts, or .tsx for utility classes.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // We use 'extend' to add new values without removing Tailwind's defaults.
    extend: {
      // Custom color palette for "Floating Theraphy"
      colors: {
        'theta-blue': {
          // Primary color (Darkest Blue: #035C84) - Used for buttons, main text
          DEFAULT: '#035C84', 

          // Medium Dark Blue (#0873A1) - Used for hover states, tagline text
          dark: '#0873A1',    

          // Medium Light Blue (#2DA0CC) - Used for borders, accent links
          medium: '#2DA0CC',  

          // Lightest Blue (#94CCE7) - Used for page background
          light: '#94CCE7',   
        },
        // Optionally, define a clear white for card backgrounds
        'white': '#FFFFFF',
      },
      // Custom font families for a beautiful therapy center website
      fontFamily: {
        // Primary font for body text - clean and readable
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        
        // Elegant serif font for headings and titles
        serif: ['Playfair Display', 'Georgia', 'serif'],
        
        // Modern sans-serif for UI elements and buttons
        display: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}