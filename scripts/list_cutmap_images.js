import fs from 'fs';
import path from 'path';

const dir = '/home/cgarms/Sandbox/website/public/images/cutmap';
const files = fs.readdirSync(dir);
console.log('Images in cutmap:');
files.forEach(f => {
  const stat = fs.statSync(path.join(dir, f));
  console.log(` - ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
});
