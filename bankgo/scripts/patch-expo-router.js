/**
 * Patch expo-router getDevServer only for versions < 6.x
 * expo-router 6+ already handles the RN 0.81 ESM default export correctly.
 */
const fs = require('fs');
const path = require('path');

const routerPkg = path.join(__dirname, '../node_modules/expo-router/package.json');
if (!fs.existsSync(routerPkg)) {
  console.log('[patch] expo-router not installed, skipping.');
  process.exit(0);
}

const version = JSON.parse(fs.readFileSync(routerPkg, 'utf8')).version;
const major = parseInt(version.split('.')[0], 10);

if (major >= 6) {
  console.log(`[patch] expo-router@${version} >= 6.x, no patch needed.`);
  process.exit(0);
}

const file = path.join(__dirname, '../node_modules/expo-router/build/getDevServer/index.native.js');
if (!fs.existsSync(file)) {
  console.log('[patch] getDevServer file not found, skipping.');
  process.exit(0);
}

const content = fs.readFileSync(file, 'utf8');
if (content.includes('typeof _mod')) {
  console.log('[patch] Already patched, skipping.');
  process.exit(0);
}

const patched = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDevServer = void 0;
const _mod = require('react-native/Libraries/Core/Devtools/getDevServer');
exports.getDevServer = typeof _mod === 'function' ? _mod : (_mod.default ?? _mod);
//# sourceMappingURL=index.native.js.map
`;

fs.writeFileSync(file, patched, 'utf8');
console.log(`[patch] expo-router@${version} getDevServer patched for RN 0.81+`);
