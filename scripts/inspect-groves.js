import fs from 'fs';

const files = [
  'grovea_loop_ccw',
  'groveb_loop',
  'grovec_loop'
];

for (const name of files) {
  const filePath = `/home/cgarms/Sandbox/website/3D_models/clouds_work_20260903/${name}/map.pcd`;
  const stat = fs.statSync(filePath);
  const fd = fs.openSync(filePath, 'r');
  const headerBuf = Buffer.alloc(1024);
  fs.readSync(fd, headerBuf, 0, 1024, 0);
  const headerStr = headerBuf.toString('utf8');
  
  const marker = 'DATA binary\n';
  const headerEnd = headerStr.indexOf(marker) + marker.length;

  // Let's sample 10,000 points to check bounds
  const stride = 32;
  const sampleCount = 20000;
  const totalPoints = Math.floor((stat.size - headerEnd) / stride);
  const step = Math.floor(totalPoints / sampleCount);

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  let minInt = Infinity, maxInt = -Infinity;

  const buf = Buffer.alloc(stride);
  for (let i = 0; i < sampleCount; i++) {
    const offset = headerEnd + (i * step) * stride;
    fs.readSync(fd, buf, 0, stride, offset);
    const x = buf.readFloatLE(0);
    const y = buf.readFloatLE(4);
    const z = buf.readFloatLE(8);
    const intensity = buf.readFloatLE(12);

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
    if (intensity < minInt) minInt = intensity;
    if (intensity > maxInt) maxInt = intensity;
  }
  fs.closeSync(fd);

  console.log(`=== ${name} ===`);
  console.log(`Total Points: ${totalPoints.toLocaleString()}`);
  console.log(`X: [${minX.toFixed(2)}, ${maxX.toFixed(2)}] (size: ${(maxX - minX).toFixed(2)}m)`);
  console.log(`Y: [${minY.toFixed(2)}, ${maxY.toFixed(2)}] (size: ${(maxY - minY).toFixed(2)}m)`);
  console.log(`Z: [${minZ.toFixed(2)}, ${maxZ.toFixed(2)}] (size: ${(maxZ - minZ).toFixed(2)}m)`);
  console.log(`Intensity: [${minInt.toFixed(0)}, ${maxInt.toFixed(0)}]`);
}
