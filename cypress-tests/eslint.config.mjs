import { defineConfig, globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import globals from 'globals'
import pluginCypress from 'eslint-plugin-cypress'
import pluginMocha from 'eslint-plugin-mocha'

export default defineConfig([
  // Pastas geradas pelos testes: não são código
  globalIgnores(['cypress/reports/', 'cypress/screenshots/', 'cypress/downloads/', 'cypress/videos/']),

  // Regras básicas de JavaScript para todos os arquivos
  {
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
  },

  // Arquivos de configuração do Cypress rodam no Node (usam require/module.exports)
  {
    files: ['cypress.*.config.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },

  // Testes e suporte: regras recomendadas do Cypress
  {
    files: ['cypress/**/*.js'],
    extends: [pluginCypress.configs.recommended],
  },

  // Nos testes: proibir it.only / describe.only esquecidos
  {
    files: ['cypress/e2e/**/*.cy.js'],
    plugins: { mocha: pluginMocha },
    rules: { 'mocha/no-exclusive-tests': 'error' },
  },
])