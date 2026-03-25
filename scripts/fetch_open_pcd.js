import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'models');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Canonical real open-source datasets from the Point Cloud Library (PCL) repository
const datasets = [
  {
    name: 'bunny.pcd', // Stanford Bunny
    url: 'https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/bunny.pcd'
  },
  {
    name: 'office.pcd', // Real indoor room scan
    url: 'https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/table_scene_lms400.pcd'
  },
  {
    name: 'milk_carton.pcd', // Real scan of object
    url: 'https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/milk_color.pcd'
  }
];

datasets.forEach(dataset => {
  const dest = path.join(OUTPUT_DIR, dataset.name);
  const file = fs.createWriteStream(dest);
  
  https.get(dataset.url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close();  
      console.log(`Successfully downloaded real open-source scan: ${dataset.name}`);
    });
  }).on('error', function(err) {
    fs.unlink(dest, () => {}); 
    console.error(`Error downloading ${dataset.name}:`, err.message);
  });
});
