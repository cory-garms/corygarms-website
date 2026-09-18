import React, { useMemo, useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Curated default scenes highlighting Remote Sensing & Field Science
const SCENES = [
  { 
    id: 'huge_oak', 
    name: 'Red Oak', 
    species: 'Quercus rubra (Red Oak)',
    spec: 'Terrestrial LiDAR Survey',
    source: 'Red Oak Clean Laser Scan (1.52M pts survey)',
    points: '1.52M pts',
    height: '28.4 m',
    spread: '28.8 m'
  },
  { 
    id: 'livox_forest_grove', 
    name: 'Grove 1', 
    species: 'Pinus strobus (White Pine)',
    spec: 'Livox Mid-360 LiDAR',
    source: 'Outdoor Forest SLAM (118k pts)',
    points: '118k pts',
    height: '18.2 m',
    spread: '14.5 m'
  },
  { 
    id: 'livox_grove_loop_b', 
    name: 'Grove 2', 
    species: 'Pinus strobus (White Pine)',
    spec: 'Livox Mid-360 LiDAR',
    source: 'Outdoor Forest SLAM (118k pts)',
    points: '118k pts',
    height: '17.8 m',
    spread: '16.1 m'
  },
  { 
    id: 'livox_grove_loop_c', 
    name: 'Grove 3', 
    species: 'Pinus strobus (White Pine)',
    spec: 'Livox Mid-360 LiDAR',
    source: 'Outdoor Forest SLAM (118k pts)',
    points: '118k pts',
    height: '16.5 m',
    spread: '15.3 m'
  }
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
    name: 'Laser Emerald',
    label: 'Laser Monochrome',
    swatch: 'bg-emerald-400',
    desc: 'Signature tactical LiDAR emerald (#10b981)',
    tag: 'Monochrome'
  },
  {
    id: 5,
    name: 'Electric Cyan',
    label: 'Cyan Topo',
    swatch: 'bg-gradient-to-r from-blue-900 via-cyan-500 to-cyan-200',
    desc: 'Deep marine basin → High topographic cyan',
    tag: 'Topo'
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
    gl_PointSize = uPointSize * (290.0 / -mvPosition.z);
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

  // 5: Electric Cyan Topo
  vec3 getElectricCyanColor(float t) {
    vec3 c0 = vec3(0.02, 0.10, 0.18);
    vec3 c1 = vec3(0.02, 0.45, 0.65);
    vec3 c2 = vec3(0.05, 0.75, 0.95);
    vec3 c3 = vec3(0.60, 0.95, 1.00);
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
      color = vec3(0.063, 0.725, 0.506); // Solid Laser Emerald (#10b981)
    } else {
      color = getElectricCyanColor(vElevation);
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

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
const PointCloudMesh = ({ sceneId, colorMode, pointSize }) => {
  const { scene } = useGLTF(`/models/${sceneId}.glb`);

  const { geometry, minY, maxY } = useMemo(() => {
    return extractOptimizedGeometry(scene, sceneId);
  }, [scene, sceneId]);

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

export default function PointCloudHero() {
  const [currentSceneId, setCurrentSceneId] = useState('huge_oak');
  const [colorMode, setColorMode] = useState(0); // 0: Forestry, 1: Viridis, 2: Magma, 3: Reflectance, 4: Laser Emerald, 5: Electric Cyan
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [pointSize, setPointSize] = useState(0.08);
  const [isRotating, setIsRotating] = useState(true);
  const [is3DActive, setIs3DActive] = useState(true);
  const [touchRotateEnabled, setTouchRotateEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const paletteRef = useRef(null);

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

  // Close palette dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setIsPaletteOpen(false);
      }
    };
    if (isPaletteOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isPaletteOpen]);

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
              sceneId={currentSceneId}
              colorMode={colorMode}
              pointSize={pointSize}
            />
          </Suspense>
          
          <OrbitControls 
            autoRotate={isRotating} 
            autoRotateSpeed={0.5} 
            enablePan={!isMobile || touchRotateEnabled}
            enableRotate={!isMobile || touchRotateEnabled}
            enableZoom={!isMobile}
            enableDamping={true}
            dampingFactor={0.08}
            minDistance={4}
            maxDistance={120}
          />
        </Canvas>
      ) : (
        /* 2D Fallback View when 3D is toggled OFF (scroll-friendly, zero GPU drain) */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center topo-grid bg-gradient-to-b from-[#070b09] via-forest-950/40 to-[#070b09]">
          <div className="max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-surface/85 border border-border/80 backdrop-blur-md shadow-2xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900 border border-emerald-500/30 text-xs font-mono text-emerald-300 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Terrestrial LiDAR Survey • 1.52M Pts</span>
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

      {/* Top Bar: Persistent 3D Toggle, Colormap Palette Selector & Scene Switcher */}
      <div className="absolute top-4 left-4 right-4 sm:left-6 sm:right-6 flex flex-wrap items-center justify-between gap-2.5 z-20 pointer-events-none">
        
        {/* Left: 3D Engine Toggle & Interactive Color Palette Picker */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={toggle3D}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono transition-all cursor-pointer shadow-lg ${
              is3DActive 
                ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/90' 
                : 'bg-surface/90 text-text-muted border-border hover:border-accent/50 hover:text-white'
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
                <span className={`w-2.5 h-2.5 rounded-full flex overflow-hidden border border-white/20 shadow-sm ${activeColor.swatch}`}></span>
                <span className="font-medium">{activeColor.name}</span>
                <svg className={`w-3 h-3 text-text-dim transition-transform duration-200 ${isPaletteOpen ? 'rotate-180 text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Palette Dropdown Popover */}
              {isPaletteOpen && (
                <div className="absolute left-0 mt-2 w-56 p-1.5 rounded-2xl bg-forest-950/95 border border-border/90 backdrop-blur-xl shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-text-dim border-b border-border/60 mb-1 flex items-center justify-between">
                    <span>LiDAR Palette</span>
                    <span className="text-[9px] text-accent/80">6 Modes</span>
                  </div>
                  <div className="space-y-0.5">
                    {COLOR_MODES.map(mode => {
                      const isSelected = mode.id === colorMode;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => {
                            setColorMode(mode.id);
                            setIsPaletteOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-forest-800/90 text-white border border-accent/40 shadow-sm'
                              : 'hover:bg-forest-900 text-text-muted hover:text-white border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/20 shadow-sm ${mode.swatch}`}></span>
                            <div className="min-w-0">
                              <div className="text-xs font-mono font-medium truncate">{mode.name}</div>
                              <div className="text-[10px] text-text-dim truncate">{mode.tag}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <svg className="w-3.5 h-3.5 text-accent flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
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
        <div className="absolute bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-20 pointer-events-none flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
          
          {/* Mobile Touch Mode Helper Pill (on small screens) */}
          {isMobile && (
            <button
              onClick={() => setTouchRotateEnabled(!touchRotateEnabled)}
              className={`pointer-events-auto sm:hidden flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-lg transition-all cursor-pointer ${
                touchRotateEnabled 
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10' 
                  : 'bg-surface/85 text-text-muted border-border/80'
              }`}
              title="Toggle single-finger touch interaction vs. page scrolling"
            >
              <span>{touchRotateEnabled ? '👆 Touch to Spin (ON)' : '📜 Scroll Friendly'}</span>
            </button>
          )}

          {/* Scene Info & Telemetry Pill */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-text-muted bg-surface/80 px-3 py-1.5 rounded-xl border border-border/80 backdrop-blur-md shadow-lg pointer-events-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            <span className="text-white font-medium">{activeScene.name}</span>
            <span className="text-text-dim">&bull;</span>
            <span>{activeScene.spec}</span>
            <span className="text-text-dim">&bull;</span>
            <span className="text-accent">{activeScene.points}</span>
            {activeScene.height && (
              <>
                <span className="text-text-dim">&bull;</span>
                <span className="text-text-main">{activeScene.height} H</span>
              </>
            )}
            <span className="text-text-dim">&bull;</span>
            <span className="text-text-dim">{activeColor.name}</span>
          </div>

          {/* Orbit Auto-Rotation Toggle & Interaction Hint */}
          <div className="pointer-events-auto flex items-center gap-2.5 text-[11px] font-mono text-text-muted bg-surface/80 px-3 py-1.5 rounded-xl border border-border/80 backdrop-blur-md shadow-lg">
            <button 
              onClick={() => setIsRotating(!isRotating)}
              className="hover:text-accent text-text-main transition-colors flex items-center gap-1.5 cursor-pointer"
              title={isRotating ? 'Pause automatic rotation' : 'Resume automatic rotation'}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isRotating ? 'bg-accent' : 'bg-text-dim'}`}></span>
              <span>{isRotating ? 'Pause' : 'Rotate'}</span>
            </button>
            <span className="text-text-dim hidden sm:inline">&bull;</span>
            <span className="text-text-dim hidden sm:inline">Drag to inspect</span>
          </div>
        </div>
      )}
    </div>
  );
}
