import fs from 'fs';
import path from 'path';

const manifestPath = '/home/cgarms/Projects/CUTMAP/results/website_assets/benchmark_metrics.json';
const websiteAssetsDir = '/home/cgarms/Projects/CUTMAP/results/website_assets';

console.log('=== Checking Manifest ===');
if (fs.existsSync(manifestPath)) {
  const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(JSON.stringify(data, null, 2));
} else {
  console.log('Manifest not found at:', manifestPath);
}

console.log('\n=== Checking website_assets directory ===');
if (fs.existsSync(websiteAssetsDir)) {
  const files = fs.readdirSync(websiteAssetsDir);
  files.forEach(f => {
    const stat = fs.statSync(path.join(websiteAssetsDir, f));
    console.log(` - ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
  });
} else {
  console.log('websiteAssetsDir not found at:', websiteAssetsDir);
}

console.log('\n=== Checking results/paper1 directory ===');
const paper1Dir = '/home/cgarms/Projects/CUTMAP/results/paper1';
if (fs.existsSync(paper1Dir)) {
  const files = fs.readdirSync(paper1Dir);
  files.forEach(f => {
    const stat = fs.statSync(path.join(paper1Dir, f));
    console.log(` - ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
  });
}
