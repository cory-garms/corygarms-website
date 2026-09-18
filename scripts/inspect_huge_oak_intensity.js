import fs from 'fs';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';

const filePath = '/home/cgarms/Sandbox/website/3D_models/HUGE_OAK.pcd';
let content = fs.readFileSync(filePath);

// Replace "FIELDS Intensity" with "FIELDS intensity"
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

console.log('Attributes with fixed header:', Object.keys(points.geometry.attributes));
if (points.geometry.attributes.intensity) {
  const intensities = points.geometry.attributes.intensity.array;
  let minI = Infinity, maxI = -Infinity;
  for (let i = 0; i < intensities.length; i++) {
    if (intensities[i] < minI) minI = intensities[i];
    if (intensities[i] > maxI) maxI = intensities[i];
  }
  console.log(`Intensity range: [${minI}, ${maxI}], points: ${intensities.length}`);
}
