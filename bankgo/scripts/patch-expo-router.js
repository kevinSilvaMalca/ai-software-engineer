/**
 * Patch expo-router's getDevServer for RN 0.81+ compatibility.
 * RN 0.81+ exports getDevServer as ESM default, but expo-router 4.x
 * does a plain require() expecting a function directly.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '../node_modules/expo-router/build/getDevServer/index.native.js'
);

if (!fs.existsSync(file)) {
  console.log('[patch] expo-router getDevServer file not found, skipping.');
  process.exit(0);
}

const content = fs.readFileSync(file, 'utf8');

if (content.includes('typeof _mod')) {
  console.log('[patch] expo-router getDevServer already patched, skipping.');
  process.exit(0);
}

const patched = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDevServer = void 0;
// RN 0.81+ exports getDevServer as ESM default — handle both cases
const _mod = require('react-native/Libraries/Core/Devtools/getDevServer');
exports.getDevServer = typeof _mod === 'function' ? _mod : (_mod.default ?? _mod);
//# sourceMappingURL=index.native.js.map
`;

fs.writeFileSync(file, patched, 'utf8');
console.log('[patch] expo-router getDevServer patched for RN 0.81+');
