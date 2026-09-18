import fs from 'fs';
import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';

const inputPath = '/home/cgarms/Sandbox/website/3D_models/HUGE_OAK_CLEAN.pcd';
const outputPath = '/home/cgarms/Sandbox/website/public/models/huge_oak.glb';
const targetPoints = 180000;

console.log(`\n========================================`);
console.log(`Converting: ${inputPath}`);
console.log(`Target Output: ${outputPath}`);
console.log(`Target Points: ~${targetPoints.toLocaleString()}`);
console.log(`========================================\n`);

console.log('Reading PCD file into memory...');
const fileBuf = fs.readFileSync(inputPath);
console.log(`Read ${fileBuf.length.toLocaleString()} bytes.`);

// Standardize PCD header field name from "Intensity" to "intensity" for Three.js loader
const headerEnd = fileBuf.indexOf('DATA binary_compressed');
if (headerEnd === -1) {
  throw new Error('Could not find "DATA binary_compressed" in PCD file');
}

const headerStr = fileBuf.slice(0, headerEnd).toString('utf8');
const fixedHeaderStr = headerStr.replace('FIELDS Intensity', 'FIELDS intensity');
const fixedBuffer = Buffer.concat([
  Buffer.from(fixedHeaderStr, 'utf8'),
  fileBuf.slice(headerEnd)
]);

console.log('Parsing binary_compressed PCD data with LZF decompression...');
const arrayBuffer = fixedBuffer.buffer.slice(
  fixedBuffer.byteOffset,
  fixedBuffer.byteOffset + fixedBuffer.byteLength
);

const loader = new PCDLoader();
const points = loader.parse(arrayBuffer);

const totalPoints = points.geometry.attributes.position.count;
console.log(`Loaded ${totalPoints.toLocaleString()} source points.`);

const rawPositions = points.geometry.attributes.position.array;
const hasIntensity = !!points.geometry.attributes.intensity;
const rawIntensities = hasIntensity ? points.geometry.attributes.intensity.array : null;

// Determine subsampling step
const step = Math.max(1, Math.ceil(totalPoints / targetPoints));
const actualCount = Math.floor(totalPoints / step);
console.log(`Subsampling step: ${step} -> ${actualCount.toLocaleString()} points.`);

// Transform coordinates into Three.js system:
// In PCD: X is lateral, Y is horizontal depth, Z is elevation (vertical)
// In Three.js: Y is UP, X is lateral, Z is depth
let sumX = 0, sumY = 0, sumZ = 0;
for (let i = 0; i < totalPoints; i += step) {
  sumX += rawPositions[i * 3];
  sumY += rawPositions[i * 3 + 1];
  sumZ += rawPositions[i * 3 + 2];
}
const centerX = sumX / actualCount;
const centerY = sumY / actualCount;
const centerZ = sumZ / actualCount;

console.log(`Centroids: X=${centerX.toFixed(2)}, Y=${centerY.toFixed(2)}, Z=${centerZ.toFixed(2)}`);

const positions = new Float32Array(actualCount * 3);
const colors = new Float32Array(actualCount * 3);

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
let minZ = Infinity, maxZ = -Infinity;

let dstIdx = 0;
const intensityMax = 16000.0; // 95th-99th percentile clamp for contrast

for (let i = 0; i < totalPoints; i += step) {
  if (dstIdx >= actualCount) break;

  const rawX = rawPositions[i * 3];
  const rawY = rawPositions[i * 3 + 1];
  const rawZ = rawPositions[i * 3 + 2];

  // Coordinate mapping:
  // Three.js X = rawX - centerX
  // Three.js Y = rawZ - centerZ (vertical elevation)
  // Three.js Z = -(rawY - centerY) (depth)
  const tx = rawX - centerX;
  const ty = rawZ - centerZ;
  const tz = -(rawY - centerY);

  positions[dstIdx * 3] = tx;
  positions[dstIdx * 3 + 1] = ty;
  positions[dstIdx * 3 + 2] = tz;

  if (tx < minX) minX = tx; if (tx > maxX) maxX = tx;
  if (ty < minY) minY = ty; if (ty > maxY) maxY = ty;
  if (tz < minZ) minZ = tz; if (tz > maxZ) maxZ = tz;

  // Normalized intensity for COLOR_0
  if (hasIntensity) {
    const rawI = rawIntensities[i];
    const normI = Math.min(1.0, Math.max(0.0, rawI / intensityMax));
    colors[dstIdx * 3] = normI;
    colors[dstIdx * 3 + 1] = normI;
    colors[dstIdx * 3 + 2] = normI;
  } else {
    colors[dstIdx * 3] = 1.0;
    colors[dstIdx * 3 + 1] = 1.0;
    colors[dstIdx * 3 + 2] = 1.0;
  }

  dstIdx++;
}

console.log(`Transformed Bounding Box:`);
console.log(`  X: [${minX.toFixed(2)}, ${maxX.toFixed(2)}] (span: ${(maxX - minX).toFixed(2)}m)`);
console.log(`  Y (Elevation): [${minY.toFixed(2)}, ${maxY.toFixed(2)}] (height: ${(maxY - minY).toFixed(2)}m)`);
console.log(`  Z: [${minZ.toFixed(2)}, ${maxZ.toFixed(2)}] (span: ${(maxZ - minZ).toFixed(2)}m)`);

// Construct binary glTF (GLB 2.0)
const posBuffer = Buffer.from(positions.buffer, positions.byteOffset, positions.byteLength);
const colorBuffer = Buffer.from(colors.buffer, colors.byteOffset, colors.byteLength);

// 4-byte align position buffer
const posPadding = (4 - (posBuffer.length % 4)) % 4;
const paddedPosBuffer = posPadding > 0 ? Buffer.concat([posBuffer, Buffer.alloc(posPadding)]) : posBuffer;

// 4-byte align color buffer
const colorPadding = (4 - (colorBuffer.length % 4)) % 4;
const paddedColorBuffer = colorPadding > 0 ? Buffer.concat([colorBuffer, Buffer.alloc(colorPadding)]) : colorBuffer;

const combinedBinBuffer = Buffer.concat([paddedPosBuffer, paddedColorBuffer]);

const gltf = {
  asset: {
    version: "2.0",
    generator: "CoryGarms-TerrestrialLiDAR-Pipeline"
  },
  scene: 0,
  scenes: [
    {
      nodes: [0]
    }
  ],
  nodes: [
    {
      name: "HugeOak_Quercus_Clean_PointCloud",
      mesh: 0
    }
  ],
  meshes: [
    {
      name: "HugeOak_Points",
      primitives: [
        {
          attributes: {
            POSITION: 0,
            COLOR_0: 1
          },
          mode: 0 // 0 = POINTS
        }
      ]
    }
  ],
  accessors: [
    {
      bufferView: 0,
      byteOffset: 0,
      componentType: 5126, // FLOAT
      count: dstIdx,
      type: "VEC3",
      max: [maxX, maxY, maxZ],
      min: [minX, minY, minZ]
    },
    {
      bufferView: 1,
      byteOffset: 0,
      componentType: 5126, // FLOAT
      count: dstIdx,
      type: "VEC3",
      max: [1.0, 1.0, 1.0],
      min: [0.0, 0.0, 0.0]
    }
  ],
  bufferViews: [
    {
      buffer: 0,
      byteOffset: 0,
      byteLength: posBuffer.length,
      target: 34962 // ARRAY_BUFFER
    },
    {
      buffer: 0,
      byteOffset: paddedPosBuffer.length,
      byteLength: colorBuffer.length,
      target: 34962 // ARRAY_BUFFER
    }
  ],
  buffers: [
    {
      byteLength: combinedBinBuffer.length
    }
  ]
};

const jsonStr = JSON.stringify(gltf);
const jsonPadding = (4 - (Buffer.byteLength(jsonStr, 'utf8') % 4)) % 4;
const paddedJsonStr = jsonStr + ' '.repeat(jsonPadding);
const jsonBuffer = Buffer.from(paddedJsonStr, 'utf8');

const binPadding = (4 - (combinedBinBuffer.length % 4)) % 4;
const finalBinBuffer = binPadding > 0 
  ? Buffer.concat([combinedBinBuffer, Buffer.alloc(binPadding)]) 
  : combinedBinBuffer;

const totalLength = 12 + 8 + jsonBuffer.length + 8 + finalBinBuffer.length;
const glbBuffer = Buffer.alloc(totalLength);

// GLB Header
glbBuffer.writeUInt32LE(0x46546C67, 0); // 'glTF'
glbBuffer.writeUInt32LE(2, 4);          // version 2
glbBuffer.writeUInt32LE(totalLength, 8); // total file length

// JSON Chunk Header
glbBuffer.writeUInt32LE(jsonBuffer.length, 12);
glbBuffer.writeUInt32LE(0x4E4F534A, 16); // 'JSON'
jsonBuffer.copy(glbBuffer, 20);

// BIN Chunk Header
const binHeaderOffset = 20 + jsonBuffer.length;
glbBuffer.writeUInt32LE(finalBinBuffer.length, binHeaderOffset);
glbBuffer.writeUInt32LE(0x004E4942, binHeaderOffset + 4); // 'BIN\0'
finalBinBuffer.copy(glbBuffer, binHeaderOffset + 8);

fs.writeFileSync(outputPath, glbBuffer);
console.log(`\nSuccessfully created GLB: ${outputPath}`);
console.log(`Output File Size: ${(glbBuffer.length / (1024 * 1024)).toFixed(2)} MB`);
console.log(`Point count: ${dstIdx.toLocaleString()}`);
