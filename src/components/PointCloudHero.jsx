import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Curated default scenes highlighting Remote Sensing & Field Science
const SCENES = [
  { 
    id: 'livox_forest_grove', 
    name: 'Grove A', 
    spec: 'Livox Mid-360 LiDAR',
    source: 'Outdoor Forest SLAM (118k pts)'
  },
  { 
    id: 'livox_grove_loop_b', 
    name: 'Grove B', 
    spec: 'Livox Mid-360 LiDAR',
    source: 'Outdoor Forest SLAM (118k pts)'
  },
  { 
    id: 'livox_grove_loop_c', 
    name: 'Grove C', 
    spec: 'Livox Mid-360 LiDAR',
    source: 'Outdoor Forest SLAM (118k pts)'
  }
];

// Pre-load all 3 Livox scans for instant switching
SCENES.forEach(scene => {
  useGLTF.preload(`/models/${scene.id}.glb`);
});

// Clean, robust GLSL Shaders for antialiased circular LiDAR points
const vertexShader = `
  uniform float uPointSize;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uPointSize * (280.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    // Smooth circular antialiased lidar points
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.25, dist) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
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

  const step = totalVertexCount > 120000 ? Math.ceil(totalVertexCount / 100000) : 1;
  const targetCount = Math.floor(totalVertexCount / step);

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
    const scale = 40 / maxDim;
    geometry.scale(scale, scale, scale);
    geometry.computeBoundingBox();
  }

  const cachedData = {
    geometry,
    vertexCount: posIdx
  };

  geometryCache.set(sceneId, cachedData);
  return cachedData;
}

// Point Cloud Render Component
const PointCloudMesh = ({ sceneId }) => {
  const { scene } = useGLTF(`/models/${sceneId}.glb`);

  const sceneData = useMemo(() => {
    return extractOptimizedGeometry(scene, sceneId);
  }, [scene, sceneId]);

  const uniforms = useMemo(() => ({
    uPointSize: { value: 0.075 },
    uColor: { value: new THREE.Color('#10b981') }, // Laser emerald
    uOpacity: { value: 0.88 }
  }), []);

  return (
    <points>
      <primitive object={sceneData.geometry} attach="geometry" />
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
  const [currentSceneId, setCurrentSceneId] = useState('livox_forest_grove');
  const [isRotating, setIsRotating] = useState(true);
  const [is3DActive, setIs3DActive] = useState(true);
  const [touchRotateEnabled, setTouchRotateEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  const toggle3D = () => {
    const next = !is3DActive;
    setIs3DActive(next);
    localStorage.setItem('cgarms_3d_enabled', next ? 'true' : 'false');
  };

  const activeScene = SCENES.find(s => s.id === currentSceneId) || SCENES[0];

  return (
    <div className="relative w-full h-full select-none bg-[#070b09] overflow-hidden">
      {/* 3D WebGL Canvas (Rendered only when active to save mobile battery/GPU) */}
      {is3DActive ? (
        <Canvas 
          camera={{ position: [20, 12, 22], fov: 45, near: 0.5, far: 1200 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#070b09']} />
          <fog attach="fog" args={['#070b09', 25, 75]} />

          <Suspense fallback={null}>
            <PointCloudMesh sceneId={currentSceneId} />
          </Suspense>
          
          <OrbitControls 
            autoRotate={isRotating} 
            autoRotateSpeed={0.4} 
            enablePan={!isMobile || touchRotateEnabled}
            enableRotate={!isMobile || touchRotateEnabled}
            enableZoom={!isMobile}
            enableDamping={true}
            dampingFactor={0.08}
          />
        </Canvas>
      ) : (
        /* 2D Fallback View when 3D is toggled OFF (100% scroll-friendly, zero GPU/battery drain) */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center topo-grid bg-gradient-to-b from-[#070b09] via-forest-950/40 to-[#070b09]">
          <div className="max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-surface/85 border border-border/80 backdrop-blur-md shadow-2xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900 border border-emerald-500/30 text-xs font-mono text-emerald-300 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Livox Mid-360 LiDAR SLAM</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
              Outdoor Forest Point Cloud
            </h3>
            <p className="text-xs text-text-muted leading-relaxed mb-6 max-w-sm mx-auto">
              3D WebGL engine is paused for smooth mobile scrolling and battery savings. Tap below to launch the interactive 3D point cloud.
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

      {/* Top Bar: Persistent 3D Toggle & Scene Selector */}
      <div className="absolute top-4 left-4 right-4 sm:left-6 sm:right-6 flex items-center justify-between gap-2.5 z-20 pointer-events-none">
        
        {/* Left: Prominent 3D Engine Toggle Pill */}
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
        </div>

        {/* Right / Center: Scene Switcher (Visible when 3D is active) */}
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

          {/* Scene Info Pill */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-text-muted bg-surface/80 px-3 py-1.5 rounded-xl border border-border/80 backdrop-blur-md shadow-lg pointer-events-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            <span className="text-white font-medium">{activeScene.name}</span>
            <span className="text-text-dim">&bull;</span>
            <span>{activeScene.spec}</span>
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
