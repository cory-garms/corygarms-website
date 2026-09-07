import fs from 'fs';

function convertPcdToGlb(inputPath, outputPath, targetPoints = 120000) {
  console.log(`\n--- Converting: ${inputPath} -> ${outputPath} ---`);
  const fd = fs.openSync(inputPath, 'r');
  const stat = fs.statSync(inputPath);
  const headerBuf = Buffer.alloc(1024);
  fs.readSync(fd, headerBuf, 0, 1024, 0);
  const headerStr = headerBuf.toString('utf8');

  const marker = 'DATA binary\n';
  const headerEnd = headerStr.indexOf(marker) + marker.length;

  const stride = 32; // x, y, z, intensity, nx, ny, nz, curvature
  const totalPoints = Math.floor((stat.size - headerEnd) / stride);
  const step = Math.ceil(totalPoints / targetPoints);
  const actualCount = Math.floor(totalPoints / step);
  console.log(`Source: ${totalPoints.toLocaleString()} pts | Subsampling step ${step} -> ${actualCount.toLocaleString()} pts`);

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

  // Center points around origin
  const centerX = sumX / dstIdx;
  const centerY = sumY / dstIdx;
  const centerZ = sumZ / dstIdx;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (let i = 0; i < dstIdx; i++) {
    positions[i * 3] -= centerX;
    positions[i * 3 + 1] -= centerY;
    positions[i * 3 + 2] -= centerZ;

    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const binBuffer = Buffer.from(positions.buffer, positions.byteOffset, positions.byteLength);

  const gltf = {
    asset: { version: "2.0", generator: "CoryGarms-Livox-Pipeline" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: "LivoxMid360_ForestScan", mesh: 0 }],
    meshes: [
      {
        name: "ForestGrovePoints",
        primitives: [
          {
            attributes: { POSITION: 0 },
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
      }
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: binBuffer.length,
        target: 34962
      }
    ],
    buffers: [
      {
        byteLength: binBuffer.length
      }
    ]
  };

  const jsonStr = JSON.stringify(gltf);
  const jsonPadding = (4 - (Buffer.byteLength(jsonStr, 'utf8') % 4)) % 4;
  const paddedJsonStr = jsonStr + ' '.repeat(jsonPadding);
  const jsonBuffer = Buffer.from(paddedJsonStr, 'utf8');

  const binPadding = (4 - (binBuffer.length % 4)) % 4;
  const paddedBinBuffer = binPadding > 0 
    ? Buffer.concat([binBuffer, Buffer.alloc(binPadding)]) 
    : binBuffer;

  const totalLength = 12 + 8 + jsonBuffer.length + 8 + paddedBinBuffer.length;
  const glbBuffer = Buffer.alloc(totalLength);

  glbBuffer.writeUInt32LE(0x46546C67, 0);
  glbBuffer.writeUInt32LE(2, 4);
  glbBuffer.writeUInt32LE(totalLength, 8);

  glbBuffer.writeUInt32LE(jsonBuffer.length, 12);
  glbBuffer.writeUInt32LE(0x4E4F534A, 16);
  jsonBuffer.copy(glbBuffer, 20);

  const binHeaderOffset = 20 + jsonBuffer.length;
  glbBuffer.writeUInt32LE(paddedBinBuffer.length, binHeaderOffset);
  glbBuffer.writeUInt32LE(0x004E4942, binHeaderOffset + 4);
  paddedBinBuffer.copy(glbBuffer, binHeaderOffset + 8);

  fs.writeFileSync(outputPath, glbBuffer);
  console.log(`Success: ${outputPath} (${(glbBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
}

// Convert Grove A and Grove B
convertPcdToGlb(
  '/home/cgarms/Sandbox/website/3D_models/clouds_work_20260903/grovea_loop_ccw/map.pcd',
  '/home/cgarms/Sandbox/website/public/models/livox_forest_grove.glb',
  120000
);

convertPcdToGlb(
  '/home/cgarms/Sandbox/website/3D_models/clouds_work_20260903/groveb_loop/map.pcd',
  '/home/cgarms/Sandbox/website/public/models/livox_grove_loop_b.glb',
  120000
);

convertPcdToGlb(
  '/home/cgarms/Sandbox/website/3D_models/clouds_work_20260903/grovec_loop/map.pcd',
  '/home/cgarms/Sandbox/website/public/models/livox_grove_loop_c.glb',
  120000
);
