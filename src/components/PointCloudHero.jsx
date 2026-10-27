import React, { useMemo, useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

// Curated Mt. Auburn Landmark Trees highlighting Remote Sensing & Field Science
const SCENES = [
  { 
    id: 'huge_oak', 
    name: 'Red Oak', 
    species: 'Quercus rubra (Red Oak)',
    spec: 'Livox Mid-360 LiDAR',
    source: 'Mt. Auburn Terrestrial LiDAR Scan (1.52M pts)',
    points: '1.52M pts',
    height: '28.4 m',
    spread: '28.8 m'
  },
  { 
    id: 'sugar_maple', 
    name: 'Sugar Maple', 
    species: 'Acer saccharum (Sugar Maple)',
    spec: 'Livox Mid-360 LiDAR',
    source: 'Mt. Auburn Terrestrial LiDAR Scan (1.36M pts)',
    points: '1.36M pts',
    height: '23.4 m',
    spread: '27.9 m'
  },
  { 
    id: 'white_pine', 
    name: 'White Pine', 
    species: 'Pinus strobus (Eastern White Pine)',
    spec: 'Livox Mid-360 LiDAR',
    source: 'Stand 1 Forest Grove (Single Tree Isolation)',
    points: '179k pts',
    height: '20.1 m',
    spread: '10.9 m'
  },
  { 
    id: 'bur_oak', 
    name: 'Bur Oak', 
    species: 'Quercus macrocarpa (Bur Oak)',
    spec: 'Livox Mid-360 LiDAR',
    source: 'Mt. Auburn Terrestrial LiDAR Scan (466k pts)',
    points: '466k pts',
    height: '27.0 m',
    spread: '27.8 m'
  }
];

// Curated Point Splat Sizes
const POINT_SIZES = [
  { value: 0.7, label: 'Fine', desc: 'Fine: Sharp individual pulse returns (4K/Retina)' },
  { value: 1.5, label: 'Normal', desc: 'Normal: Standard survey scan density' },
  { value: 3.0, label: 'Dense', desc: 'Dense: Solid crown volume' }
];

// Curated Scientific Colormaps
const COLOR_MODES = [
  {
    id: 0,
    name: 'Forestry',
    label: 'Forest Elevation',
    swatch: 'bg-gradient-to-r from-emerald-700 via-emerald-400 to-cyan-400',
    desc: 'Deep duff → Emerald trunk → Crown cyan',
    tag: 'Natural'
  },
  {
    id: 1,
    name: 'Viridis',
    label: 'Viridis Scientific',
    swatch: 'bg-gradient-to-r from-[#440154] via-[#21918c] to-[#fde725]',
    desc: 'Remote sensing standard: Purple → Teal → Yellow',
    tag: 'Standard'
  },
  {
    id: 2,
    name: 'Magma',
    label: 'Magma Thermal',
    swatch: 'bg-gradient-to-r from-[#2b084e] via-[#b6377a] to-[#fcfdbf]',
    desc: 'High-contrast thermal: Violet → Magenta → Gold',
    tag: 'Thermal'
  },
  {
    id: 3,
    name: 'Reflectance',
    label: 'LiDAR Intensity',
    swatch: 'bg-gradient-to-r from-slate-700 via-sky-400 to-amber-100',
    desc: '16-bit surface optical return reflectance',
    tag: 'Reflectance'
  },
  {
    id: 4,
    name: 'Turbo',
    label: 'Turbo Scientific',
    swatch: 'bg-gradient-to-r from-[#30123b] via-[#1ae4b6] via-[#febe2a] to-[#7a0403]',
    desc: 'Google Turbo: Blue → Cyan → Green → Yellow → Red',
    tag: 'Rainbow'
  },
  {
    id: 5,
    name: 'Cividis',
    label: 'Cividis Colorblind-Safe',
    swatch: 'bg-gradient-to-r from-[#00204d] via-[#5b5e6b] to-[#ffea46]',
    desc: 'Perceptually uniform: Midnight blue → Slate → Gold',
    tag: 'Accessible'
  }
];

// Pre-load primary scans for instant switching
SCENES.forEach(scene => {
  useGLTF.preload(`/models/${scene.id}.glb`);
});

// Elevation & Intensity-aware GLSL Shaders
const vertexShader = `
  attribute vec3 color;
  varying vec3 vColor;
  varying float vElevation;
  uniform float uMinY;
  uniform float uMaxY;
  uniform float uPointSize;

  void main() {
    float range = max(uMaxY - uMinY, 0.001);
    vElevation = clamp((position.y - uMinY) / range, 0.0, 1.0);
    vColor = color;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float pSize = uPointSize * (160.0 / -mvPosition.z);
    gl_PointSize = clamp(pSize, 1.0, 48.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform int uColorMode;
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vElevation;

  // 0: Forestry
  vec3 getForestryColor(float t) {
    vec3 cGround = vec3(0.04, 0.22, 0.16);   // Deep forest duff
    vec3 cTrunk  = vec3(0.063, 0.725, 0.506); // Laser Emerald DBH
    vec3 cBranch = vec3(0.204, 0.827, 0.6);   // Scaffold branch structure
    vec3 cCanopy = vec3(0.22, 0.78, 0.95);    // Crown foliage
    
    if (t < 0.25) {
      return mix(cGround, cTrunk, t / 0.25);
    } else if (t < 0.65) {
      return mix(cTrunk, cBranch, (t - 0.25) / 0.4);
    } else {
      return mix(cBranch, cCanopy, (t - 0.65) / 0.35);
    }
  }

  // 1: Viridis (Scientific Remote Sensing Standard)
  vec3 getViridisColor(float t) {
    const vec3 c0 = vec3(0.267, 0.004, 0.329); // #440154 (purple)
    const vec3 c1 = vec3(0.231, 0.322, 0.545); // #3b528b (blue)
    const vec3 c2 = vec3(0.129, 0.569, 0.553); // #21918c (teal)
    const vec3 c3 = vec3(0.369, 0.788, 0.384); // #5ec962 (chartreuse)
    const vec3 c4 = vec3(0.992, 0.906, 0.145); // #fde725 (yellow)

    if (t < 0.25) return mix(c0, c1, t / 0.25);
    if (t < 0.50) return mix(c1, c2, (t - 0.25) / 0.25);
    if (t < 0.75) return mix(c2, c3, (t - 0.50) / 0.25);
    return mix(c3, c4, (t - 0.75) / 0.25);
  }

  // 2: Magma (Thermal High-Contrast)
  vec3 getMagmaColor(float t) {
    const vec3 c0 = vec3(0.001, 0.004, 0.016); // #000104 (dark velvet)
    const vec3 c1 = vec3(0.318, 0.098, 0.443); // #511971 (purple)
    const vec3 c2 = vec3(0.714, 0.216, 0.478); // #b6377a (hot magenta)
    const vec3 c3 = vec3(0.984, 0.502, 0.380); // #fb8060 (coral)
    const vec3 c4 = vec3(0.988, 0.992, 0.749); // #fcfdbf (pale gold)

    if (t < 0.25) return mix(c0, c1, t / 0.25);
    if (t < 0.50) return mix(c1, c2, (t - 0.25) / 0.25);
    if (t < 0.75) return mix(c2, c3, (t - 0.50) / 0.25);
    return mix(c3, c4, (t - 0.75) / 0.25);
  }

  // 3: LiDAR Optical Return Intensity (Reflectance)
  vec3 getIntensityColor(float i) {
    float val = pow(clamp(i, 0.0, 1.0), 0.85);
    vec3 cLow  = vec3(0.08, 0.12, 0.20); // Shadowed bark
    vec3 cMid  = vec3(0.35, 0.65, 0.80); // Woody limb returns
    vec3 cHigh = vec3(1.00, 0.96, 0.86); // Strong retro-reflective foliage returns
    if (val < 0.5) return mix(cLow, cMid, val * 2.0);
    return mix(cMid, cHigh, (val - 0.5) * 2.0);
  }

  // 4: Turbo (Google Turbo Colormap)
  vec3 getTurboColor(float t) {
    const vec3 c0 = vec3(0.188, 0.071, 0.231); // #30123b (blue-violet)
    const vec3 c1 = vec3(0.129, 0.545, 0.953); // #218bf3 (blue)
    const vec3 c2 = vec3(0.102, 0.894, 0.714); // #1ae4b6 (cyan-green)
    const vec3 c3 = vec3(0.643, 0.988, 0.235); // #a4fc3c (bright green)
    const vec3 c4 = vec3(0.996, 0.745, 0.165); // #febe2a (yellow-gold)
    const vec3 c5 = vec3(0.478, 0.016, 0.012); // #7a0403 (deep red)
    if (t < 0.2) return mix(c0, c1, t / 0.2);
    if (t < 0.4) return mix(c1, c2, (t - 0.2) / 0.2);
    if (t < 0.6) return mix(c2, c3, (t - 0.4) / 0.2);
    if (t < 0.8) return mix(c3, c4, (t - 0.6) / 0.2);
    return mix(c4, c5, (t - 0.8) / 0.2);
  }

  // 5: Cividis (Perceptually Uniform & Colorblind-Safe)
  vec3 getCividisColor(float t) {
    const vec3 c0 = vec3(0.000, 0.125, 0.302); // #00204d (deep midnight blue)
    const vec3 c1 = vec3(0.255, 0.302, 0.420); // #414d6b (slate)
    const vec3 c2 = vec3(0.533, 0.494, 0.420); // #887e6b (olive grey)
    const vec3 c3 = vec3(1.000, 0.918, 0.275); // #ffea46 (gold yellow)
    if (t < 0.33) return mix(c0, c1, t / 0.33);
    if (t < 0.66) return mix(c1, c2, (t - 0.33) / 0.33);
    return mix(c2, c3, (t - 0.66) / 0.34);
  }

  void main() {
    // Antialiased circular LiDAR splat
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.2, dist) * uOpacity;

    vec3 color;
    if (uColorMode == 0) {
      color = getForestryColor(vElevation);
    } else if (uColorMode == 1) {
      color = getViridisColor(vElevation);
    } else if (uColorMode == 2) {
      color = getMagmaColor(vElevation);
    } else if (uColorMode == 3) {
      color = getIntensityColor(vColor.r);
    } else if (uColorMode == 4) {
      color = getTurboColor(vElevation);
    } else {
      color = getCividisColor(vElevation);
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

// Dedicated High-Visibility Shader for Surveyor Scale Figure
const surveyorVertexShader = `
  attribute vec3 color;
  varying vec3 vColor;
  uniform float uPointSize;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float pSize = uPointSize * (160.0 / -mvPosition.z);
    gl_PointSize = clamp(pSize * 1.35, 2.0, 48.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const surveyorFragmentShader = `
  varying vec3 vColor;
  uniform float uOpacity;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.2, dist) * uOpacity;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// Procedural 1.83m (6ft) forestry surveyor point cloud
function createSurveyorGeometry() {
  const points = [];
  const colors = [];
  const addPt = (x, y, z, r, g, b) => {
    points.push(x, y, z);
    colors.push(r, g, b);
  };

  // 1. Ground benchmark station circle (r = 0.50m)
  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * Math.PI * 2;
    addPt(Math.cos(angle) * 0.5, 0.01, Math.sin(angle) * 0.5, 1.0, 0.55, 0.0);
  }

  // 2. Heavy field boots (y: 0.0 to 0.08m)
  for (const legX of [-0.14, 0.14]) {
    for (let z = -0.12; z <= 0.14; z += 0.04) {
      for (let y = 0.02; y <= 0.08; y += 0.03) {
        addPt(legX, y, z, 0.35, 0.22, 0.12);
      }
    }
  }

  // 3. Legs in field denim/khaki work pants (y: 0.08 to 0.95m)
  for (let y = 0.08; y <= 0.95; y += 0.04) {
    for (const legX of [-0.14, 0.14]) {
      for (const legZ of [-0.07, 0.0, 0.07]) {
        for (const dx of [-0.05, 0.05]) {
          addPt(legX + dx, y, legZ, 0.22, 0.38, 0.65);
        }
      }
    }
  }

  // 4. Torso with ANSI Class 2/3 Safety High-Vis Orange Vest (y: 0.95 to 1.55m)
  for (let y = 0.95; y <= 1.55; y += 0.035) {
    const isStripe = (y >= 1.18 && y <= 1.25) || (y >= 1.40 && y <= 1.46);
    for (let x = -0.22; x <= 0.22; x += 0.045) {
      for (const z of [-0.11, 0.0, 0.11]) {
        if (isStripe) {
          addPt(x, y, z, 0.95, 0.98, 0.15); // Fluorescent lime-yellow reflective stripe
        } else {
          addPt(x, y, z, 1.0, 0.42, 0.02);  // ANSI Safety High-Vis Orange
        }
      }
    }
  }

  // 5. Left Arm (hanging at side)
  for (let y = 0.95; y <= 1.48; y += 0.04) {
    addPt(-0.28, y, 0.0, 1.0, 0.42, 0.02);
    addPt(-0.28, y, 0.04, 1.0, 0.42, 0.02);
  }

  // 6. Right Arm (grasping 2-meter surveyor range pole)
  for (let t = 0; t <= 1; t += 0.1) {
    const ax = 0.22 + t * 0.18;
    const ay = 1.48 - t * 0.30;
    const az = 0.0 + t * 0.08;
    addPt(ax, ay, az, 1.0, 0.42, 0.02);
  }

  // 7. Head, Neck & Face (y: 1.56 to 1.68m)
  for (let y = 1.56; y <= 1.68; y += 0.03) {
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      addPt(Math.cos(angle) * 0.09, y, Math.sin(angle) * 0.09, 0.92, 0.78, 0.65);
    }
  }

  // 8. Surveyor Safety Hardhat (y: 1.68 to 1.83m - Exact 6ft crown)
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    addPt(Math.cos(angle) * 0.16, 1.68, Math.sin(angle) * 0.16, 1.0, 0.88, 0.10); // Hardhat brim
  }
  for (let y = 1.69; y <= 1.83; y += 0.025) {
    const fraction = (y - 1.69) / 0.14;
    const r = Math.cos(fraction * Math.PI * 0.5) * 0.12;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      addPt(Math.cos(angle) * r, y, Math.sin(angle) * r, 1.0, 0.88, 0.10); // Hardhat crown
    }
  }

  // 9. Standard 2.0-meter Forestry Range / Prism Pole (held at x = 0.42, z = 0.08)
  for (let y = 0.0; y <= 2.0; y += 0.03) {
    const isRed = Math.floor(y / 0.20) % 2 === 0;
    const [pr, pg, pb] = isRed ? [1.0, 0.15, 0.15] : [1.0, 1.0, 1.0];
    addPt(0.42, y, 0.08, pr, pg, pb);
  }
  // Top surveying optical prism (cyan reflector at 2.02m)
  addPt(0.42, 2.03, 0.08, 0.2, 0.95, 1.0);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}

// 1.83m Surveyor Scale Figure Component
const SurveyorScaleFigure = ({ minY, pointSize }) => {
  const geometry = useMemo(() => createSurveyorGeometry(), []);
  const materialRef = useRef(null);

  const uniforms = useMemo(() => ({
    uPointSize: { value: pointSize },
    uOpacity: { value: 0.95 }
  }), []);

  useEffect(() => {
    if (materialRef.current && materialRef.current.uniforms && materialRef.current.uniforms.uPointSize) {
      materialRef.current.uniforms.uPointSize.value = pointSize;
    }
  }, [pointSize]);

  return (
    <group position={[3.2, minY, 0.5]}>
      <points geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={surveyorVertexShader}
          fragmentShader={surveyorFragmentShader}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
        />
      </points>
      <Html position={[0.0, -0.45, 0]} center className="pointer-events-none select-none">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-forest-950/95 border border-amber-500/70 backdrop-blur-md shadow-xl text-[10px] font-mono text-amber-300 font-bold whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span>6' 0" (1.83 m) Surveyor</span>
        </div>
      </Html>
    </group>
  );
};

// Global geometry cache to prevent repeated parsing
const geometryCache = new Map();

function extractOptimizedGeometry(scene, sceneId) {
  if (geometryCache.has(sceneId)) {
    return geometryCache.get(sceneId);
  }

  const meshes = [];
  scene.traverse((child) => {
    if ((child.isMesh || child.isPoints) && child.geometry && child.geometry.attributes.position) {
      meshes.push(child);
    }
  });

  let totalVertexCount = 0;
  meshes.forEach(m => {
    totalVertexCount += m.geometry.attributes.position.count;
  });

  // Preserve up to 180k points for supreme detail
  const step = totalVertexCount > 180000 ? Math.ceil(totalVertexCount / 170000) : 1;
  const targetCount = Math.floor(totalVertexCount / step);

  const positions = new Float32Array(targetCount * 3);
  const colors = new Float32Array(targetCount * 3);
  let posIdx = 0;
  const tempVec = new THREE.Vector3();

  meshes.forEach(m => {
    const posAttr = m.geometry.attributes.position;
    const colorAttr = m.geometry.attributes.color;
    const matrix = m.matrixWorld;
    for (let i = 0; i < posAttr.count; i += step) {
      if (posIdx >= targetCount) break;
      tempVec.fromBufferAttribute(posAttr, i);
      tempVec.applyMatrix4(matrix);
      positions[posIdx * 3] = tempVec.x;
      positions[posIdx * 3 + 1] = tempVec.y;
      positions[posIdx * 3 + 2] = tempVec.z;

      if (colorAttr) {
        colors[posIdx * 3] = colorAttr.getX(i);
        colors[posIdx * 3 + 1] = colorAttr.getY(i);
        colors[posIdx * 3 + 2] = colorAttr.getZ(i);
      } else {
        // Fallback normalized elevation gradient for models without COLOR_0
        colors[posIdx * 3] = 0.8;
        colors[posIdx * 3 + 1] = 0.8;
        colors[posIdx * 3 + 2] = 0.8;
      }
      posIdx++;
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.center();
  geometry.computeBoundingBox();

  const box = geometry.boundingBox;
  const maxDim = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z);
  if (maxDim > 60) {
    const scale = 40 / maxDim;
    geometry.scale(scale, scale, scale);
    geometry.computeBoundingBox();
  }

  const minY = geometry.boundingBox.min.y;
  const maxY = geometry.boundingBox.max.y;

  const cachedData = {
    geometry,
    vertexCount: posIdx,
    minY,
    maxY
  };

  geometryCache.set(sceneId, cachedData);
  return cachedData;
}

// Point Cloud Render Component
const PointCloudMesh = ({ sceneId, colorMode, pointSize, showScale }) => {
  const { scene } = useGLTF(`/models/${sceneId}.glb`);
  const materialRef = useRef(null);

  const { geometry, minY, maxY } = useMemo(() => {
    return extractOptimizedGeometry(scene, sceneId);
  }, [scene, sceneId]);

  // Stable uniforms dictionary created once for this tree mesh instance
  const uniforms = useMemo(() => ({
    uPointSize: { value: pointSize },
    uMinY: { value: minY },
    uMaxY: { value: maxY },
    uColorMode: { value: colorMode },
    uOpacity: { value: 0.90 }
  }), []);

  // Update dynamic uniforms directly on the active Three.js material
  useEffect(() => {
    if (materialRef.current && materialRef.current.uniforms) {
      if (materialRef.current.uniforms.uColorMode) {
        materialRef.current.uniforms.uColorMode.value = colorMode;
      }
      if (materialRef.current.uniforms.uPointSize) {
        materialRef.current.uniforms.uPointSize.value = pointSize;
      }
      if (materialRef.current.uniforms.uMinY) {
        materialRef.current.uniforms.uMinY.value = minY;
      }
      if (materialRef.current.uniforms.uMaxY) {
        materialRef.current.uniforms.uMaxY.value = maxY;
      }
    }
  }, [colorMode, pointSize, minY, maxY]);

  return (
    <group>
      <points>
        <primitive object={geometry} attach="geometry" />
        <shaderMaterial
          ref={materialRef}
          attach="material"
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
        />
      </points>
      {showScale && (
        <SurveyorScaleFigure minY={minY} pointSize={pointSize} />
      )}
    </group>
  );
};

export default function PointCloudHero() {
  const [currentSceneId, setCurrentSceneId] = useState('huge_oak');
  const [colorMode, setColorMode] = useState(4); // 4: Turbo Scientific (0: Forestry, 1: Viridis, 2: Magma, 3: Reflectance, 4: Turbo, 5: Cividis)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [pointSize, setPointSize] = useState(0.7); // 0.7: Fine (1.5: Normal, 3.0: Dense)
  const [showScale, setShowScale] = useState(true);
  const [isRotating, setIsRotating] = useState(true);
  const [is3DActive, setIs3DActive] = useState(true);
  const [touchRotateEnabled, setTouchRotateEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const paletteRef = useRef(null);
  const sizeRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    // Check saved user preference for 3D engine
    const saved = localStorage.getItem('cgarms_3d_enabled');
    if (saved === 'false') {
      setIs3DActive(false);
    }
    
    // Check screen width for mobile optimization
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close guide modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsHelpOpen(false);
      }
    };
    if (isHelpOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isHelpOpen]);

  // Re-center camera target smoothly whenever the user switches trees
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [currentSceneId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setIsPaletteOpen(false);
      }
      if (sizeRef.current && !sizeRef.current.contains(e.target)) {
        setIsSizeOpen(false);
      }
    };
    if (isPaletteOpen || isSizeOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isPaletteOpen, isSizeOpen]);

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.object.position.set(24, 13, 32);
      controlsRef.current.update();
    }
  };

  const toggle3D = () => {
    const next = !is3DActive;
    setIs3DActive(next);
    localStorage.setItem('cgarms_3d_enabled', next ? 'true' : 'false');
  };

  const activeScene = SCENES.find(s => s.id === currentSceneId) || SCENES[0];
  const activeColor = COLOR_MODES.find(c => c.id === colorMode) || COLOR_MODES[0];

  return (
    <div className="relative w-full h-full select-none bg-[#070b09] overflow-hidden">
      {/* 3D WebGL Canvas */}
      {is3DActive ? (
        <Canvas 
          camera={{ position: [24, 13, 32], fov: 45, near: 0.5, far: 1200 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#070b09']} />
          <fog attach="fog" args={['#070b09', 40, 110]} />

          <Suspense fallback={null}>
            <PointCloudMesh
              key={currentSceneId}
              sceneId={currentSceneId}
              colorMode={colorMode}
              pointSize={pointSize}
              showScale={showScale}
            />
          </Suspense>
          
          <OrbitControls 
            ref={controlsRef}
            autoRotate={isRotating} 
            autoRotateSpeed={0.5} 
            enablePan={!isMobile || touchRotateEnabled}
            enableRotate={!isMobile || touchRotateEnabled}
            enableZoom={!isMobile || touchRotateEnabled}
            enableDamping={true}
            dampingFactor={0.08}
            minDistance={4}
            maxDistance={140}
          />
        </Canvas>
      ) : (
        /* 2D Fallback View when 3D is toggled OFF (scroll-friendly, zero GPU drain) */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center topo-grid bg-gradient-to-b from-[#070b09] via-forest-950/40 to-[#070b09]">
          <div className="max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-surface/85 border border-border/80 backdrop-blur-md shadow-2xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900 border border-emerald-500/30 text-xs font-mono text-emerald-300 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Livox Mid-360 LiDAR • 1.52M Pts</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
              Red Oak 3D Point Cloud
            </h3>
            <p className="text-xs text-text-muted leading-relaxed mb-6 max-w-sm mx-auto">
              3D WebGL engine is paused for smooth mobile scrolling and battery savings. Tap below to inspect the interactive 28.4-meter oak tree scan.
            </p>
            <button
              onClick={toggle3D}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-light text-forest-950 font-bold text-xs font-mono transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Enable 3D Viewer</span>
            </button>
          </div>
        </div>
      )}

      {/* Soft Topographic Vignette to next section (Underneath UI controls) */}
      <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none z-10" />

      {/* Top Bar: Persistent 3D Toggle, Colormap Palette Selector & Scene Switcher */}
      <div className="absolute top-4 left-4 right-4 sm:left-6 sm:right-6 flex flex-wrap items-center justify-between gap-2.5 z-30 pointer-events-none">
        
        {/* Left: 3D Engine Toggle & Interactive Color Palette Picker */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={toggle3D}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono transition-all cursor-pointer shadow-lg ${
              is3DActive 
                ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/90' 
                : 'bg-surface/85 hover:bg-surface text-text-muted hover:text-white border-border/80'
            }`}
            title={is3DActive ? "Click to disable 3D viewer (saves battery & unlocks scrolling)" : "Click to enable interactive 3D viewer"}
          >
            <span className={`w-2 h-2 rounded-full ${is3DActive ? 'bg-emerald-400 animate-pulse' : 'bg-text-dim'}`}></span>
            <span className="font-semibold">{is3DActive ? '3D View: ON' : '3D View: OFF'}</span>
          </button>

          {/* Palette Selector Dropdown */}
          {is3DActive && (
            <div className="relative" ref={paletteRef}>
              <button
                onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono transition-all cursor-pointer shadow-lg ${
                  isPaletteOpen
                    ? 'bg-forest-800 text-white border-accent/60 shadow-accent/10'
                    : 'bg-surface/85 hover:bg-surface text-text-muted hover:text-white border-border/80'
                }`}
                title="Select 3D Scientific Colormap"
                aria-expanded={isPaletteOpen}
              >
                <span className={`w-3.5 h-3.5 rounded-full flex overflow-hidden border border-white/20 shadow-sm ${activeColor.swatch}`}></span>
                <span className="font-medium">Palette</span>
                <svg className={`w-3 h-3 text-text-dim transition-transform duration-200 ${isPaletteOpen ? 'rotate-180 text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Palette Dropdown Popover */}
              {isPaletteOpen && (
                <div className="absolute left-0 mt-2 p-2 rounded-2xl bg-forest-950/95 border border-border/90 backdrop-blur-xl shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2.5">
                    {COLOR_MODES.map(mode => {
                      const isSelected = mode.id === colorMode;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => {
                            setColorMode(mode.id);
                            setIsPaletteOpen(false);
                          }}
                          className={`w-6 h-6 rounded-full transition-all cursor-pointer border flex-shrink-0 ${mode.swatch} ${
                            isSelected
                              ? 'scale-125 border-white ring-2 ring-accent ring-offset-2 ring-offset-forest-950 shadow-md'
                              : 'border-white/30 hover:scale-110 hover:border-white/80 opacity-80 hover:opacity-100'
                          }`}
                          title={mode.name}
                          aria-label={mode.name}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Point Size Selector Dropdown */}
          {is3DActive && (
            <div className="relative" ref={sizeRef}>
              <button
                type="button"
                onClick={() => setIsSizeOpen(!isSizeOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono transition-all cursor-pointer shadow-lg ${
                  isSizeOpen
                    ? 'bg-forest-800 text-white border-accent/60 shadow-accent/10'
                    : 'bg-surface/85 hover:bg-surface text-text-muted hover:text-white border-border/80'
                }`}
                title="Adjust Point Cloud Splat Size"
                aria-expanded={isSizeOpen}
              >
                <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="font-medium">Size: {POINT_SIZES.find(s => s.value === pointSize)?.label || 'Normal'}</span>
                <svg className={`w-3 h-3 text-text-dim transition-transform duration-200 ${isSizeOpen ? 'rotate-180 text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isSizeOpen && (
                <div className="absolute left-0 mt-2 p-1.5 rounded-xl bg-forest-950/95 border border-border/90 backdrop-blur-xl shadow-2xl z-30 flex items-center gap-1">
                  {POINT_SIZES.map(s => {
                    const isSelected = pointSize === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => {
                          setPointSize(s.value);
                          setIsSizeOpen(false);
                        }}
                        className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-accent text-forest-950 font-bold shadow-sm' 
                            : 'text-text-muted hover:text-white hover:bg-forest-850'
                        }`}
                        title={s.desc}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Scene Switcher (Visible when 3D is active) */}
        {is3DActive && (
          <div className="pointer-events-auto flex items-center gap-1.5 bg-surface/85 p-1 rounded-xl border border-border/80 backdrop-blur-md shadow-lg">
            {SCENES.map(scene => (
              <button 
                key={scene.id} 
                onClick={() => setCurrentSceneId(scene.id)} 
                className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-mono rounded-lg transition-all cursor-pointer ${
                  currentSceneId === scene.id 
                    ? 'bg-forest-700 text-white border border-accent/40 shadow-sm' 
                    : 'text-text-muted hover:text-white hover:bg-forest-850'
                }`}
              >
                {scene.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Controls Bar (Visible when 3D is active) */}
      {is3DActive && (
        <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 left-auto z-20 pointer-events-none flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
          
          {/* Mobile Touch Mode Helper Pill (on small screens) */}
          {isMobile && (
            <button
              onClick={() => setTouchRotateEnabled(!touchRotateEnabled)}
              className={`pointer-events-auto sm:hidden flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-xl border backdrop-blur-md shadow-lg transition-all cursor-pointer ${
                touchRotateEnabled 
                  ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/90' 
                  : 'bg-surface/85 hover:bg-surface text-text-muted hover:text-white border-border/80'
              }`}
              title="Toggle single-finger touch interaction vs. page scrolling"
            >
              <span>{touchRotateEnabled ? 'Touch 3D: ON' : 'Page Scroll'}</span>
            </button>
          )}

          {/* Scene Info & Telemetry Pill */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono bg-surface/85 px-3 py-1.5 rounded-xl border border-border/80 backdrop-blur-md shadow-lg pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white font-semibold">{activeScene.name}</span>
            <span className="text-text-dim">&bull;</span>
            <span className="text-white/90">{activeScene.spec}</span>
            <span className="text-text-dim">&bull;</span>
            <span className="text-emerald-300 font-bold">{activeScene.points}</span>
            {activeScene.height && (
              <>
                <span className="text-text-dim">&bull;</span>
                <span className="text-white font-medium">{activeScene.height}</span>
              </>
            )}
          </div>

          {/* Orbit Auto-Rotation Toggle Button */}
          <button 
            onClick={() => setIsRotating(!isRotating)}
            className={`pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono transition-all cursor-pointer shadow-lg ${
              isRotating
                ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/90'
                : 'bg-surface/85 hover:bg-surface text-text-muted hover:text-white border-border/80'
            }`}
            title={isRotating ? 'Pause automatic rotation' : 'Resume automatic rotation'}
          >
            <span className={`w-2 h-2 rounded-full ${isRotating ? 'bg-emerald-400 animate-pulse' : 'bg-text-dim'}`}></span>
            <span className="font-semibold">{isRotating ? 'Rotate: ON' : 'Rotate: OFF'}</span>
          </button>

          {/* 6ft Surveyor Scale Toggle Button */}
          <button 
            type="button"
            onClick={() => setShowScale(!showScale)}
            className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono transition-all cursor-pointer shadow-lg ${
              showScale
                ? 'bg-amber-950/85 text-amber-300 border-amber-500/50 hover:bg-amber-900/90'
                : 'bg-surface/85 hover:bg-surface text-text-muted hover:text-white border-border/80'
            }`}
            title="Toggle 6-foot (1.83 m) human surveyor scale figure"
          >
            <span className={`w-2 h-2 rounded-full ${showScale ? 'bg-amber-400 animate-pulse' : 'bg-text-dim'}`}></span>
            <span className="font-semibold">{showScale ? 'Scale: 6ft ON' : 'Scale: 6ft OFF'}</span>
          </button>

          {/* Reset View Button */}
          <button 
            type="button"
            onClick={handleResetView}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono transition-all cursor-pointer shadow-lg bg-surface/85 hover:bg-surface text-text-muted hover:text-white border-border/80 hover:border-accent/40"
            title="Reset camera view to initial framing"
          >
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-semibold">Reset</span>
          </button>

          {/* Viewer Guide / Help Trigger Button */}
          <button 
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono transition-all cursor-pointer shadow-lg bg-surface/85 hover:bg-surface text-accent hover:text-accent-light border-accent/40 hover:border-accent"
            title="Learn what you are viewing and how to navigate the 3D LiDAR point cloud"
            aria-label="Open 3D Viewer Guide"
          >
            <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">Guide</span>
          </button>
        </div>
      )}

      {/* 3D Tree Viewer Help Modal */}
      {isHelpOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsHelpOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-title"
        >
          <div 
            className="relative w-full max-w-lg bg-forest-950/95 border border-border/90 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 text-left font-sans max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-accent-light">Field Science &bull; Mount Auburn Scans</span>
                <h3 id="guide-title" className="text-xl font-bold text-white tracking-tight">3D Tree Viewer Guide</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="text-text-muted hover:text-white p-1 rounded-lg hover:bg-forest-900 transition-colors cursor-pointer"
                aria-label="Close guide"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-text-muted leading-relaxed">
              <div>
                <h4 className="text-white font-semibold mb-1 font-mono text-xs text-accent">What you are seeing</h4>
                <p>
                  These 4 landmark trees were scanned at Mount Auburn Cemetery using the CUTMAP mobile LiDAR prototype system and downsampled for web display. Points are colored by height above the ground.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-1.5 font-mono text-xs text-accent">Navigation</h4>
                <ul className="space-y-1 text-xs">
                  <li><strong className="text-white font-mono">Rotate:</strong> Click and drag (or touch and drag on mobile)</li>
                  <li><strong className="text-white font-mono">Zoom:</strong> Scroll wheel (or pinch on mobile)</li>
                  <li><strong className="text-white font-mono">Pan:</strong> Right-click and drag (or two-finger drag)</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-1.5 font-mono text-xs text-accent">Controls</h4>
                <ul className="space-y-1 text-xs">
                  <li><strong className="text-white font-mono">Trees (top right):</strong> Switch between Red Oak, Sugar Maple, White Pine, and Bur Oak</li>
                  <li><strong className="text-white font-mono">Palette (top left):</strong> Choose height colormaps (Turbo, Viridis, Forest, Cividis)</li>
                  <li><strong className="text-white font-mono">Size (top left):</strong> Change point rendering size (Fine, Normal, Dense)</li>
                  <li><strong className="text-white font-mono">Scale: 6ft (bottom):</strong> Toggle a 6-foot surveyor figure for height reference</li>
                  <li><strong className="text-white font-mono">Rotate (bottom):</strong> Turn auto-rotation on or off</li>
                  <li><strong className="text-white font-mono">Reset (bottom):</strong> Return camera to default view</li>
                  <li><strong className="text-white font-mono">Touch 3D (mobile):</strong> Switch between rotating the tree and scrolling the page</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-border/80 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-700 text-white font-mono text-xs font-semibold border border-border hover:border-accent/50 transition-all cursor-pointer shadow-md"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
