const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'models');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function writePCD(filename, points) {
  let content = `# .PCD v.7 - Point Cloud Data file format
VERSION .7
FIELDS x y z
SIZE 4 4 4
TYPE F F F
COUNT 1 1 1
WIDTH ${points.length}
HEIGHT 1
VIEWPOINT 0 0 0 1 0 0 0
POINTS ${points.length}
DATA ascii
`;
  points.forEach(p => {
    content += `${p[0].toFixed(5)} ${p[1].toFixed(5)} ${p[2].toFixed(5)}\n`;
  });
  
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), content);
  console.log(`Generated ${filename} with ${points.length} points.`);
}

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// 1. Forest Scene
function generateForest() {
  const points = [];
  // Ground
  for(let i=0; i<5000; i++) {
    points.push([randomInRange(-20, 20), randomInRange(-0.5, 0.5), randomInRange(-20, 20)]);
  }
  // Trees
  for(let t=0; t<20; t++) {
    const tx = randomInRange(-18, 18);
    const tz = randomInRange(-18, 18);
    const height = randomInRange(4, 8);
    // Trunk
    for(let i=0; i<300; i++) {
      const a = randomInRange(0, Math.PI * 2);
      const r = randomInRange(0, 0.4);
      points.push([tx + Math.cos(a)*r, randomInRange(0, height), tz + Math.sin(a)*r]);
    }
    // Canopy (sphere)
    for(let i=0; i<1500; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = randomInRange(0, 3 + Math.random());
      points.push([
        tx + r * Math.sin(phi) * Math.cos(theta),
        height + r * Math.sin(phi) * Math.sin(theta) + 1,
        tz + r * Math.cos(phi)
      ]);
    }
  }
  writePCD('forest.pcd', points);
}

// 2. Urban Scene
function generateUrban() {
  const points = [];
  // Ground plane
  for(let i=0; i<5000; i++) points.push([randomInRange(-20, 20), 0, randomInRange(-20, 20)]);
  
  for(let b=0; b<15; b++) {
    const x = randomInRange(-15, 15);
    const z = randomInRange(-15, 15);
    const width = randomInRange(2, 6);
    const depth = randomInRange(2, 6);
    const height = randomInRange(5, 20);
    
    // Building walls
    for(let i=0; i<2000; i++) {
      // random face
      const face = Math.floor(randomInRange(0, 4));
      let px, py, pz;
      py = randomInRange(0, height);
      if(face === 0) { px = x - width/2; pz = randomInRange(z - depth/2, z + depth/2); }
      if(face === 1) { px = x + width/2; pz = randomInRange(z - depth/2, z + depth/2); }
      if(face === 2) { px = randomInRange(x - width/2, x + width/2); pz = z - depth/2; }
      if(face === 3) { px = randomInRange(x - width/2, x + width/2); pz = z + depth/2; }
      points.push([px, py, pz]);
    }
    // Roof
    for(let i=0; i<500; i++) {
       points.push([randomInRange(x - width/2, x + width/2), height, randomInRange(z - depth/2, z + depth/2)]);
    }
  }
  writePCD('urban.pcd', points);
}

// 3. Underwater
function generateUnderwater() {
  const points = [];
  // Wavy seabed
  for(let i=0; i<15000; i++) {
    const x = randomInRange(-20, 20);
    const z = randomInRange(-20, 20);
    const y = Math.sin(x*0.5)*Math.cos(z*0.5)*2 - 5;
    points.push([x, y, z]);
  }
  // Fish clusters
  for(let f=0; f<30; f++) {
    const fx = randomInRange(-15, 15);
    const fy = randomInRange(-3, 10);
    const fz = randomInRange(-15, 15);
    for(let i=0; i<100; i++) {
       points.push([fx + randomInRange(-0.5, 0.5), fy + randomInRange(-0.2, 0.2), fz + randomInRange(-0.5, 0.5)]);
    }
  }
  writePCD('underwater.pcd', points);
}

// 4. Sportscar
function generateSportscar() {
  const points = [];
  // Chassis
  for(let i=0; i<5000; i++) {
    const x = randomInRange(-2, 2); // width
    const z = randomInRange(-4, 4); // length
    let y = 0.5;
    if (z > -2 && z < 2) y += Math.sin(((z+2)/4)*Math.PI) * 1.0; // Roof curve
    y += randomInRange(-0.2, 0.2); // thick
    points.push([x, randomInRange(0.2, y), z]);
  }
  // Wheels
  const wpos = [[-2, -2.5], [2, -2.5], [-2, 2.5], [2, 2.5]];
  wpos.forEach(pos => {
    for(let i=0; i<500; i++) {
       const ang = randomInRange(0, Math.PI*2);
       const r = randomInRange(0.5, 0.8);
       points.push([pos[0] + randomInRange(-0.3, 0.3), 0.8 + Math.sin(ang)*r, pos[1] + Math.cos(ang)*r]);
    }
  });
  writePCD('sportscar.pcd', points);
}

// 5. SR-71 Blackbird
function generateBlackbird() {
  const points = [];
  const pointsCount = 10000;
  for(let i=0; i<pointsCount; i++) {
    const part = Math.random();
    if(part < 0.4) {
      // Fuselage (long ellipse)
      const z = randomInRange(-10, 10); // length
      const radius = 0.5 + (1 - Math.pow(Math.abs(z/10), 2)) * 0.5;
      const angle = randomInRange(0, Math.PI*2);
      points.push([Math.cos(angle)*radius, Math.sin(angle)*radius * 0.5, z]);
    } else if(part < 0.7) {
      // Delta Wings
      const z = randomInRange(0, 8); // towards the back
      const span = 4 * (z / 8); 
      const x = randomInRange(-span, span);
      points.push([x, randomInRange(-0.1, 0.1), z]);
    } else {
      // Engine nacelles
      const side = Math.random() > 0.5 ? 1 : -1;
      const z = randomInRange(2, 8);
      const angle = randomInRange(0, Math.PI*2);
      const r = randomInRange(0.6, 0.8);
      points.push([side * 2.5 + Math.cos(angle)*r, Math.sin(angle)*r, z]);
    }
  }
  writePCD('sr71.pcd', points);
}

// 6. Helicopter
function generateHelicopter() {
  const points = [];
  // Cabin bubble
  for(let i=0; i<3000; i++) {
    const u = Math.random(); const v = Math.random();
    const theta = u * Math.PI*2; const phi = Math.acos(2*v - 1);
    const r = randomInRange(1.8, 2.0);
    points.push([r*Math.sin(phi)*Math.cos(theta), r*Math.sin(phi)*Math.sin(theta), r*Math.cos(phi) * 1.5 - 1]);
  }
  // Tail boom
  for(let i=0; i<1500; i++) {
    const z = randomInRange(2, 7);
    const r = 0.4 * (1 - (z-2)/6);
    const angle = randomInRange(0, Math.PI*2);
    points.push([Math.cos(angle)*r, Math.sin(angle)*r, z]);
  }
  // Main Rotor
  for(let i=0; i<2000; i++) {
    const r = randomInRange(0, 5);
    const angle = randomInRange(0, Math.PI*2);
    // Rotor blades + blur
    points.push([Math.cos(angle)*r, 2.2 + randomInRange(-0.05, 0.05), Math.sin(angle)*r - 1]);
  }
  // Tail Rotor
  for(let i=0; i<500; i++) {
    const r = randomInRange(0, 1.2);
    const angle = randomInRange(0, Math.PI*2);
    points.push([0.3 + randomInRange(-0.05, 0.05), Math.cos(angle)*r + 0.5, Math.sin(angle)*r + 7]);
  }
  writePCD('helicopter.pcd', points);
}

generateForest();
generateUrban();
generateUnderwater();
generateSportscar();
generateBlackbird();
generateHelicopter();
