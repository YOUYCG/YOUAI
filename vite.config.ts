import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const GEM_KEY = process.env.GEMINI_API_KEY || '';
  const PH_KEY = process.env.PLACEHOLDER_API_KEY || '';

  return {
    define: {
      // Build-time inlines for multiple access paths
      'process.env.GEMINI_API_KEY': JSON.stringify(GEM_KEY),
      'process.env.PLACEHOLDER_API_KEY': JSON.stringify(PH_KEY),
      // Also expose via Vite's import.meta.env semantics so code reading VITE_* can work
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(GEM_KEY),
      'import.meta.env.VITE_PLACEHOLDER_API_KEY': JSON.stringify(PH_KEY),
      // Optional unprefixed for robustness
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(GEM_KEY),
      'import.meta.env.PLACEHOLDER_API_KEY': JSON.stringify(PH_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
