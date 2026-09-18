import fs from 'fs';

const filePath = '/home/cgarms/Sandbox/website/3D_models/HUGE_OAK.pcd';
const fd = fs.openSync(filePath, 'r');
const buf = Buffer.alloc(4096);
fs.readSync(fd, buf, 0, 4096, 0);
fs.closeSync(fd);

const text = buf.toString('utf8');
const lines = text.split('\n').slice(0, 20);
console.log('--- HUGE_OAK.pcd Header ---');
lines.forEach((l, i) => console.log(`${i}: ${l}`));
