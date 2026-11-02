import { defineConfig } from '@playwright/test';
export default defineConfig({
 workers:process.env.CI?1:undefined,
 testDir:'./tests', testMatch:'**/*.spec.js', timeout:30000,
 use:{baseURL:'http://127.0.0.1:5197',headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||undefined},
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5197 --strictPort',url:'http://127.0.0.1:5197',reuseExistingServer:!process.env.CI},
});
