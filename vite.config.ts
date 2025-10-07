import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    define: {
      // Inline env vars at build time so browser code can read them safely without referencing `process`
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
      'process.env.PLACEHOLDER_API_KEY': JSON.stringify(process.env.PLACEHOLDER_API_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
