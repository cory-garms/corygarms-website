import fs from 'fs';
import path from 'path';

const srcDir = '/home/cgarms/Projects/CUTMAP/results/website_assets';
console.log(`Checking source directory: ${srcDir}`);

try {
  if (fs.existsSync(srcDir)) {
    const files = fs.readdirSync(srcDir);
    console.log(`Found ${files.length} files in ${srcDir}:`);
    files.forEach(f => console.log(` - ${f}`));
  } else {
    console.log(`Source directory does NOT exist: ${srcDir}`);
    // Check parent directories
    console.log('Checking /home/cgarms/Projects/CUTMAP:');
    if (fs.existsSync('/home/cgarms/Projects/CUTMAP')) {
      console.log('Found /home/cgarms/Projects/CUTMAP contents:');
      fs.readdirSync('/home/cgarms/Projects/CUTMAP').forEach(f => console.log(` - ${f}`));
      if (fs.existsSync('/home/cgarms/Projects/CUTMAP/results')) {
        console.log('Found /home/cgarms/Projects/CUTMAP/results contents:');
        fs.readdirSync('/home/cgarms/Projects/CUTMAP/results').forEach(f => console.log(` - ${f}`));
      }
    }
  }
} catch (err) {
  console.error('Error reading directory:', err.message);
}
