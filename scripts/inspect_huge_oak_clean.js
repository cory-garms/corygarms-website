import fs from 'fs';

const filePath = '/home/cgarms/Sandbox/website/3D_models/HUGE_OAK_CLEAN.pcd';
const fd = fs.openSync(filePath, 'r');
const buf = Buffer.alloc(2048);
fs.readSync(fd, buf, 0, 2048, 0);
fs.closeSync(fd);

const text = buf.toString('utf8');
const lines = text.split('\n').slice(0, 15);
console.log('--- HUGE_OAK_CLEAN.pcd Header ---');
lines.forEach((l, i) => console.log(`${i}: ${l}`));
