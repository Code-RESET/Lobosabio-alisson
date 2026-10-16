// Análisis estático (npm run lint): detecta variables no definidas, código sin usar y errores comunes.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', '_site/', 'index.html', 'sw.js', 'version.json', 'test-results/'] },
  js.configs.recommended,
  {
    files: ['src/js/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser } },
    rules: {
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      eqeqeq: ['error', 'smart'],
      'no-implicit-globals': 'error',
      'no-shadow': ['warn', { builtinGlobals: false }],
      'prefer-const': 'warn',
      'no-var': 'error'
    }
  },
  { files: ['src/sw.js'], languageOptions: { ecmaVersion: 'latest', sourceType: 'script', globals: { ...globals.serviceworker } } },
  { files: ['scripts/**/*.mjs', 'tests/**/*.mjs', '*.config.js'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } } },
  // En las pruebas de punta a punta, el código dentro de page.evaluate() corre en el navegador.
  { files: ['tests/e2e/**/*.mjs'], languageOptions: { globals: { ...globals.node, ...globals.browser } } }
];
