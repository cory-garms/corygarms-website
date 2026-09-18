import fs from 'fs';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';

const filePath = '/home/cgarms/Sandbox/website/3D_models/HUGE_OAK.pcd';
const fileBuf = fs.readFileSync(filePath);
const arrayBuffer = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);

const loader = new PCDLoader();
const points = loader.parse(arrayBuffer);

console.log('Attributes:', Object.keys(points.geometry.attributes));
if (points.geometry.attributes.intensity) {
  const intensities = points.geometry.attributes.intensity.array;
  let minI = Infinity, maxI = -Infinity;
  for (let i = 0; i < Math.min(intensities.length, 100000); i++) {
    if (intensities[i] < minI) minI = intensities[i];
    if (intensities[i] > maxI) maxI = intensities[i];
  }
  console.log('Intensity sample min/max:', minI, maxI);
  console.log('Sample intensities:', intensities.slice(0, 10));
}
