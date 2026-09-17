/**
 * Barracuda Three.js bundle entry
 * Exports THREE global + needed addons to window.THREE
 */
import * as _THREE from 'three';
import { Clock, Timer, PMREMGenerator } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// ES module namespace objects are frozen — spread into mutable object
const THREE = Object.assign({}, _THREE);

// Ensure Clock is present (deprecated in r185 but still in bundle)
THREE.Clock = Clock;
THREE.Timer = Timer;
THREE.PMREMGenerator = PMREMGenerator;

// Addons expected by drone3d.js
THREE.GLTFLoader = GLTFLoader;
THREE.Water = Water;
THREE.Sky = Sky;

window.THREE = THREE;

console.log('[Barracuda] THREE.js r' + THREE.REVISION + ' ready. Clock:', !!THREE.Clock, 'Water:', !!THREE.Water, 'Sky:', !!THREE.Sky);
