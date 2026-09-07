import React, { useMemo, useState, Suspense } from 'react';
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

  const activeScene = SCENES.find(s => s.id === currentSceneId) || SCENES[0];

  return (
    <div className="relative w-full h-full select-none bg-[#070b09]">
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
          enablePan={true}
          enableZoom={true}
          enableDamping={true}
          dampingFactor={0.08}
        />
      </Canvas>

      {/* Top Center: Scene Selector */}
      <div className="absolute top-5 right-6 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 flex items-center gap-1.5 z-20 pointer-events-auto bg-surface/80 p-1 rounded-xl border border-border/80 backdrop-blur-md shadow-lg">
        {SCENES.map(scene => (
          <button 
            key={scene.id} 
            onClick={() => setCurrentSceneId(scene.id)} 
            className={`px-3 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
              currentSceneId === scene.id 
                ? 'bg-forest-700 text-white border border-accent/40 shadow-sm' 
                : 'text-text-muted hover:text-white hover:bg-forest-850'
            }`}
          >
            {scene.name}
          </button>
        ))}
      </div>

      {/* Bottom Right: Clean HUD Controls */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-auto flex items-center gap-3">
        {/* Scene Info Pill */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-text-muted bg-surface/80 px-3 py-1.5 rounded-xl border border-border/80 backdrop-blur-md shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
          <span className="text-white font-medium">{activeScene.name}</span>
          <span className="text-text-dim">&bull;</span>
          <span>{activeScene.spec}</span>
        </div>

        {/* Orbit Auto-Rotation Toggle & Interaction Hint */}
        <div className="flex items-center gap-2.5 text-[11px] font-mono text-text-muted bg-surface/80 px-3 py-1.5 rounded-xl border border-border/80 backdrop-blur-md shadow-lg">
          <button 
            onClick={() => setIsRotating(!isRotating)}
            className="hover:text-accent text-text-main transition-colors flex items-center gap-1.5 cursor-pointer"
            title={isRotating ? 'Pause automatic rotation' : 'Resume automatic rotation'}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${isRotating ? 'bg-accent' : 'bg-text-dim'}`}></span>
            <span>{isRotating ? 'Pause' : 'Rotate'}</span>
          </button>
          <span className="text-text-dim">&bull;</span>
          <span className="text-text-dim">Drag to inspect</span>
        </div>
      </div>
    </div>
  );
}
