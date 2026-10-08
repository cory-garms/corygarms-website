#!/usr/bin/env python3
"""
Convert extracted tree LAZ point clouds to web-ready binary glTF (.glb)
with Three.js coordinate mapping and 16-bit reflectance in COLOR_0.
"""

import os
import json
import struct
import numpy as np
import laspy

TREES = [
    {
        "id": "sugar_maple",
        "name": "Sugar Maple",
        "species": "Acer saccharum (Sugar Maple)",
        "input_laz": "/home/cgarms/Sandbox/website/3D_models/SUGAR_MAPLE_CLEAN.laz",
        "output_glb": "/home/cgarms/Sandbox/website/public/models/sugar_maple.glb",
        "target_points": 175000,
        "intensity_max": 16000.0,
    },
    {
        "id": "bur_oak",
        "name": "Bur Oak",
        "species": "Quercus macrocarpa (Bur Oak)",
        "input_laz": "/home/cgarms/Sandbox/website/3D_models/BUR_OAK_CLEAN.laz",
        "output_glb": "/home/cgarms/Sandbox/website/public/models/bur_oak.glb",
        "target_points": 175000,
        "intensity_max": 16000.0,
    }
]

def build_glb(positions, colors, glb_path, node_name="Tree_Points"):
    """
    Construct a binary glTF (GLB 2.0) buffer containing POSITION and COLOR_0.
    """
    n_points = len(positions)
    
    # Flat float32 arrays
    pos_flat = positions.astype(np.float32).flatten()
    color_flat = colors.astype(np.float32).flatten()
    
    pos_bytes = pos_flat.tobytes()
    color_bytes = color_flat.tobytes()
    
    # 4-byte alignment padding
    pos_pad = (4 - (len(pos_bytes) % 4)) % 4
    pos_bytes += b'\x00' * pos_pad
    
    color_pad = (4 - (len(color_bytes) % 4)) % 4
    color_bytes += b'\x00' * color_pad
    
    bin_buffer = pos_bytes + color_bytes
    
    min_x, min_y, min_z = float(positions[:, 0].min()), float(positions[:, 1].min()), float(positions[:, 2].min())
    max_x, max_y, max_z = float(positions[:, 0].max()), float(positions[:, 1].max()), float(positions[:, 2].max())
    
    gltf = {
        "asset": {
            "version": "2.0",
            "generator": "CoryGarms-TerrestrialLiDAR-Pipeline"
        },
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"name": node_name, "mesh": 0}],
        "meshes": [
            {
                "name": f"{node_name}_Mesh",
                "primitives": [
                    {
                        "attributes": {
                            "POSITION": 0,
                            "COLOR_0": 1
                        },
                        "mode": 0 # 0 = POINTS
                    }
                ]
            }
        ],
        "accessors": [
            {
                "bufferView": 0,
                "byteOffset": 0,
                "componentType": 5126, # FLOAT
                "count": n_points,
                "type": "VEC3",
                "max": [max_x, max_y, max_z],
                "min": [min_x, min_y, min_z]
            },
            {
                "bufferView": 1,
                "byteOffset": 0,
                "componentType": 5126, # FLOAT
                "count": n_points,
                "type": "VEC3",
                "max": [1.0, 1.0, 1.0],
                "min": [0.0, 0.0, 0.0]
            }
        ],
        "bufferViews": [
            {
                "buffer": 0,
                "byteOffset": 0,
                "byteLength": len(pos_bytes),
                "target": 34962 # ARRAY_BUFFER
            },
            {
                "buffer": 0,
                "byteOffset": len(pos_bytes),
                "byteLength": len(color_bytes),
                "target": 34962
            }
        ],
        "buffers": [
            {
                "byteLength": len(bin_buffer)
            }
        ]
    }
    
    json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    json_pad = (4 - (len(json_bytes) % 4)) % 4
    json_bytes += b' ' * json_pad # GLB JSON chunk padded with spaces
    
    # GLB Header: magic (4), version (4), length (4)
    total_length = 12 + 8 + len(json_bytes) + 8 + len(bin_buffer)
    header = struct.pack('<4sII', b'glTF', 2, total_length)
    
    # Chunk 0: JSON
    chunk0_header = struct.pack('<II', len(json_bytes), 0x4E4F534A) # JSON
    
    # Chunk 1: BIN
    chunk1_header = struct.pack('<II', len(bin_buffer), 0x004E4942) # BIN
    
    os.makedirs(os.path.dirname(glb_path), exist_ok=True)
    with open(glb_path, 'wb') as f:
        f.write(header)
        f.write(chunk0_header)
        f.write(json_bytes)
        f.write(chunk1_header)
        f.write(bin_buffer)
        
    file_mb = os.path.getsize(glb_path) / (1024 * 1024)
    print(f"Successfully generated {glb_path} ({file_mb:.2f} MB, {n_points:,} pts)")

def process_tree(cfg):
    print(f"\n==========================================")
    print(f"Processing: {cfg['name']} ({cfg['species']})")
    print(f"Input: {cfg['input_laz']}")
    print(f"==========================================")
    
    las = laspy.read(cfg['input_laz'])
    n_source = len(las.x)
    print(f"Loaded {n_source:,} source points.")
    
    # Downsample step
    step = max(1, int(np.ceil(n_source / cfg['target_points'])))
    indices = np.arange(0, n_source, step)
    actual_count = len(indices)
    print(f"Subsampling step {step} -> {actual_count:,} target points.")
    
    raw_x = np.array(las.x[indices], dtype=np.float64)
    raw_y = np.array(las.y[indices], dtype=np.float64)
    raw_z = np.array(las.z[indices], dtype=np.float64)
    
    # Physical dimensions
    dx = float(raw_x.max() - raw_x.min())
    dy = float(raw_y.max() - raw_y.min())
    dz = float(raw_z.max() - raw_z.min())
    spread = max(dx, dy)
    print(f"Physical Dimensions: Height = {dz:.2f} m | Spread = {spread:.2f} m (dx={dx:.2f}m, dy={dy:.2f}m)")
    
    # Centroid
    cx, cy, cz = float(raw_x.mean()), float(raw_y.mean()), float(raw_z.mean())
    
    # Three.js coordinates: Y is UP, X is lateral, Z is depth (-Y_raw)
    tx = (raw_x - cx).astype(np.float32)
    ty = (raw_z - cz).astype(np.float32)
    tz = (-(raw_y - cy)).astype(np.float32)
    
    positions = np.stack([tx, ty, tz], axis=1)
    
    # Process intensity
    has_i = hasattr(las, 'intensity')
    colors = np.ones((actual_count, 3), dtype=np.float32)
    if has_i:
        raw_i = np.array(las.intensity[indices], dtype=np.float32)
        i_max = cfg['intensity_max']
        norm_i = np.clip(raw_i / i_max, 0.0, 1.0)
        colors[:, 0] = norm_i
        colors[:, 1] = norm_i
        colors[:, 2] = norm_i
        p99 = np.percentile(raw_i, 99)
        print(f"16-bit Reflectance Intensity: max={raw_i.max():.0f}, p99={p99:.0f}")
    else:
        print("No intensity channel; using fallback color 1.0.")
        
    build_glb(positions, colors, cfg['output_glb'], node_name=f"{cfg['id']}_Points")
    
    return {
        "id": cfg["id"],
        "name": cfg["name"],
        "species": cfg["species"],
        "points": f"{n_source/1e6:.2f}M pts" if n_source >= 1e6 else f"{int(n_source/1000)}k pts",
        "height": f"{dz:.1f} m",
        "spread": f"{spread:.1f} m",
        "target_points": f"{actual_count:,} pts"
    }

if __name__ == '__main__':
    summaries = []
    for tree_cfg in TREES:
        res = process_tree(tree_cfg)
        summaries.append(res)
        
    print("\n\n=== SUMMARY OF CONVERTED SPECIMENS ===")
    for s in summaries:
        print(f"- {s['name']}: {s['species']} | Source: {s['points']} | Rendered: {s['target_points']} | Height: {s['height']} | Spread: {s['spread']}")
