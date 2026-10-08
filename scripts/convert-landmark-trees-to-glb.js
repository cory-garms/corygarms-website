import fs from 'fs';
import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';

const SPECIES = [
  {
    name: "SugarMaple",
    inputPath: '/home/cgarms/Sandbox/website/3D_models/SUGAR_MAPLE_CLEAN.pcd',
    outputPath: '/home/cgarms/Sandbox/website/public/models/sugar_maple.glb',
    targetPoints: 180000,
    intensityMax: 16000.0,
    meshName: "SugarMaple_Points",
    nodeName: "SugarMaple_Acer_Clean_PointCloud"
  },
  {
    name: "WhitePine",
    inputPath: "/home/cgarms/Sandbox/website/3D_models/WHITE_PINE_CLEAN.pcd",
    outputPath: "/home/cgarms/Sandbox/website/public/models/white_pine.glb",
    targetPoints: 180000,
    intensityMax: 16000.0,
    meshName: "WhitePine_Points",
    nodeName: "WhitePine_Pinus_Clean_PointCloud"
  },
  {
    name: "BurOak",
    inputPath: '/home/cgarms/Sandbox/website/3D_models/BUR_OAK_CLEAN.pcd',
    outputPath: '/home/cgarms/Sandbox/website/public/models/bur_oak.glb',
    targetPoints: 180000,
    intensityMax: 16000.0,
    meshName: "BurOak_Points",
    nodeName: "BurOak_Quercus_Clean_PointCloud"
  }
];

for (const spec of SPECIES) {
  console.log(`\n========================================`);
  console.log(`Converting: ${spec.name}`);
  console.log(`Source: ${spec.inputPath}`);
  console.log(`Output: ${spec.outputPath}`);
  console.log(`Target Points: ~${spec.targetPoints.toLocaleString()}`);
  console.log(`========================================\n`);

  const fileBuf = fs.readFileSync(spec.inputPath);
  const headerEnd = fileBuf.indexOf('DATA binary_compressed');
  if (headerEnd === -1) {
    throw new Error(`Could not find "DATA binary_compressed" in ${spec.inputPath}`);
  }

  const headerStr = fileBuf.slice(0, headerEnd).toString('utf8');
  const fixedHeaderStr = headerStr.replace('FIELDS Intensity', 'FIELDS intensity');
  const fixedBuffer = Buffer.concat([
    Buffer.from(fixedHeaderStr, 'utf8'),
    fileBuf.slice(headerEnd)
  ]);

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

  const step = Math.max(1, Math.ceil(totalPoints / spec.targetPoints));
  const actualCount = Math.floor(totalPoints / step);
  console.log(`Subsampling step: ${step} -> ${actualCount.toLocaleString()} points.`);

  // Find lateral centroid and base ground Z
  let sumX = 0, sumY = 0, minZ = Infinity;
  for (let i = 0; i < totalPoints; i += step) {
    sumX += rawPositions[i * 3];
    sumY += rawPositions[i * 3 + 1];
    if (rawPositions[i * 3 + 2] < minZ) minZ = rawPositions[i * 3 + 2];
  }
  const centerX = sumX / actualCount;
  const centerY = sumY / actualCount;
  const baseZ = minZ; // Trunk base at Y = 0

  console.log(`Centroids: X=${centerX.toFixed(2)}, Y=${centerY.toFixed(2)}, Base Z=${baseZ.toFixed(2)}`);

  const positions = new Float32Array(actualCount * 3);
  const colors = new Float32Array(actualCount * 3);

  let outMinX = Infinity, outMaxX = -Infinity;
  let outMinY = Infinity, outMaxY = -Infinity;
  let outMinZ = Infinity, outMaxZ = -Infinity;

  let dstIdx = 0;
  for (let i = 0; i < totalPoints; i += step) {
    if (dstIdx >= actualCount) break;

    const rawX = rawPositions[i * 3];
    const rawY = rawPositions[i * 3 + 1];
    const rawZ = rawPositions[i * 3 + 2];

    // Three.js coordinate mapping:
    // Three.js X = rawX - centerX (lateral centered)
    // Three.js Y = rawZ - baseZ   (vertical elevation, base grounded at 0)
    // Three.js Z = -(rawY - centerY) (depth centered)
    const tx = rawX - centerX;
    const ty = rawZ - baseZ;
    const tz = -(rawY - centerY);

    positions[dstIdx * 3] = tx;
    positions[dstIdx * 3 + 1] = ty;
    positions[dstIdx * 3 + 2] = tz;

    if (tx < outMinX) outMinX = tx; if (tx > outMaxX) outMaxX = tx;
    if (ty < outMinY) outMinY = ty; if (ty > outMaxY) outMaxY = ty;
    if (tz < outMinZ) outMinZ = tz; if (tz > outMaxZ) outMaxZ = tz;

    if (hasIntensity) {
      const rawI = rawIntensities[i];
      const normI = Math.min(1.0, Math.max(0.0, rawI / spec.intensityMax));
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

  console.log(`Transformed Bounds (Three.js):`);
  console.log(`  X (lateral): [${outMinX.toFixed(2)}, ${outMaxX.toFixed(2)}] (span: ${(outMaxX - outMinX).toFixed(2)}m)`);
  console.log(`  Y (height):  [${outMinY.toFixed(2)}, ${outMaxY.toFixed(2)}] (height: ${(outMaxY - outMinY).toFixed(2)}m)`);
  console.log(`  Z (depth):   [${outMinZ.toFixed(2)}, ${outMaxZ.toFixed(2)}] (span: ${(outMaxZ - outMinZ).toFixed(2)}m)`);

  const posBuffer = Buffer.from(positions.buffer, positions.byteOffset, positions.byteLength);
  const colorBuffer = Buffer.from(colors.buffer, colors.byteOffset, colors.byteLength);

  const posPadding = (4 - (posBuffer.length % 4)) % 4;
  const paddedPosBuffer = posPadding > 0 ? Buffer.concat([posBuffer, Buffer.alloc(posPadding)]) : posBuffer;

  const colorPadding = (4 - (colorBuffer.length % 4)) % 4;
  const paddedColorBuffer = colorPadding > 0 ? Buffer.concat([colorBuffer, Buffer.alloc(colorPadding)]) : colorBuffer;

  const combinedBinBuffer = Buffer.concat([paddedPosBuffer, paddedColorBuffer]);

  const gltf = {
    asset: {
      version: "2.0",
      generator: "CoryGarms-TerrestrialLiDAR-Pipeline"
    },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: spec.nodeName, mesh: 0 }],
    meshes: [{
      name: spec.meshName,
      primitives: [{
        attributes: {
          POSITION: 0,
          COLOR_0: 1
        },
        mode: 0
      }]
    }],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126,
        count: dstIdx,
        type: "VEC3",
        max: [outMaxX, outMaxY, outMaxZ],
        min: [outMinX, outMinY, outMinZ]
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126,
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
        target: 34962
      },
      {
        buffer: 0,
        byteOffset: paddedPosBuffer.length,
        byteLength: colorBuffer.length,
        target: 34962
      }
    ],
    buffers: [{ byteLength: combinedBinBuffer.length }]
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

  glbBuffer.writeUInt32LE(0x46546C67, 0);
  glbBuffer.writeUInt32LE(2, 4);
  glbBuffer.writeUInt32LE(totalLength, 8);

  glbBuffer.writeUInt32LE(jsonBuffer.length, 12);
  glbBuffer.writeUInt32LE(0x4E4F534A, 16);
  jsonBuffer.copy(glbBuffer, 20);

  const binHeaderOffset = 20 + jsonBuffer.length;
  glbBuffer.writeUInt32LE(finalBinBuffer.length, binHeaderOffset);
  glbBuffer.writeUInt32LE(0x004E4942, binHeaderOffset + 4);
  finalBinBuffer.copy(glbBuffer, binHeaderOffset + 8);

  fs.writeFileSync(spec.outputPath, glbBuffer);
  console.log(`Successfully created GLB: ${spec.outputPath}`);
  console.log(`File Size: ${(glbBuffer.length / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Points: ${dstIdx.toLocaleString()}`);
}
