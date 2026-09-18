# Project Handoff & Sprint State

**Date:** September 18, 2026 (End-of-Week Wrap-Up)  
**Target Architecture:** Astro v5, React Three Fiber, WebGL, Tailwind CSS, Vercel  
**Lead Scientist:** Dr. Cory Glenn Garms (Senior Scientist, Spectral Sciences, Inc.)  

## State of the Production Website (corygarms.com)
The website is in an exceptional, fully verified production state:
1. **Landing Hero (Red Oak Point Cloud):** Web-optimized 3D terrestrial LiDAR survey of a historic Red Oak (*Quercus rubra*, 28.4 m height, 28.8 m spread) with 6 scientific colormaps (Forestry, Viridis, Magma, LiDAR Reflectance, Laser Emerald, Topo Cyan), wider camera framing, and slow initial auto-rotation.
2. **CUTMAP Flagship Commercial Showcase (`/cutmap`):** High-impact USDA-NIFA Phase II teaming showcase featuring interactive 3D WebGL point clouds for Grove 1–3 (Eastern White Pine), H.264 video perception demo on Jetson AGX Orin, bold commercial KPIs ($2,200 vs. $100k MLS), 3-step operational workflow, and 4 commercialization pathways.
3. **Data Integrity:** Strict data boundaries enforced (all Mt. Auburn/Halcyon data and raw academic scatter plots quarantined).
4. **DevOps & CI/CD:** Clean static builds (19 routes in 6.5s) continuously deployed via Vercel.

## Objectives for Upcoming Sessions
1. **GitHub Portfolio Project 1:** Initialize, document, and containerize standalone open-source spatial projects (e.g. Lidar Canopy Profile Extractor in `~/Sandbox/lidar-canopy-extractor`).
2. **Research & Notes Expansion:** Draft new deep-tech write-ups under `src/content/notes/` highlighting mobile SLAM calibration and real-time edge mensuration. 

1. **Setup:** Create a new directory alongside the website (e.g., `~/Sandbox/lidar-canopy-extractor`).
2. **Implementation:** Write a Python computational pipeline using `laspy`, `open3d`, and `numpy` to ingest a raw aerial Lidar (`.las`/`.laz`) file, mathematically classify ground vs vegetation, and construct a statistical Canopy Height Model (CHM).
3. **Containerization:** Write a strict, production-ready `Dockerfile` and `docker-compose.yml` (`python:3.11-slim` base) to guarantee the environment is perfectly reproducible.
4. **Documentation:** Produce an academic-grade `README.md` explicitly detailing the underlying spatial algorithm, CLI usage, and exactly how to mount data volumes in the Docker container to process local files.

## Strict User Constraints (CRITICAL)
* **No Auto-Execute:** NEVER run background scripts or destructive terminal commands automatically without explicit user permission. The user prefers you provide step-by-step instructions for them to execute directly in their terminal!
* **Code Quality:** Strictly adhere to `PEP 8` and modular architecture. Write typed functions (`def process(file: str) -> None:`).
* **Scientific Polish:** Ensure the algorithmic approach is mathematically sound and explicitly commented. Avoid "black box" machine learning unless specifically requested; prefer transparent geometrical/statistical derivations for Lidar datasets.

*Begin the session by asking the user to `mkdir ~/Sandbox/lidar-canopy-extractor`, initialize a `git` repo, and provide a dummy `.las` dataset to configure the pipeline against.*
