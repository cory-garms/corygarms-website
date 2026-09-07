import React, { useMemo, useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// 3 Real Understory Forest SLAM Surveys from the CUTMAP field validation
const STANDS = [
  {
    id: 'livox_forest_grove',
    name: 'Stand 1: White Pine',
    type: 'Pinus strobus',
    desc: 'Towering mature white pine with open understory',
    points: '118,591',
    loopLength: '84.2 m',
    location: 'Burlington, MA Grove 1'
  },
  {
    id: 'livox_grove_loop_b',
    name: 'Stand 2: Deciduous',
    type: 'Mixed Hardwoods',
    desc: 'Multi-stem forks, leaning trunks, and irregular cross-sections',
    points: '118,240',
    loopLength: '92.6 m',
    location: 'Burlington, MA Grove 2'
  },
  {
    id: 'livox_grove_loop_c',
    name: 'Stand 3: Dense Understory',
    type: 'Shrub & Vine Understory',
    desc: 'Heavy brush obstacle navigation and dense sapling clusters',
    points: '117,994',
    loopLength: '96.8 m',
    location: 'Burlington, MA Grove 3'
  }
];

// Preload models for immediate switching
STANDS.forEach(stand => {
  useGLTF.preload(`/models/${stand.id}.glb`);
});

// Elevation-aware GLSL Shaders
const vertexShader = `
  uniform float uPointSize;
  uniform float uMinY;
  uniform float uMaxY;
  varying float vElevation;

  void main() {
    // Normalize elevation between 0.0 and 1.0 based on geometry bounds
    float range = max(uMaxY - uMinY, 0.001);
    vElevation = clamp((position.y - uMinY) / range, 0.0, 1.0);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform int uColorMode; // 0: Elevation Gradient, 1: Monochrome Laser Emerald
  uniform float uOpacity;
  varying float vElevation;

  // Curated scientific colormap for forestry mensuration:
  // Ground duff (deep teal) -> Trunk (emerald) -> Crown (chartreuse / cyan)
  vec3 getElevationColor(float t) {
    vec3 cGround = vec3(0.04, 0.22, 0.16);   // Deep forest floor
    vec3 cTrunk  = vec3(0.063, 0.725, 0.506); // Laser Emerald DBH
    vec3 cBranch = vec3(0.204, 0.827, 0.6);   // Branch structure
    vec3 cCanopy = vec3(0.22, 0.741, 0.973);  // Foliage / crown
    
    if (t < 0.25) {
      return mix(cGround, cTrunk, t / 0.25);
    } else if (t < 0.65) {
      return mix(cTrunk, cBranch, (t - 0.25) / 0.4);
    } else {
      return mix(cBranch, cCanopy, (t - 0.65) / 0.35);
    }
  }

  void main() {
    // Antialiased circular LiDAR splat
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    
    float alpha = smoothstep(0.5, 0.2, dist) * uOpacity;
    
    vec3 color;
    if (uColorMode == 0) {
      color = getElevationColor(vElevation);
    } else {
      color = vec3(0.063, 0.725, 0.506); // Solid Laser Emerald
    }
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Global cache for parsed geometry
const geometryCache = new Map();

function extractGeometry(scene, standId) {
  if (geometryCache.has(standId)) {
    return geometryCache.get(standId);
  }

  const meshes = [];
  scene.traverse(child => {
    if ((child.isMesh || child.isPoints) && child.geometry && child.geometry.attributes.position) {
      meshes.push(child);
    }
  });

  let totalCount = 0;
  meshes.forEach(m => {
    totalCount += m.geometry.attributes.position.count;
  });

  const step = totalCount > 120000 ? Math.ceil(totalCount / 100000) : 1;
  const targetCount = Math.floor(totalCount / step);

  const positions = new Float32Array(targetCount * 3);
  let posIdx = 0;
  const tempVec = new THREE.Vector3();

  meshes.forEach(m => {
    const posAttr = m.geometry.attributes.position;
    const matrix = m.matrixWorld;
    for (let i = 0; i < posAttr.count; i += step) {
      if (posIdx >= targetCount) break;
      tempVec.fromBufferAttribute(posAttr, i);
      tempVec.applyMatrix4(matrix);
      positions[posIdx * 3] = tempVec.x;
      positions[posIdx * 3 + 1] = tempVec.y;
      positions[posIdx * 3 + 2] = tempVec.z;
      posIdx++;
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.center();
  geometry.computeBoundingBox();

  const box = geometry.boundingBox;
  const maxDim = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z);
  if (maxDim > 60) {
    const scale = 42 / maxDim;
    geometry.scale(scale, scale, scale);
    geometry.computeBoundingBox();
  }

  const minY = geometry.boundingBox.min.y;
  const maxY = geometry.boundingBox.max.y;

  const data = {
    geometry,
    vertexCount: posIdx,
    minY,
    maxY
  };

  geometryCache.set(standId, data);
  return data;
}

// Sub-component: Point Cloud Mesh with dynamic uniforms
const ForestPointCloudMesh = ({ standId, colorMode, pointSize }) => {
  const { scene } = useGLTF(`/models/${standId}.glb`);

  const { geometry, minY, maxY } = useMemo(() => {
    return extractGeometry(scene, standId);
  }, [scene, standId]);

  const uniforms = useMemo(() => ({
    uPointSize: { value: pointSize },
    uMinY: { value: minY },
    uMaxY: { value: maxY },
    uColorMode: { value: colorMode },
    uOpacity: { value: 0.90 }
  }), [minY, maxY]);

  useEffect(() => {
    if (uniforms.uColorMode) uniforms.uColorMode.value = colorMode;
    if (uniforms.uPointSize) uniforms.uPointSize.value = pointSize;
    if (uniforms.uMinY) uniforms.uMinY.value = minY;
    if (uniforms.uMaxY) uniforms.uMaxY.value = maxY;
  }, [colorMode, pointSize, minY, maxY, uniforms]);

  return (
    <points>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        attach="material"
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
      />
    </points>
  );
};

// Camera Controller for Presets
const CameraPresetsHandler = ({ presetTrigger, controlsRef }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (!presetTrigger || !controlsRef.current) return;
    const { mode } = presetTrigger;
    const controls = controlsRef.current;

    if (mode === 'understory') {
      // Pedestrian understory view looking horizontally through tree trunks
      camera.position.set(0, 1.2, 10);
      controls.target.set(0, 1.2, 0);
    } else if (mode === 'orbit') {
      // Classic 3D oblique perspective
      camera.position.set(18, 14, 20);
      controls.target.set(0, 0, 0);
    } else if (mode === 'topdown') {
      // Breast-height slice / SLAM map view
      camera.position.set(0, 32, 0.05);
      controls.target.set(0, 0, 0);
    }
    controls.update();
  }, [presetTrigger, camera, controlsRef]);

  return null;
};

export default function CutmapLidarViewer() {
  const [currentStandId, setCurrentStandId] = useState('livox_forest_grove');
  const [colorMode, setColorMode] = useState(0); // 0: Elevation Gradient, 1: Monochrome Laser
  const [pointSize, setPointSize] = useState(0.08);
  const [isRotating, setIsRotating] = useState(true);
  const [presetTrigger, setPresetTrigger] = useState({ mode: 'orbit', ts: Date.now() });

  const controlsRef = useRef(null);
  const currentStand = STANDS.find(s => s.id === currentStandId) || STANDS[0];

  const handlePreset = (mode) => {
    setPresetTrigger({ mode, ts: Date.now() });
  };

  return (
    <div className="relative w-full rounded-2xl border border-border overflow-hidden bg-forest-950 select-none shadow-2xl">
      
      {/* Canvas Viewport */}
      <div className="w-full h-[480px] sm:h-[580px] md:h-[640px] relative">
        <Canvas
          camera={{ position: [18, 14, 20], fov: 45, near: 0.5, far: 1000 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#060a08']} />
          <ambientLight intensity={0.5} />
          
          <Suspense fallback={null}>
            <ForestPointCloudMesh
              standId={currentStandId}
              colorMode={colorMode}
              pointSize={pointSize}
            />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            autoRotate={isRotating}
            autoRotateSpeed={0.8}
            enableDamping={true}
            dampingFactor={0.05}
            maxDistance={80}
            minDistance={2}
          />

          <CameraPresetsHandler presetTrigger={presetTrigger} controlsRef={controlsRef} />
        </Canvas>

        {/* TOP-LEFT: Stand Switcher Selector */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-forest-900/90 backdrop-blur-md border border-border shadow-xl">
          {STANDS.map(stand => {
            const isActive = stand.id === currentStandId;
            return (
              <button
                key={stand.id}
                onClick={() => setCurrentStandId(stand.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-forest-800 text-accent border border-accent/40 shadow-sm'
                    : 'text-text-muted hover:text-white hover:bg-forest-800/50 border border-transparent'
                }`}
                title={stand.desc}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-accent animate-pulse' : 'bg-text-dim'}`}></span>
                <span>{stand.name}</span>
              </button>
            );
          })}
        </div>

        {/* TOP-RIGHT: Visual & Shading Controls */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 flex items-center gap-2">
          
          {/* Elevation vs Monochrome Colormap Toggle */}
          <button
            onClick={() => setColorMode(colorMode === 0 ? 1 : 0)}
            className="px-3 py-1.5 rounded-xl bg-forest-900/90 backdrop-blur-md border border-border hover:border-accent/40 text-xs font-mono text-text-muted hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-lg"
            title="Toggle between Elevation Height Gradient and Monochrome Laser Emerald"
          >
            <span className="w-2.5 h-2.5 rounded-full flex overflow-hidden border border-border">
              {colorMode === 0 ? (
                <span className="w-full h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-cyan-400"></span>
              ) : (
                <span className="w-full h-full bg-emerald-400"></span>
              )}
            </span>
            <span className="hidden sm:inline">{colorMode === 0 ? 'Elevation Colormap' : 'Laser Monochrome'}</span>
            <span className="sm:hidden">{colorMode === 0 ? 'Elevation' : 'Laser'}</span>
          </button>

          {/* Auto-Rotation Toggle */}
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
              isRotating
                ? 'bg-forest-800 text-accent border-accent/40 shadow-sm'
                : 'bg-forest-900/90 text-text-dim border-border hover:text-text-muted'
            }`}
            title={isRotating ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation'}
            aria-label="Toggle Auto-Rotation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* BOTTOM-LEFT: Perspective Presets (Understory / Orbit / SLAM Slice) */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-10 flex items-center gap-1 p-1 rounded-xl bg-forest-900/90 backdrop-blur-md border border-border shadow-xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim px-2 hidden sm:inline">Camera:</span>
          <button
            onClick={() => handlePreset('understory')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-text-muted hover:text-white hover:bg-forest-800 transition-colors cursor-pointer"
            title="Pedestrian Eye-Level Understory Perspective"
          >
            Understory
          </button>
          <button
            onClick={() => handlePreset('orbit')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-text-muted hover:text-white hover:bg-forest-800 transition-colors cursor-pointer"
            title="3D Oblique Orbit View"
          >
            3D Orbit
          </button>
          <button
            onClick={() => handlePreset('topdown')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-text-muted hover:text-white hover:bg-forest-800 transition-colors cursor-pointer"
            title="Top-Down 2D SLAM Slice View (z = 1.37m)"
          >
            2D Slice
          </button>
        </div>

        {/* BOTTOM-RIGHT: Scientific Telemetry HUD */}
        <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-10 p-2.5 sm:p-3 rounded-xl bg-forest-900/90 backdrop-blur-md border border-border shadow-xl text-[10px] sm:text-[11px] font-mono text-text-muted max-w-[240px] sm:max-w-none">
          <div className="flex items-center justify-between gap-4 mb-1">
            <span className="text-white font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping"></span>
              {currentStand.name}
            </span>
            <span className="text-accent font-bold">{currentStand.points} pts</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-text-dim text-[10px]">
            <span>Livox Mid-360S • 200 Hz IMU</span>
            <span>Loop: {currentStand.loopLength}</span>
          </div>
        </div>

      </div>

      {/* Under-Viewer Telemetry Bar & Interaction Instructions */}
      <div className="p-3 sm:p-4 bg-surface border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-text-muted">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent"></span>
          <span className="text-text-main font-semibold">Active Dataset:</span>
          <span>{currentStand.desc} ({currentStand.location})</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-text-dim">
          <span>&bull; Left-Drag: Orbit / Rotate</span>
          <span>&bull; Scroll: Zoom Depth</span>
          <span>&bull; Right-Drag: Pan Stand</span>
        </div>
      </div>

    </div>
  );
}
