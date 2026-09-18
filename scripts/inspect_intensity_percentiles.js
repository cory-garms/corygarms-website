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

const intensities = Array.from(points.geometry.attributes.intensity.array);
// Subsample 50000 points to calculate percentiles quickly
const sample = [];
const step = Math.floor(intensities.length / 50000);
for (let i = 0; i < intensities.length; i += step) {
  sample.push(intensities[i]);
}
sample.sort((a, b) => a - b);

const p1 = sample[Math.floor(sample.length * 0.01)];
const p5 = sample[Math.floor(sample.length * 0.05)];
const p25 = sample[Math.floor(sample.length * 0.25)];
const p50 = sample[Math.floor(sample.length * 0.50)];
const p75 = sample[Math.floor(sample.length * 0.75)];
const p95 = sample[Math.floor(sample.length * 0.95)];
const p99 = sample[Math.floor(sample.length * 0.99)];
const max = sample[sample.length - 1];
const min = sample[0];

console.log('Intensity Percentiles:');
console.log({ min, p1, p5, p25, p50, p75, p95, p99, max });
