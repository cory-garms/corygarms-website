import React, { useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';

const COLOR_MAPS = {
  default: { dark: '#5d1879', main: '#df6677', accent: '#f58860' },
  viridis: { dark: '#440154', main: '#21918c', accent: '#fde725' },
  magma:   { dark: '#000004', main: '#b73779', accent: '#fcffa4' }
};

const SCENES = [
  { id: 'pine_forest', name: 'Pine Forest', format: 'glb' },
  { id: 'boston_massachusetts_usa', name: 'Boston', format: 'glb' },
  { id: 'underwater_terrain_-_agisoftnaturechallenge', name: 'Underwater', format: 'glb' },
  { id: 'lockheed_sr-71_blackbird', name: 'SR-71', format: 'glb' },
  { id: 'toyota_supra_mk_iv_1994', name: 'Supra', format: 'glb' },
  { id: 'us_battleship_louisiana', name: 'Battleship', format: 'glb' }
];

// Reusable function to apply our custom colormap to a BufferGeometry
const applyColormap = (geometry, colormap) => {
    geometry.center();
    geometry.computeBoundingBox();
    
    const maxDim = Math.max(
        geometry.boundingBox.max.x - geometry.boundingBox.min.x,
        geometry.boundingBox.max.y - geometry.boundingBox.min.y,
        geometry.boundingBox.max.z - geometry.boundingBox.min.z
    );
    if (maxDim > 100) {
        const scale = 50 / maxDim;
        geometry.scale(scale, scale, scale);
        geometry.computeBoundingBox();
    }
    
    // If not recoloring, bail out after center/scale
    if (colormap === 'original') return geometry;

    const minY = geometry.boundingBox.min.y;
    const maxY = geometry.boundingBox.max.y;
    const range = maxY - minY || 1;

    const positions = geometry.attributes.position.array;
    const count = positions.length / 3;
    const colors = new Float32Array(count * 3);

    const cmap = COLOR_MAPS[colormap] || COLOR_MAPS['default'];
    const colorMain = new THREE.Color(cmap.main);
    const colorAccent = new THREE.Color(cmap.accent);
    const colorDark = new THREE.Color(cmap.dark);

    for(let i = 0; i < count; i++) {
       const y = positions[i * 3 + 1];
       const normalizedY = (y - minY) / range;
       
       const mixedColor = colorDark.clone();
       if (normalizedY > 0.5) {
           mixedColor.lerp(colorAccent, (normalizedY - 0.5) * 2);
       } else {
           mixedColor.lerp(colorMain, normalizedY * 2);
       }
       
       colors[i*3] = mixedColor.r;
       colors[i*3+1] = mixedColor.g;
       colors[i*3+2] = mixedColor.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
};

const GlbPointCloud = ({ sceneId, renderMode, colormap }) => {
    try {
        const { scene } = useGLTF(`/models/${sceneId}.glb`);
        const pointsRef = useRef();

        // Calculate bounding box and scale for the whole scene (used for both mesh and points)
        const sceneMetrics = useMemo(() => {
            const box = new THREE.Box3().setFromObject(scene);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const scaleFactor = maxDim > 100 ? 50 / maxDim : 1;
            return { center, scaleFactor };
        }, [scene, sceneId]);

        const geometry = useMemo(() => {
            if (renderMode !== 'points') return null;

            const geometries = [];
            scene.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    const geom = child.geometry.clone();
                    geom.applyMatrix4(child.matrixWorld);
                    geometries.push(geom);
                }
            });

            if (geometries.length === 0) return new THREE.BufferGeometry();

            let totalArrayLength = 0;
            geometries.forEach(g => {
                if (g.attributes.position) totalArrayLength += g.attributes.position.array.length;
            });
            
            const mergedPositions = new Float32Array(totalArrayLength);
            let offset = 0;
            geometries.forEach(g => {
                if (g.attributes.position) {
                    mergedPositions.set(g.attributes.position.array, offset);
                    offset += g.attributes.position.array.length;
                }
            });

            const mergedGeom = new THREE.BufferGeometry();
            mergedGeom.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
            
            return applyColormap(mergedGeom, colormap);
        }, [scene, colormap, sceneId, renderMode]);

        // If 'mesh', render the native GLB model with its original textures
        if (renderMode === 'mesh') {
             return (
                 <group 
                     scale={sceneMetrics.scaleFactor} 
                     position={[-sceneMetrics.center.x * sceneMetrics.scaleFactor, -sceneMetrics.center.y * sceneMetrics.scaleFactor, -sceneMetrics.center.z * sceneMetrics.scaleFactor]}
                 >
                     <primitive object={scene} />
                 </group>
             );
        }

        // If 'points', render the synthesized point cloud
        return (
            <points ref={pointsRef}>
                <bufferGeometry attach="geometry" {...geometry} />
                <pointsMaterial attach="material" size={0.05} vertexColors={true} sizeAttenuation={true} transparent opacity={0.8} />
            </points>
        );
    } catch(e) {
        return null; // Fallback if file doesn't exist
    }
};

const PcdViewer = ({ sceneId, renderMode, colormap }) => {
    try {
        const pcd = useLoader(PCDLoader, `/models/${sceneId}.pcd`);
        const pointsRef = useRef();

        useMemo(() => {
            if (!pcd || !pcd.geometry) return;
            // Native PCD colors are requested via 'original' mapping
            applyColormap(pcd.geometry, renderMode === 'mesh' ? 'original' : colormap);
            pcd.material.size = 0.05;
            pcd.material.vertexColors = true;
            pcd.material.needsUpdate = true;
        }, [pcd, colormap, sceneId, renderMode]);

        return <primitive object={pcd} ref={pointsRef} />;
    } catch(e) {
        return null;
    }
};

const DynamicModelViewer = ({ sceneConfig, renderMode, colormap }) => {
    if (!sceneConfig) return null;
    if (sceneConfig.format === 'glb') {
        return <GlbPointCloud sceneId={sceneConfig.id} renderMode={renderMode} colormap={colormap} />;
    }
    return <PcdViewer sceneId={sceneConfig.id} renderMode={renderMode} colormap={colormap} />;
};

const getBackgroundColor = (sceneId, renderMode) => {
    // Only apply custom background colors in solid mesh mode. 
    // Point clouds always use the default slate to match the site aesthetic.
    if (renderMode !== 'mesh') return '#0d0d12';

    switch (sceneId) {
        case 'underwater_terrain_-_agisoftnaturechallenge': return '#0f3b7d'; // Cobalt blue
        case 'toyota_supra_mk_iv_1994': return '#292c33'; // Dark grey
        case 'us_battleship_louisiana': return '#152e1f'; // Dark green
        case 'lockheed_sr-71_blackbird': return '#8ea3b8'; // Light blue grey
        default: return '#0d0d12';
    }
};

export default function PointCloudHero() {
  const [colormap, setColormap] = useState('default');
  const [renderMode, setRenderMode] = useState('mesh');
  const [currentScene, setCurrentScene] = useState('pine_forest');

  const bgColor = getBackgroundColor(currentScene, renderMode);

  // We add some directional light exclusively for the 'mesh' view since point clouds don't need lighting
  return (
    <div className="relative w-full h-full group">
      <Canvas 
          camera={{ position: [25, 15, 25], fov: 45, near: 0.1, far: 500000 }}
          gl={{ antialias: false, powerPreference: 'high-performance', logarithmicDepthBuffer: true }}
      >
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={[bgColor, 10, 40]} />

        {renderMode === 'mesh' && (
            <>
                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 20, 10]} intensity={2.0} />
                <directionalLight position={[-10, 10, -10]} intensity={1.0} color="#df6677" />
            </>
        )}

        <Suspense fallback={null}>
            <DynamicModelViewer sceneConfig={SCENES.find(s => s.id === currentScene)} renderMode={renderMode} colormap={colormap} />
        </Suspense>
        
        <OrbitControls 
          autoRotate 
          autoRotateSpeed={0.5} 
          enablePan={true}
          enableZoom={true}
        />
      </Canvas>
      
      {/* Scene Selectors Overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 z-10 opacity-30 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
         {SCENES.map(scene => (
             <button 
                 key={scene.id} 
                 onClick={() => setCurrentScene(scene.id)} 
                 className={`px-3 py-1.5 text-xs font-mono rounded border ${currentScene === scene.id ? 'bg-primary-600/80 border-primary-400 text-white shadow-[0_0_10px_rgba(139,43,136,0.3)]' : 'bg-surface/80 border-primary-800/50 text-text-muted hover:border-primary-500 hover:text-white backdrop-blur-sm'} transition-all`}
             >
                 {scene.name}
             </button>
         ))}
      </div>

      {/* View Mode & Colormap Toggles Overlay */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-10 opacity-30 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
         
         {/* Top switch: Render mode */}
         <div className="flex bg-surface/50 p-1 rounded-lg border border-primary-800/50 backdrop-blur-sm">
             <button onClick={() => setRenderMode('points')} className={`px-4 py-1.5 text-xs font-mono rounded ${renderMode === 'points' ? 'bg-primary-600 text-white shadow-md' : 'text-text-muted hover:text-white'} transition-all`}>Lidar Points</button>
             <button onClick={() => setRenderMode('mesh')} className={`px-4 py-1.5 text-xs font-mono rounded ${renderMode === 'mesh' ? 'bg-primary-600 text-white shadow-md' : 'text-text-muted hover:text-white'} transition-all`}>Native Texture</button>
         </div>

         {/* Bottom switch: Colormaps (only visible in point cloud mode) */}
         <div className={`flex gap-2 transition-all duration-300 ${renderMode === 'mesh' ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <button onClick={() => setColormap('default')} className={`px-3 py-1.5 text-xs font-mono rounded border ${colormap === 'default' ? 'bg-[#df6677]/80 border-[#f58860] text-white shadow-[0_0_10px_rgba(223,102,119,0.5)]' : 'bg-surface/80 border-primary-800/50 text-text-muted hover:border-[#df6677] hover:text-white backdrop-blur-sm'} transition-all`}>Standard</button>
            <button onClick={() => setColormap('viridis')} className={`px-3 py-1.5 text-xs font-mono rounded border ${colormap === 'viridis' ? 'bg-[#21918c]/80 border-[#fde725] text-white shadow-[0_0_10px_rgba(33,145,140,0.5)]' : 'bg-surface/80 border-primary-800/50 text-text-muted hover:border-[#21918c] hover:text-white backdrop-blur-sm'} transition-all`}>Viridis</button>
            <button onClick={() => setColormap('magma')} className={`px-3 py-1.5 text-xs font-mono rounded border ${colormap === 'magma' ? 'bg-[#b73779]/80 border-[#fcffa4] text-white shadow-[0_0_10px_rgba(183,55,121,0.5)]' : 'bg-surface/80 border-primary-800/50 text-text-muted hover:border-[#b73779] hover:text-white backdrop-blur-sm'} transition-all`}>Magma</button>
         </div>
      </div>

      <div className="absolute bottom-6 left-6 z-10 opacity-30 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none">
        <p className="text-xs font-mono text-text-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Interactive Viewer (Scroll to zoom, drag to pan)
        </p>
      </div>
    </div>
  );
}
