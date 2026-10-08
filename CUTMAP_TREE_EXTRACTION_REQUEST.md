# Task for CUTMAP Agent: Extract 2 Landmark Tree Point Clouds for corygarms.com

**Requester:** Dr. Cory Glenn Garms (Senior Scientist, Spectral Sciences, Inc.)  
**Destination:** `corygarms.com` Landing Page 3D Hero Viewer  
**Target Repository:** `/home/cgarms/Sandbox/website/3D_models/`  
**Date:** October 5, 2026  

---

## 1. Objective

Dr. Garms is preparing `corygarms.com` for submission to the 4th Annual Best Personal Academic Websites Contest (BPAW 2026). 

The main landing page features an interactive 3D WebGL point cloud hero powered by Three.js and custom GLSL elevation/intensity shaders. The current primary specimen is a 1.52-million-point terrestrial LiDAR scan of a **Red Oak** (*Quercus rubra*, 28.4 m height, 28.8 m crown spread) collected at Mt. Auburn Cemetery.

Dr. Garms wants to showcase **3 monumental specimen trees** on the main landing page hero (Red Oak + 2 other landmark trees from Mt. Auburn), while reserving the white pine forest grove scans exclusively for the CUTMAP project page (`/cutmap`).

---

## 2. Source Data in CUTMAP Repository

The source dataset is the **September 16, 2026 Mt. Auburn Cemetery collection** (`mta_20260916`):
- Location: `/home/cgarms/Projects/CUTMAP/results/mta_20260916/`
- Trajectories: Halcyon Lake loop (`MA_halcion_loop_*`), Hazel Dell loop (`MA_hazel_dell_loop_*`), and Indian Ridge return path.
- Stem Catalog: `MA_halcion_loop_multi_height_stems_utm19n.csv` and `photos_tags.csv`.

### Verified Monumental Candidates
From the stem catalog and botanical tags, top candidate specimens include:
1. **Tree 17:** **129.6 cm DBH** (1.3 m trunk diameter; one of the largest trees on the Halcyon loop).
2. **Tree 12:** **104.4 cm DBH** (*Acer saccharum*, Sugar Maple; verified with tag photos 14/17).
3. **Tree 98 / Photo 98:** **108.4 cm DBH** (*Quercus macrocarpa*, Bur Oak).
4. **Accession 5612-B:** *Fagus grandifolia* (American Beech, circumference 210.8 cm $\to$ DBH ~67 cm).

---

## 3. Extraction & Processing Instructions

Please extract **2 distinct landmark trees** (ideally one monumental Sugar Maple and one monumental Oak or Beech):

1. **Crop Stem & Full Crown Architecture:**
   - From the registered SLAM point cloud, crop points within a radius of **12 to 16 meters** around the stem centroid to capture the complete canopy architecture and branch scaffold.
   - Crop height from base ground elevation ($Z_{\text{base}}$) up to the terminal leader.
   - Filter extraneous ground gravel/lawn points below the root collar where practical.

2. **Retain 16-Bit LiDAR Optical Return Intensity:**
   - Ensure the `intensity` or `reflectance` channel from the Livox Mid-360 point cloud is preserved.

3. **Format & Export:**
   - Export as `binary_compressed` PCD or LAZ to:
     ```bash
     /home/cgarms/Sandbox/website/3D_models/<SPECIES_NAME>_CLEAN.pcd
     ```
     Suggested filenames:
     - `/home/cgarms/Sandbox/website/3D_models/SUGAR_MAPLE_CLEAN.pcd`
     - `/home/cgarms/Sandbox/website/3D_models/BUR_OAK_CLEAN.pcd` (or `BEECH_CLEAN.pcd`)

4. **Document Metadata:**
   Provide the following metrics for each extracted tree:
   - Botanical name & common name
   - Measured DBH (cm)
   - Estimated tree height (m) and crown spread (m)
   - Accession tag number (if matched in `photos_tags.csv`)

---

## 4. Downstream Website Ingestion

Once the `.pcd` files are delivered to `/home/cgarms/Sandbox/website/3D_models/`, the website pipeline (`scripts/convert-huge-oak-to-glb.js`) will automatically:
- Downsample to ~170k points (systematic stride sampling).
- Normalize spatial coordinates ($Y$-up, trunk base centered at $X=0, Z=0$).
- Encode 16-bit reflectance intensity into the glTF `COLOR_0` buffer.
- Export web-ready `.glb` files into `public/models/` for 60 FPS WebGL rendering.
