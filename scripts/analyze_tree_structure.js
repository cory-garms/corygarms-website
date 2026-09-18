import fs from 'fs';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';

const filePath = '/home/cgarms/Sandbox/website/3D_models/HUGE_OAK.pcd';
let content = fs.readFileSync(filePath);
const headerEnd = content.indexOf('DATA binary_compressed');
const header = content.slice(0, headerEnd).toString('utf8');
const fixedHeader = header.replace('FIELDS Intensity', 'FIELDS intensity');
const fixedBuffer = Buffer.concat([
  Buffer.from(fixedHeader, 'utf8'),
  content.slice(headerEnd)
]);

const arrayBuffer = fixedBuffer.buffer.slice(fixedBuffer.byteOffset, fixedBuffer.byteOffset + fixedBuffer.byteLength);
const loader = new PCDLoader();
const points = loader.parse(arrayBuffer);

const pos = points.geometry.attributes.position.array;
const count = points.geometry.attributes.position.count;

// Center of X, Y, Z
let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
let minZ = Infinity, maxZ = -Infinity;

for (let i = 0; i < count; i++) {
  const x = pos[i * 3];
  const y = pos[i * 3 + 1];
  const z = pos[i * 3 + 2];
  if (x < minX) minX = x; if (x > maxX) maxX = x;
  if (y < minY) minY = y; if (y > maxY) maxY = y;
  if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
}

console.log('Bounds:');
console.log('X:', minX, 'to', maxX, 'span:', maxX - minX);
console.log('Y:', minY, 'to', maxY, 'span:', maxY - minY);
console.log('Z:', minZ, 'to', maxZ, 'span:', maxZ - minZ);

// Spread at bottom (Z < 2) vs top (Z > 18)
let bottomCount = 0, topCount = 0;
let bottomMinX = Infinity, bottomMaxX = -Infinity;
let topMinX = Infinity, topMaxX = -Infinity;

for (let i = 0; i < count; i++) {
  const x = pos[i * 3];
  const z = pos[i * 3 + 2];
  if (z < 2) {
    bottomCount++;
    if (x < bottomMinX) bottomMinX = x;
    if (x > bottomMaxX) bottomMaxX = x;
  }
  if (z > 18) {
    topCount++;
    if (x < topMinX) topMinX = x;
    if (x > topMaxX) topMaxX = x;
  }
}

console.log(`Bottom (z < 2): ${bottomCount} pts, X spread: ${(bottomMaxX - bottomMinX).toFixed(2)} m`);
console.log(`Top (z > 18): ${topCount} pts, X spread: ${(topMaxX - topMinX).toFixed(2)} m`);
