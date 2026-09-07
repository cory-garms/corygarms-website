import fs from 'fs';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill FileReader and window for Three.js in Node
if (typeof window === 'undefined') {
  global.window = {};
}
if (typeof global.FileReader === 'undefined') {
  global.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then(buf => {
        this.result = buf;
        if (this.onload) this.onload({ target: this });
      });
    }
  };
}

const inputPath = '/home/cgarms/Sandbox/website/3D_models/clouds_work_20260903/grovea_loop_ccw/map.pcd';
const outputPath = '/home/cgarms/Sandbox/website/public/models/forest_grove_survey.glb';

console.log('Reading PCD header...');
const fd = fs.openSync(inputPath, 'r');
const stat = fs.statSync(inputPath);
const headerBuf = Buffer.alloc(1024);
fs.readSync(fd, headerBuf, 0, 1024, 0);
const headerStr = headerBuf.toString('utf8');

const marker = 'DATA binary\n';
const headerEnd = headerStr.indexOf(marker) + marker.length;

const stride = 32; // x, y, z, intensity, nx, ny, nz, curvature
const totalPoints = Math.floor((stat.size - headerEnd) / stride);
console.log(`Total source points in PCD: ${totalPoints.toLocaleString()}`);

// Target ~110,000 points
const targetPoints = 110000;
const step = Math.ceil(totalPoints / targetPoints);
const actualCount = Math.floor(totalPoints / step);
console.log(`Subsampling with step ${step} -> ${actualCount.toLocaleString()} points`);

const positions = new Float32Array(actualCount * 3);

const chunkSize = 50000;
const chunkBuf = Buffer.alloc(chunkSize * stride);
let srcIdx = 0;
let dstIdx = 0;

let sumX = 0, sumY = 0, sumZ = 0;

while (srcIdx < totalPoints && dstIdx < actualCount) {
  const pointsToRead = Math.min(chunkSize, totalPoints - srcIdx);
  fs.readSync(fd, chunkBuf, 0, pointsToRead * stride, headerEnd + srcIdx * stride);
  
  for (let i = 0; i < pointsToRead; i += step) {
    if (dstIdx >= actualCount) break;
    const offset = i * stride;
    const lx = chunkBuf.readFloatLE(offset);
    const ly = chunkBuf.readFloatLE(offset + 4);
    const lz = chunkBuf.readFloatLE(offset + 8);

    // Three.js coords: Y is UP (lz), Z is horizontal (ly), X is horizontal (lx)
    const tx = lx;
    const ty = lz;
    const tz = -ly;

    positions[dstIdx * 3] = tx;
    positions[dstIdx * 3 + 1] = ty;
    positions[dstIdx * 3 + 2] = tz;

    sumX += tx;
    sumY += ty;
    sumZ += tz;

    dstIdx++;
  }

  srcIdx += pointsToRead;
}
fs.closeSync(fd);

console.log(`Extracted ${dstIdx.toLocaleString()} points.`);

// Center coordinates
const centerX = sumX / dstIdx;
const centerY = sumY / dstIdx;
const centerZ = sumZ / dstIdx;

let minHeight = Infinity, maxHeight = -Infinity;

for (let i = 0; i < dstIdx; i++) {
  positions[i * 3] -= centerX;
  positions[i * 3 + 1] -= centerY;
  positions[i * 3 + 2] -= centerZ;

  const y = positions[i * 3 + 1];
  if (y < minHeight) minHeight = y;
  if (y > maxHeight) maxHeight = y;
}

console.log(`Elevation range: [${minHeight.toFixed(2)}m, ${maxHeight.toFixed(2)}m] (Canopy height: ${(maxHeight - minHeight).toFixed(2)}m)`);

// Create THREE.Points geometry
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Export mesh using Mesh with points primitive or simple indices
const material = new THREE.MeshBasicMaterial({ color: 0x10b981 });
// GLTFExporter best supports meshes; a mesh with position buffer
const meshObject = new THREE.Mesh(geometry, material);
meshObject.name = 'LivoxForestGrove';

console.log('Exporting to GLB via GLTFExporter...');
const exporter = new GLTFExporter();
exporter.parse(
  meshObject,
  (glbBuffer) => {
    fs.writeFileSync(outputPath, Buffer.from(glbBuffer));
    const outStat = fs.statSync(outputPath);
    console.log(`Success! Created ${outputPath} (${(outStat.size / (1024 * 1024)).toFixed(2)} MB)`);
    process.exit(0);
  },
  (err) => {
    console.error('Export error:', err);
    process.exit(1);
  },
  { binary: true }
);
