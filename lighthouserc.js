/** @type {import('@lhci/cli').LhciConfig} */

const os = require('os');
const path = require('path');

const defaultTmpDir = path.join(process.cwd(), 'tmp-lhci-chrome');
process.env.TMPDIR = process.env.TMPDIR || defaultTmpDir;
process.env.TMP = process.env.TMP || defaultTmpDir;
process.env.TEMP = process.env.TEMP || defaultTmpDir;

const chromeTmpDir = path.join(process.env.TMPDIR, `lhci-chrome-profile-${Date.now()}-${process.pid}`);

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npx next start -p 3001',
      startServerReadyPattern: 'started server on|ready on|listening on|Local:',
      startServerReadyTimeout: 120000,
      url: ['http://localhost:3001/'],
      numberOfRuns: 1, // IMPORTANT: keep 1 on Windows

      settings: {
        chromeFlags: [
          '--headless=new',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-backgrounding-occluded-windows',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync',
          `--user-data-dir=${chromeTmpDir}`,
          '--disable-features=Translate,OptimizationHints,MediaRouter',
        ],

        // 🚀 CRITICAL FIX
        disableStorageReset: true,

        throttlingMethod: 'provided',

        // Skip crashing audits
        skipAudits: [
          'largest-contentful-paint-element',
          'lcp-lazy-loaded',
          'layout-shifts',
          'non-composited-animations',
          'prioritize-lcp-image',
        ],
      },
    },

    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],

        // must disable here too
        'largest-contentful-paint-element': 'off',
        'lcp-lazy-loaded': 'off',
        'layout-shifts': 'off',
        'non-composited-animations': 'off',
        'prioritize-lcp-image': 'off',
      },
    },

    upload: {
      target: 'filesystem',
      outputDir: './lhci-results',
    },
  },
};