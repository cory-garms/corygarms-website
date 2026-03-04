import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const COLOR_MAPS = {
  default: { dark: '#5d1879', main: '#df6677', accent: '#f58860' },
  viridis: { dark: '#440154', main: '#21918c', accent: '#fde725' },
  magma:   { dark: '#000004', main: '#b73779', accent: '#fcffa4' }
};

// Procedural Point Cloud Generator mimicking a landscape or canopy
const Points = ({ count = 50000, colormap = 'default' }) => {
  const pointsRef = useRef();

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cmap = COLOR_MAPS[colormap] || COLOR_MAPS['default'];
    const colorMain = new THREE.Color(cmap.main);
    const colorAccent = new THREE.Color(cmap.accent);
    const colorDark = new THREE.Color(cmap.dark);

    for (let i = 0; i < count; i++) {
        // Generate points in a rough terrain/canopy-like distribution
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        
        // Simulating ground + canopy
        let y = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 2;
        
        // Add some noise and "trees"
        if (Math.random() > 0.8) {
            y += Math.random() * 4; // Tree height
        }
        
        y += Math.random() * 0.5; // Surface noise

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Color based on height (pseudo-viridis/magma)
        const mixedColor = colorDark.clone();
        if (y > 2) {
            mixedColor.lerp(colorAccent, (y - 2) / 4);
        } else {
            mixedColor.lerp(colorMain, (y + 2) / 4);
        }

        colors[i * 3] = mixedColor.r;
        colors[i * 3 + 1] = mixedColor.g;
        colors[i * 3 + 2] = mixedColor.b;
    }

    return [positions, colors];
  }, [count, colormap]);

  useFrame((state) => {
    // Slow cinematic rotation
    if (pointsRef.current) {
        pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors={true}
        transparent={true}
        opacity={0.8}
        sizeAttenuation={true}
      />
    </points>
  );
};

export default function PointCloudHero() {
  const [colormap, setColormap] = useState('default');

  return (
    <div className="relative w-full h-full group">
      <Canvas 
          camera={{ position: [15, 8, 15], fov: 45 }}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          frameloop="demand" // Optimized: only renders when needed
      >
        <color attach="background" args={['#0d0d12']} />
        <fog attach="fog" args={['#0d0d12', 10, 40]} />
        <Points key={colormap} count={50000} colormap={colormap} />
        <OrbitControls 
          autoRotate 
          autoRotateSpeed={0.5} 
          enablePan={true}
          enableZoom={true}
          maxPolarAngle={Math.PI / 2 + 0.1} // Prevent looking from too far below
        />
      </Canvas>
      
      {/* Colormap Toggles Overlay */}
      <div className="absolute bottom-6 right-6 flex gap-2 z-10 opacity-30 group-hover:opacity-100 transition-opacity duration-300">
         <button onClick={() => setColormap('default')} className={`px-3 py-1.5 text-xs font-mono rounded border ${colormap === 'default' ? 'bg-primary-600/80 border-primary-400 text-white shadow-[0_0_15px_rgba(139,43,136,0.5)]' : 'bg-surface/80 border-primary-800/50 text-text-muted hover:border-primary-500 hover:text-white backdrop-blur-sm'} transition-all`}>Standard</button>
         <button onClick={() => setColormap('viridis')} className={`px-3 py-1.5 text-xs font-mono rounded border ${colormap === 'viridis' ? 'bg-[#21918c]/80 border-[#fde725] text-white shadow-[0_0_15px_rgba(33,145,140,0.5)]' : 'bg-surface/80 border-primary-800/50 text-text-muted hover:border-[#21918c] hover:text-white backdrop-blur-sm'} transition-all`}>Viridis</button>
         <button onClick={() => setColormap('magma')} className={`px-3 py-1.5 text-xs font-mono rounded border ${colormap === 'magma' ? 'bg-[#b73779]/80 border-[#fcffa4] text-white shadow-[0_0_15px_rgba(183,55,121,0.5)]' : 'bg-surface/80 border-primary-800/50 text-text-muted hover:border-[#b73779] hover:text-white backdrop-blur-sm'} transition-all`}>Magma</button>
      </div>

      <div className="absolute bottom-6 left-6 z-10 opacity-30 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none">
        <p className="text-xs font-mono text-text-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Interactive Point Cloud (Scroll to zoom, drag to pan)
        </p>
      </div>
    </div>
  );
}
