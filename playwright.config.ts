import { defineConfig, devices } from '@playwright/test';

// En la nube de GitHub se usa el Chromium de Playwright; en otra máquina se puede indicar uno con PW_CHROME
const executablePath = process.env.PW_CHROME || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'es-PY',
    timezoneId: 'America/Asuncion',
    serviceWorkers: 'block',
    launchOptions: { executablePath },
  },
  webServer: {
    command: 'npx vite build --mode demo && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'celular', use: { ...devices['Pixel 7'], launchOptions: { executablePath } } },
    { name: 'pc', use: { viewport: { width: 1366, height: 860 }, launchOptions: { executablePath } } },
  ],
});
