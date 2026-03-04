import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';

/**
 * PcdViewer Component
 * 
 * Demonstrates loading a real Lidar point cloud (.pcd) file.
 * 
 * Usage:
 * <Canvas>
 *   <Suspense fallback={null}>
 *     <PcdViewer url="/samples/tree.pcd" pointSize={0.05} />
 *   </Suspense>
 * </Canvas>
 */
export default function PcdViewer({ url, pointSize = 0.05 }) {
  // The PCDLoader automatically fetches and parses the file into a THREE.Points object
  const pcd = useLoader(PCDLoader, url);
  
  // Memoize geometry modifications so we only do them once when the file loads
  useMemo(() => {
    // Center the point cloud at the origin
    pcd.geometry.center();
    
    // Optionally calculate bounding spheres for optimal camera placement
    pcd.geometry.computeBoundingSphere();
    
    // Update point size
    if (pcd.material) {
        pcd.material.size = pointSize;
        // Allows color data from the PCD to be rendered if present
        pcd.material.vertexColors = true; 
    }
  }, [pcd, pointSize]);

  // Render the raw THREE.Points object returned by the loader
  return <primitive object={pcd} />;
}
