import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'models');
const INPUT_DIR = path.join(__dirname, '..', 'public', 'models');

// Very simple OBJ to PCD converter pulling out the vertices to simulate a point cloud scan
function convertObjToPcd(filename) {
  const inputPath = path.join(INPUT_DIR, filename);
  if (!fs.existsSync(inputPath)) {
    console.log(`Could not find ${filename}. Waiting for model to be provided.`);
    return;
  }

  const objData = fs.readFileSync(inputPath, 'utf8');
  const lines = objData.split('\n');
  const vertices = [];

  for (let line of lines) {
    if (line.startsWith('v ')) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        vertices.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
      }
    }
  }

  if (vertices.length === 0) {
    console.log(`No valid vertices found in ${filename}`);
    return;
  }

  const pcdName = filename.replace('.obj', '.pcd');
  const pcdPath = path.join(OUTPUT_DIR, pcdName);

  let content = `# .PCD v.7 - Point Cloud Data file format
VERSION .7
FIELDS x y z
SIZE 4 4 4
TYPE F F F
COUNT 1 1 1
WIDTH ${vertices.length}
HEIGHT 1
VIEWPOINT 0 0 0 1 0 0 0
POINTS ${vertices.length}
DATA ascii
`;
  vertices.forEach(v => {
    content += `${v[0].toFixed(5)} ${v[1].toFixed(5)} ${v[2].toFixed(5)}\n`;
  });
  
  fs.writeFileSync(pcdPath, content);
  console.log(`Converted ${filename} to ${pcdName} (${vertices.length} vertices converted to points).`);
}

// Convert specific files if they are given:
['sr71.obj', 'sportscar.obj', 'helicopter.obj', 'forest.obj', 'urban.obj', 'underwater.obj'].forEach(file => {
   if (fs.existsSync(path.join(INPUT_DIR, file))) {
       convertObjToPcd(file);
   }
});
console.log("OBJ to PCD scan-conversion routine complete!");
