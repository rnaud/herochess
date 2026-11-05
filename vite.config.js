import { defineConfig } from 'vite';
import {offlineApp} from './scripts/pwa.js';
export default defineConfig({ base: './', plugins:[offlineApp()], build:{chunkSizeWarningLimit:600} });
