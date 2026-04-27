const fs = require('fs');
const path = require('path');

const targets = [
  'node_modules/chrome-launcher/dist/chrome-launcher.js',
  'node_modules/lighthouse/node_modules/chrome-launcher/dist/chrome-launcher.js',
];

const oldSnippet = `const rmSync = this.fs.rmSync || this.fs.rmdirSync;
        rmSync(this.userDataDir, { recursive: true, force: true, maxRetries: 10 });`;

const newSnippet = `const rmSync = this.fs.rmSync || this.fs.rmdirSync;
        const removeOpts = { recursive: true, force: true, maxRetries: 10, retryDelay: 200 };
        const maxCleanupTime = 5000;
        const cleanupStart = Date.now();
        while (true) {
            try {
                rmSync(this.userDataDir, removeOpts);
                break;
            }
            catch (err) {
                if (err.code !== 'EPERM' || Date.now() - cleanupStart > maxCleanupTime) {
                    throw err;
                }
                const waitUntil = Date.now() + 150;
                while (Date.now() < waitUntil) {
                    // Busy wait to allow Windows to release the handle.
                }
            }
        }`;

for (const relativePath of targets) {
  const filePath = path.join(__dirname, '..', relativePath);
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(newSnippet)) {
    continue;
  }
  if (!content.includes(oldSnippet)) {
    console.warn(`Skipping patch for ${relativePath}: expected code block not found.`);
    continue;
  }

  fs.writeFileSync(filePath, content.replace(oldSnippet, newSnippet), 'utf8');
  console.log(`Patched ${relativePath}`);
}
