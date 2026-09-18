import fs from 'fs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const filePath = '/home/cgarms/Sandbox/website/public/models/huge_oak.glb';
const buf = fs.readFileSync(filePath);
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const loader = new GLTFLoader();
loader.parse(
  arrayBuffer,
  '',
  (gltf) => {
    console.log('GLTF loaded successfully!');
    let pointCount = 0;
    let hasColor = false;
    gltf.scene.traverse((child) => {
      if (child.isPoints || child.isMesh) {
        pointCount += child.geometry.attributes.position.count;
        if (child.geometry.attributes.color) hasColor = true;
      }
    });
    console.log(`Parsed Points: ${pointCount.toLocaleString()}`);
    console.log(`Has COLOR_0 attribute: ${hasColor}`);
  },
  (err) => {
    console.error('Error loading GLTF:', err);
    process.exit(1);
  }
);
