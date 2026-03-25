Project 1: Lidar Canopy Profile Extractor 🌲
Goal: Ingest aerial Lidar, classify ground vs vegetation, and output a Canopy Height Model (CHM).

Step 1: Initialize a python:3.11-slim Docker container to ensure system-level dependencies for Lidar math (like GDAL/PDAL bindings) don't pollute your host machine.
Step 2: Write a clean Python CLI using laspy to read .las/.laz files.
Step 3: Implement a Cloth Simulation Filter (CSF) or a basic morphological filter in numpy/open3d to segment Ground points from Non-Ground points.
Step 4: Rasterize the Non-Ground points into a 2D spatial grid (the CHM) representing tree heights, and export it as a GeoTIFF using rasterio.


Project 2: Hyperspectral Cube Slicer 🛰️
Goal: An interactive dashboard to visualize and analyze dense hyperspectral ENVI/TIFF data.

Step 1: Scaffold a Streamlit application.
Step 2: Write backend parsing logic using the spectral Python library to ingest HDR/BIP cubes or multi-layer TIFFs.
Step 3: Build a UI slider that dynamically updates a 2D matplotlib/plotly image, allowing the user to scrub through wavelength bands (e.g., 400nm to 2500nm).
Step 4: Add an interactive "click" feature where clicking a pixel generates a 2D line plot of that specific pixel's spectral signature across all bands.


Project 3: Kayak Catch Length Estimator 🎣
Goal: Run a YOLO object detection model on fishing photos to automatically box the fish and estimate its length using a reference patch (like a paddle).

Step 1: Build a tiny Python script that utilizes OpenCV (cv2) and ultralytics YOLOv8.
Step 2: Use a pre-trained YOLO model (or quickly fine-tune one using an open dataset of fish) to draw bounding boxes around the catch.
Step 3: Implement a classic computer vision pixel-per-metric ratio algorithm. If the user places a standard reference object (e.g., a 2-inch coin or a recognizable lure) in the frame, OpenCV computes the object's pixel width to estimate the absolute length of the fish.


Project 4: Trail Topo to 3D Print Exporter 🥾
Goal: Convert USGS topological data of a favorite hiking/kayaking route into a 3D-printable .stl.

Step 1: Write a script that hits the open USGS Elevation API for a given bounding box (Lat/Lon).
Step 2: Convert the returned DEM (Digital Elevation Model) raster into a 3D point cloud using numpy.
Step 3: Use trimesh or open3d to run a Poisson surface reconstruction, converting the points into a solid mesh.
Step 4: Extrude the mesh edges downward to a flat base plane to create a "watertight" solid block required for 3D printers, and export to .stl.


Project 5: NBA Spatial Shot Heatmap 🏀
Goal: Visualize Celtics or Spurs shooting analytics on a mapped 2D half-court.

Step 1: Download public NBA play-by-play spatial data (using a community API or Kaggle proxy).
Step 2: Use matplotlib.patches to draw a geographically accurate NBA half-court (hoop, paint, three-point line).
Step 3: Feed the shot X/Y coordinates into seaborn.kdeplot to generate a beautiful, glowing kernel density heatmap layered directly on top of the court.


Project 6: Procedural Terrain Point Cloud Generator 🪐
Goal: Generate randomized, alien terrain arrays using noise and export them for your website's React viewer.

Step 1: Write a Python script using the noise library to generate 2D arrays of Simplex/Perlin noise (simulating rolling hills and craters).
Step 2: Apply mathematical transformations (e.g., exponentiation to create sharp ridges, or terraces to create plateaus).
Step 3: Convert the 2D heightmap into an [N, 3] XYZ numpy array and save it strictly as a .pcd file using open3d. You can then drop this file directly into the public/models folder of corygarms.com!


Project 7: Voxel-Grid Downsampling Microservice ⚙️
Goal: An ultra-fast, stateless API that accepts massive Point Clouds and returns a lighter, downsampled version.

Step 1: Set up a FastAPI server in Python.
Step 2: Expose a POST /downsample endpoint that accepts .ply or .pcd uploads.
Step 3: Implement a fast Voxel-Grid filter algorithm using raw numpy (or open3d's voxel downsample) that divides the 3D space into cubes and averages the points within each cube.
Step 4: Stream the compressed file back to the client. Write a robust docker-compose to demonstrate how easily this microservice can be deployed to a cloud server.