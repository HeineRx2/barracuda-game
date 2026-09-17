/**
 * Build Three.js IIFE global bundle for Barracuda
 * Creates libs/three.min.js + libs/GLTFLoader.js + libs/Water.js + libs/Sky.js
 */

import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { existsSync, mkdirSync } from 'fs';

if (!existsSync('libs')) mkdirSync('libs');

const builds = [
  {
    input: 'three_bundle_entry.js',
    output: { file: 'libs/three.min.js', format: 'iife', name: '__ThreeBundleInit' },
    plugins: [nodeResolve(), terser({ compress: { drop_console: false } })],
    name: 'Three.js + addons bundle',
  },
];

for (const cfg of builds) {
  console.log(`Building ${cfg.name}...`);
  const bundle = await rollup({
    input: cfg.input,
    plugins: cfg.plugins,
  });
  await bundle.write(cfg.output);
  await bundle.close();
  console.log(`  ✓ Written to ${cfg.output.file}`);
}

console.log('\nAll done! Run: npx vite');
