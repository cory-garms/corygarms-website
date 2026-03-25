# GitHub Portfolio: Project 1 - Lidar Canopy Extractor

**Date:** March 25, 2026
**Target Architecture:** Python, `laspy`, `open3d`, Docker
**User Context:** Cory Garms (Senior Scientist, Lidar/CV Expert at SSI)

## State of the Portfolio
The core website (`corygarms.com`) at `~/Sandbox/website` has successfully completed Sprint 2 and is fully production-ready. It features WebGL dynamic point-cloud rendering natively from `.glb` files, MDX MathJax integrations for scientific writing, and interactive Contact forms. 

We are now officially pivoting outward to build a suite of standalone, expert-level GitHub repository projects to showcase the user's scientific skills to the broader community.

## Objectives for the Next Agent Session
Your singular goal for this session is to initialize, code, explicitly document, and containerize **Project #1: Lidar Canopy Profile Extractor**. 

1. **Setup:** Create a new directory alongside the website (e.g., `~/Sandbox/lidar-canopy-extractor`).
2. **Implementation:** Write a Python computational pipeline using `laspy`, `open3d`, and `numpy` to ingest a raw aerial Lidar (`.las`/`.laz`) file, mathematically classify ground vs vegetation, and construct a statistical Canopy Height Model (CHM).
3. **Containerization:** Write a strict, production-ready `Dockerfile` and `docker-compose.yml` (`python:3.11-slim` base) to guarantee the environment is perfectly reproducible.
4. **Documentation:** Produce an academic-grade `README.md` explicitly detailing the underlying spatial algorithm, CLI usage, and exactly how to mount data volumes in the Docker container to process local files.

## Strict User Constraints (CRITICAL)
* **No Auto-Execute:** NEVER run background scripts or destructive terminal commands automatically without explicit user permission. The user prefers you provide step-by-step instructions for them to execute directly in their terminal!
* **Code Quality:** Strictly adhere to `PEP 8` and modular architecture. Write typed functions (`def process(file: str) -> None:`).
* **Scientific Polish:** Ensure the algorithmic approach is mathematically sound and explicitly commented. Avoid "black box" machine learning unless specifically requested; prefer transparent geometrical/statistical derivations for Lidar datasets.

*Begin the session by asking the user to `mkdir ~/Sandbox/lidar-canopy-extractor`, initialize a `git` repo, and provide a dummy `.las` dataset to configure the pipeline against.*
