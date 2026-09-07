import fs from 'fs';

const filePath = '/home/cgarms/Sandbox/website/3D_models/clouds_work_20260903/grovea_loop_ccw/map.pcd';
const fd = fs.openSync(filePath, 'r');
const headerBuf = Buffer.alloc(2048);
fs.readSync(fd, headerBuf, 0, 2048, 0);
const headerStr = headerBuf.toString('utf8');

const marker = 'DATA binary\n';
const markerIdx = headerStr.indexOf(marker);
if (markerIdx === -1) {
  console.error('DATA binary not found');
  process.exit(1);
}

const headerEnd = markerIdx + marker.length;
console.log('Header length:', headerEnd);

const pointStride = 32; // x, y, z, intensity, nx, ny, nz, curvature (8 * 4)
const readBuf = Buffer.alloc(pointStride * 10);
fs.readSync(fd, readBuf, 0, pointStride * 10, headerEnd);

for (let i = 0; i < 5; i++) {
  const x = readBuf.readFloatLE(i * pointStride);
  const y = readBuf.readFloatLE(i * pointStride + 4);
  const z = readBuf.readFloatLE(i * pointStride + 8);
  const intensity = readBuf.readFloatLE(i * pointStride + 12);
  console.log('Point', i, ':', { x, y, z, intensity });
}

fs.closeSync(fd);
