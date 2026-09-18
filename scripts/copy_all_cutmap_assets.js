import fs from 'fs';
import path from 'path';

const websiteDir = '/home/cgarms/Sandbox/website';
const imagesDest = path.join(websiteDir, 'public/images/cutmap');
const videosDest = path.join(websiteDir, 'public/videos/cutmap');

fs.mkdirSync(imagesDest, { recursive: true });
fs.mkdirSync(videosDest, { recursive: true });

console.log('=== Copying Video Assets ===');
const assetsDir = '/home/cgarms/Projects/CUTMAP/results/website_assets';
const assetFiles = fs.readdirSync(assetsDir);

for (const file of assetFiles) {
  const srcPath = path.join(assetsDir, file);
  if (file.endsWith('.mp4') || file.endsWith('.webp')) {
    const destPath = path.join(videosDest, file);
    fs.copyFileSync(srcPath, destPath);
    const size = (fs.statSync(destPath).size / 1024).toFixed(1);
    console.log(`Copied video/animation: ${file} -> public/videos/cutmap/ (${size} KB)`);
  } else if (file.endsWith('.png') || file.endsWith('.jpg')) {
    const destPath = path.join(imagesDest, file);
    fs.copyFileSync(srcPath, destPath);
    const size = (fs.statSync(destPath).size / 1024).toFixed(1);
    console.log(`Copied image: ${file} -> public/images/cutmap/ (${size} KB)`);
  }
}

console.log('\n=== Copying Paper1 Figures ===');
const paper1Dir = '/home/cgarms/Projects/CUTMAP/results/paper1';
if (fs.existsSync(paper1Dir)) {
  const p1Files = fs.readdirSync(paper1Dir);
  for (const file of p1Files) {
    if (file.endsWith('.png') || file.endsWith('.jpg')) {
      const srcPath = path.join(paper1Dir, file);
      const destPath = path.join(imagesDest, file);
      fs.copyFileSync(srcPath, destPath);
      const size = (fs.statSync(destPath).size / 1024).toFixed(1);
      console.log(`Copied paper1 figure: ${file} -> public/images/cutmap/ (${size} KB)`);
    }
  }
}

console.log('\n=== Searching for fig_pilot_oak_maple_classification.png ===');
function searchFile(dir, targetName) {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          searchFile(full, targetName);
        } else if (item.toLowerCase().includes('oak_maple') || item === targetName) {
          console.log(`Found matching file: ${full}`);
          const destPath = path.join(imagesDest, path.basename(full));
          fs.copyFileSync(full, destPath);
          console.log(`Copied to: ${destPath}`);
        }
      } catch (e) {}
    }
  } catch (e) {}
}
searchFile('/home/cgarms/Projects/CUTMAP', 'fig_pilot_oak_maple_classification.png');

console.log('\n=== Reading website_showcase_brief.md ===');
const briefPath = path.join(assetsDir, 'website_showcase_brief.md');
if (fs.existsSync(briefPath)) {
  console.log(fs.readFileSync(briefPath, 'utf8'));
}
