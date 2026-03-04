import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Procedural Point Cloud Generator mimicking a landscape or canopy
const Points = ({ count = 20000 }) => {
  const pointsRef = useRef();

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorMain = new THREE.Color('#df6677'); // primary-400
    const colorAccent = new THREE.Color('#f58860'); // accent-300
    const colorDark = new THREE.Color('#5d1879'); // primary-700

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
  }, [count]);

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
  return (
    <Canvas 
        camera={{ position: [15, 8, 15], fov: 45 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        frameloop="demand" // Optimized: only renders when needed
    >
      <color attach="background" args={['#0d0d12']} />
      <fog attach="fog" args={['#0d0d12', 10, 40]} />
      <Points count={50000} />
      <OrbitControls 
        autoRotate 
        autoRotateSpeed={0.5} 
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2 + 0.1} // Prevent looking from too far below
      />
    </Canvas>
  );
}
