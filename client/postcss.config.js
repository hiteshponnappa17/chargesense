import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { fileURLToPath } from 'node:url';

// Resolve the Tailwind config by absolute path so PostCSS finds it regardless of
// which working directory `vite`/`tsc` is launched from (repo root vs. client/).
const config = fileURLToPath(new URL('./tailwind.config.js', import.meta.url));

export default {
  plugins: [tailwindcss({ config }), autoprefixer()],
};
