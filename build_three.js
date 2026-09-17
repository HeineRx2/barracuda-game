const fs = require('fs');
const path = require('path');

// Create libs dir
if (!fs.existsSync('libs')) fs.mkdirSync('libs');

// Read the Three.js module version
const src = fs.readFileSync('node_modules/three/build/three.module.min.js', 'utf8');
const version = JSON.parse(fs.readFileSync('node_modules/three/package.json', 'utf8')).version;

// Build a UMD/global-scope wrapper:
// The module exports like: export { Scene, ... }; 
// We convert export statements to global THREE assignments
const umd = `/* Three.js ${version} — global (window.THREE) build for Barracuda */
(function(global) {
  'use strict';
  // ---- Three.js module source start ----
  const __THREE_EXPORTS__ = {};
  const __define__ = (function() {
    // Intercept exports
    return {
      set: function(k, v) { __THREE_EXPORTS__[k] = v; }
    };
  })();
  // Patch: replace ES module export syntax with assignments to __THREE_EXPORTS__
${src
  .replace(/^export\s*\{([^}]+)\}\s*;?\s*$/m, (_, names) => {
    return names.split(',').map(n => {
      const trimmed = n.trim().replace(/\s+as\s+\S+/, '');
      return `  __THREE_EXPORTS__['${trimmed}'] = ${trimmed};`;
    }).join('\n');
  })
}
  if (typeof global.THREE === 'undefined') global.THREE = {};
  Object.assign(global.THREE, __THREE_EXPORTS__);
})(typeof globalThis !== 'undefined' ? globalThis : window);
`;

fs.writeFileSync('libs/three.min.js', umd, 'utf8');
console.log('Done! libs/three.min.js created (' + Math.round(umd.length / 1024) + ' KB)');
