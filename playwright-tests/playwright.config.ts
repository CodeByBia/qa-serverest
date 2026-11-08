import { defineConfig, devices } from '@playwright/test'

// API local para testes de API; front público para E2E (ver seção 2 do plano)
export default defineConfig({
  testDir: './tests',
  reporter: [['html', { open: 'never' }], ['list']],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'api', testMatch: /api\/.*\.spec\.ts/, use: { baseURL: 'http://localhost:3000' } },
    { name: 'e2e-chromium', testMatch: /e2e\/.*\.spec\.ts/, use: { ...devices['Desktop Chrome'], baseURL: 'https://front.serverest.dev' } },
    { name: 'e2e-firefox', testMatch: /e2e\/.*\.spec\.ts/, use: { ...devices['Desktop Firefox'], baseURL: 'https://front.serverest.dev' } }
  ]
})
