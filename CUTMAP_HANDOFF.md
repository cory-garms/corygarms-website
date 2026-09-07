# HANDOFF_WEBSITE_CUTMAP.md — CUTMAP Project Showcase Handoff
**Target Website:** [corygarms.com/cutmap](https://www.corygarms.com/cutmap)  
**Target Platform:** Astro v5 + Tailwind CSS (Dark forest/slate aesthetic: `bg-forest-950`, `text-accent`, `font-mono`)  
**Author / Lead Scientist:** Dr. Cory Glenn Garms (Senior Scientist, Spectral Sciences, Inc.)  
**Collaborators & Sponsors:** Dr. Bogdan Strimbu (Oregon State University) • Dr. Diomy Zamora (USDA Forest Service / Project Sponsor)  
**IP / Proprietary Notice:** CUTMAP is proprietary technology developed by Spectral Sciences, Inc. under USDA SBIR/STTR. Do not describe the codebase as open-source.

---

## 1. Executive Briefing for the Website Agent

The current `/cutmap` page on `corygarms.com` is an early roadmap placeholder. This handoff package provides the complete copy, quantitative benchmarks, narrative structure, and high-resolution visual assets needed to transform `/cutmap` into a flagship technical portfolio page.

### The 4 Core Story Pillars
1. **Low-SWaP-C Mobile Hardware (~$2,200 Sensor Payload):** Commercial mobile laser scanning (MLS) systems cost $50,000–$100,000+. CUTMAP integrates a Livox Mid-360S solid-state LiDAR (with 200 Hz IMU) and dual FLIR Blackfly S global-shutter cameras on a ruggedized push-cart driven by an NVIDIA Jetson AGX Orin.
2. **Calibration Integrity & The Failure-Coupling Discovery:** A key methodological breakthrough. A subtle 2.5 mm target bow induced an undetected 4.6% focal scale error that completely bypassed standard scale-invariant reprojection metrics (0.31 px RMS), propagating into a massive 140 mm downstream extrinsic shift. Solved with three physical gates (planarity-free laser ruler gate, symmetric-pitch observability conditioning, and point-count squared weighting).
3. **Operational Office Park Prototyping (65 Taped Stems):** Validated across three contrasting wooded groves in a Burlington, MA corporate campus. 360° LiDAR loop rings agree with physical logger's tape to **+2.83 ± 1.45 cm** (R² = 0.9833, RMSE 3.18 cm), reflecting a natural bark-furrow envelope. Established the **Angular Coverage Effect** (-2.79 cm / 100° missing arc) and exposed the **Residual Paradox** (partial-arc circle fits look deceptively clean at 8–17 mm residual while carrying large diameter bias).
4. **Single-Viewpoint Semantic Mensuration (SAM ViT-B):** Overcoming the loop walkaround constraint. Forward-projecting 3D LiDAR priors into Blackfly camera frames to prompt the Segment Anything Model (SAM ViT-B) recovers single-perspective DBH at **+1.60 ± 2.78 cm** against tape. Identified that figure-ground contrast (r = -0.65, p = 0.003) governs visual edge leakage, and demonstrated how the 457.2 mm physical stereo baseline provides two independent background perspectives to defeat camouflage.

---

## 2. Key Performance Indicators (KPI Counter Grid)

Drop this counter grid into the hero / summary section of the page:

| Metric | Value | Baseline / Context | Significance |
| :--- | :--- | :--- | :--- |
| **Payload Cost** | **~$2,200** | $\ge \$50,000$ commercial MLS | 25× reduction in hardware barrier-to-entry |
| **Ground Truth Stems** | **65 Stems** | 3 Wooded Groves (Burlington, MA) | Calibrated directly against physical logger's tape |
| **360° Ring DBH Accuracy** | **+2.83 ± 1.45 cm** | $R^2 = 0.9833$, RMSE $3.18\text{ cm}$ | Captures physical bark ridge envelope (n=43 full rings) |
| **Single-View Camera DBH** | **+1.60 ± 2.78 cm** | $MAE = 2.58\text{ cm}$ (n=9 stations) | Eliminates partial-arc coverage penalty from 1 view |
| **SLAM Metric Rigidity** | **1.0098 ± 0.0137** | 82–97 m understory loops | Proves <1% trajectory scale dilation without GPS |
| **Extrinsic Precision** | **0.87 mm** | One-sided pitch was $3.48\text{ mm}$ | Symmetric pitch conditions vertical weak axis ($2.7\times$) |

---

## 3. High-Resolution Visual Asset Catalog

All assets are located in the CUTMAP project repository (`/home/cgarms/Projects/CUTMAP/`). Copy them into the website repository's `public/images/cutmap/` directory.

| Asset File | Resolution / Size | Recommended Page Section | Visual Description & Caption |
| :--- | :--- | :--- | :--- |
| `results/paper1/fig_multi_stand_stem_maps.png` | 300 DPI, 18×6.5 in (1.3 MB) | **Under-Canopy SLAM Section** | **3-panel stand map:** Top-down 2D LiDAR breast-height slices ($z = 1.37\text{ m} \pm 0.05\text{ m}$) with FAST-LIO2 cart paths, dwell stations, and extracted tree rings across Stands 1, 2, and 3. |
| `results/paper1/fig_extrinsic_trunk_projections.png` | 300 DPI, 18×10 in (15 MB) | **Sensor Calibration Section** | **2×3 visual projection matrix:** 3D LiDAR stem cylinders projected directly into Blackfly S camera frames across depth fields (3 m to 25 m), visually demonstrating sub-pixel lateral alignment down-range. |
| `results/paper1/fig7_multi_stand_validation.png` | 300 DPI, 14×12 in (1.1 MB) | **Mensuration Results Section** | **4-panel empirical centerpiece:** (a) Arc vs. ring diameter dilation; (b) Angular coverage bias regression ($-2.79\text{ cm}/100^\circ$); (c) SLAM metric scale rigidity; (d) 1:1 scatter plot vs. 65 taped stems showing the shaded bark-furrow envelope. |
| `results/paper1/fig8_sam_camera_mensuration.png` | 300 DPI, 15×12 in (3.2 MB) | **Semantic Fusion Section** | **4-panel camera mensuration figure:** (a) Multi-range camera segmentation gallery; (b) Sub-pixel bark boundary contour zoom; (c) 1:1 validation vs. tape (+1.60 cm on cam_1); (d) Figure-ground contrast correlation ($r = -0.65$). |
| `results/paper1/fig4_error_propagation.png` | 300 DPI, 11×4.5 in (288 KB) | **Failure Coupling Deep-Dive** | **2-panel error propagation:** (a) Top-down sensor geometry showing 140 mm phantom shift; (b) Bar chart comparing uncorrected bowed board errors vs. corrected flat board. |
| `results/paper1/fig5_scale_gate.png` | 300 DPI, 8×7 in (369 KB) | **Scale Gate Deep-Dive** | **Planarity-Free Scale Gate:** Distance regression vs. Leica Disto laser ruler from 1.2 m to 8.0 m, exposing the $-4.6\%$ bowed focal divergence. |
| `results/paper1/sam/cam_compare.png` | 1520×2640 px (4.4 MB) | **Interactive Gallery / Lightbox** | Direct visual comparison of `cam_0` vs. `cam_1` segmentation masks across 3m, 5m, and 8m dwell stations. |
| `results/paper1/sam/sam_zoom.png` | 800×3840 px (3.6 MB) | **Interactive Gallery / Inset** | Sub-pixel edge delineation detail showing how SAM masks trace bark furrows against background foliage. |

---

## 4. Ready-to-Implement Web Copy (Section by Section)

### A. Hero Section
* **Eyebrow Tag:** `USDA SBIR Phase I • Proprietary Technology • Spectral Sciences, Inc.`
* **Title:** `CUTMAP: Autonomous Under-Canopy Forest Mensuration`
* **Headline:** `Sub-Centimeter Metric Precision from a $2,200 Mobile Sensor Payload`
* **Lead Paragraph:**  
  Commercial forest laser scanning platforms cost upwards of $50,000–$100,000, limiting operational adoption in silviculture and forest inventory. CUTMAP (Continuous Under-Canopy Traverse and Mapping) bridges the gap between low-cost robotics hardware and survey-grade forestry biometrics. Engineered by Spectral Sciences, Inc., CUTMAP couples a solid-state LiDAR with calibrated global-shutter stereo cameras on a mobile push-cart, achieving automated individual-tree DBH mensuration, rigorous multi-sensor calibration integrity, and robust GPS-denied SLAM odometry under dense canopy.

---

### B. Hardware Platform & SWaP-C Optimization
* **Header:** `Ruggedized Low-SWaP-C Sensor Architecture`
* **Copy:**  
  Instead of expensive spinning mechanical LiDARs or survey-grade IMUs, CUTMAP optimizes Size, Weight, Power, and Cost (SWaP-C) using modern solid-state perception:
  * **Livox Mid-360S LiDAR:** Solid-state, non-repetitive circular scanning pattern operating at 200,000 pts/sec, paired with an embedded 200 Hz industrial IMU.
  * **Dual FLIR Blackfly S Global-Shutter Cameras:** 1.3 MP machine vision sensors mounted on a precision 457.2 mm (18.0 in) crossbar, dedicated to semantic feature extraction and optical silhouette mensuration.
  * **NVIDIA Jetson AGX Orin:** Onboard edge compute running native ROS 2 Humble, executing real-time LiDAR-inertial odometry and deterministic sensor logging.
  * **Cross-Country Chassis:** Custom-configured wheeled push-cart with rear-facing camera perspectives to observe mapped geometry without forward operator occlusion.

---

### C. The Calibration Breakthrough: Unmasking Failure Coupling
* **Header:** `Methodological Rigor: Solving Multi-Sensor Failure Coupling`
* **Copy:**  
  In staged multi-sensor calibration, subtle errors at early stages propagate silently into downstream transformations, disguised as physical misalignments while local validation metrics report passing scores.
  * **The Phantom Shift:** A mere 2.50 mm moisture-induced concave bow in a printed checkerboard target induced a -4.6% focal length error ($f_x = 1544.3\text{ px}$ vs. $1614.7\text{ px}$ nominal). Standard reprojection RMS ($0.31\text{ px}$) and stereo baseline checks remained completely blind. Downstream, the extrinsic solver shifted the camera 133 mm laterally and 140 mm fore-aft to force ray intersection.
  * **The Planarity-Free Scale Gate:** We decoupled focal scale from target flatness by triangulating multi-distance points against an external laser rangefinder ($1.2\text{--}8.0\text{ m}$), restoring metric scale fidelity (slope 0.9904).
  * **Symmetric-Pitch Observability:** Monte Carlo observability and SVD nullspace analysis proved that target pitch symmetry ($\pm 20^\circ$) resolves the ill-conditioned vertical weak axis, reducing vertical error by $2.7\times$ (to $0.87\text{ mm}$, condition number $\kappa = 3.66$).
  * **$\text{count}^{2.0}$ Plane Weighting:** Penalizes range-degraded point density in non-repetitive scans, collapsing lateral centring error from $40.9\text{ mm}$ to $+6.8\text{ mm}$.

---

### D. Ground-Truth Field Mensuration: 65 Stems in Burlington Wooded Groves
* **Header:** `Operational Prototyping: 65 Stems Measured Against Logger's Tape`
* **Copy:**  
  CUTMAP was deployed across three contrasting wooded groves at a corporate research campus in Burlington, MA, representing white pine, mixed deciduous hardwoods, and dense brush understory. Individual tree diameters were validated against 65 physical logger's-tape measurements:
  * **360° Ring Metric Accuracy:** Full rings ($\ge 340^\circ$ angular sweep, $n=43$) measured from walked loops achieved **$+2.83 \pm 1.45\text{ cm}$** agreement against tape ($R^2 = 0.9833$, RMSE $3.18\text{ cm}$).
  * **The Physical Bark Furrow Envelope:** The consistent positive offset across all stands reflects outer bark ridge tracking: LiDAR pulses reflect from the outermost bark peaks, whereas physical logger's tape compresses into furrow fissures ($+1.4\text{ cm}$ radial envelope).
  * **The Angular Coverage Effect:** Fitting circles to partial stationary arcs inflates diameter by **$-2.79\text{ cm}$ per $100^\circ$** of missing coverage ($p = 8\times 10^{-6}$). Crucially, partial-arc circle fits return *lower* residuals ($8\text{--}17\text{ mm}$) than complete rings ($20\text{--}36\text{ mm}$), exposing the dangerous illusion that clean residuals equate to accurate measurements.
  * **SLAM Metric Scale Rigidity:** Inter-station baseline recovery over 82–97 m understory loops verified that FAST-LIO2 preserves metric scale at **$1.0098 \pm 0.0137$** with collinearity preserved to $0.3\%\text{--}1.1\%$.

---

### E. Single-Viewpoint Semantic Mensuration: LiDAR-Prompted SAM ViT-B
* **Header:** `Breaking the Walkaround Barrier: Single-Viewpoint SAM Mensuration`
* **Copy:**  
  Requiring a complete 360° loop walkaround for every tree multiplies field traverse time and energy. To solve the partial-arc inflation from a stationary viewpoint, CUTMAP forward-projects 3D LiDAR priors into Blackfly S camera frames to prompt the Segment Anything Model (SAM ViT-B):
  * **Prior-Guided Prompting:** 3D trunk centroid points and a loose bounding box ($2.6\times$ predicted width) prompt SAM, ensuring $92\text{--}98\%$ of each stem's own LiDAR returns land cleanly inside the segmented mask.
  * **Single-Perspective DBH Accuracy:** Combining optical silhouette width with direct LiDAR range achieves **$+1.60 \pm 2.78\text{ cm}$ DBH** against tape ($MAE = 2.58\text{ cm}$) from a single viewpoint—completely circumventing the $+11.9\%$ arc-fitting penalty.
  * **Figure-Ground Contrast Mechanism:** We established that photometric contrast ($r = -0.65, p = 0.003$) governs visual edge leakage. Where trunks are darker than background foliage, segmentation is sub-pixel accurate. CUTMAP's 457.2 mm stereo baseline provides two diverse background angles for every tree, ensuring favorable contrast separation.

---

### F. Publications & Project Governance
* **Header:** `Manuscripts & Research Disclosures`
* **Entries:**
  * **Garms, C.G., Strimbu, B., et al. (2026).** *Calibrating a Low-SWaP-C Lidar–Stereo Platform: Staged Procedures, Failure Coupling, and Operational Validation.* Target: *Journal of Field Robotics* (In Final Preparation).
  * **Garms, C.G., Strimbu, B., Zamora, D., et al. (2026).** *CUTMAP: A Low-SWaP-C Mobile Mapping Platform for Forest Mensuration: Calibration Integrity, Sensor Fusion, and Ground-Truth Prototyping.* 2026 Joint Meeting of the Northeastern Mensurationist Organization (NEMO) & Southern Mensurationists (SOMENS), Portland, ME.
  * **Garms, C.G. & Strimbu, B. (2021).** *Impact of stem lean on estimation of Douglas-fir diameter and volume using mobile lidar scans.* *Canadian Journal of Forest Research*, 51(8), 1184–1195.

---

## 5. Recommended Astro Component Layout Blueprint

```astro
---
// src/pages/cutmap.astro
import Layout from '../layouts/Layout.astro';
import SectionHeader from '../components/SectionHeader.astro';
import StatCard from '../components/StatCard.astro';
import ImageLightbox from '../components/ImageLightbox.astro';
---

<Layout title="CUTMAP: Autonomous Forest Mensuration | Cory Glenn Garms, Ph.D.">
  <main class="max-w-6xl mx-auto px-6 py-16">
    <!-- Hero Section with KPI Counters -->
    <section class="mb-20">
      <!-- Title, Badges, Lead Paragraph -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <StatCard value="~$2,200" label="Core Sensor Payload" sub="25x below commercial MLS" />
        <StatCard value="65 Stems" label="Field Ground Truth" sub="Logger's-tape verified" />
        <StatCard value="+2.83 cm" label="360° Ring DBH Bias" sub="R² = 0.9833 (Bark Envelope)" />
        <StatCard value="+1.60 cm" label="Single-View DBH (SAM)" sub="Zero walkaround required" />
      </div>
    </section>

    <!-- Visual Showcase 1: Multi-Stand SLAM Trajectories & Stem Slices -->
    <section class="mb-20">
      <SectionHeader title="Autonomous Under-Canopy Mapping" subtitle="FAST-LIO2 loops and breast-height stem slices across 3 stands" />
      <div class="rounded-2xl border border-border overflow-hidden bg-surface p-4">
        <img src="/images/cutmap/fig_multi_stand_stem_maps.png" alt="Under-Canopy SLAM Trajectories" class="w-full h-auto rounded-xl" />
      </div>
    </section>

    <!-- Technical Deep-Dive: Calibration Integrity & Failure Coupling -->
    <section class="mb-20 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <SectionHeader title="Calibration Failure Coupling" subtitle="Unmasking the 140 mm phantom shift" />
        <p class="text-sm text-text-muted leading-relaxed">...</p>
      </div>
      <div class="rounded-2xl border border-border overflow-hidden bg-surface p-4">
        <img src="/images/cutmap/fig_extrinsic_trunk_projections.png" alt="LiDAR to Camera Deep Projections" class="w-full h-auto rounded-xl" />
      </div>
    </section>

    <!-- Empirical Centerpiece: Figure 7 Multi-Stand Validation -->
    <section class="mb-20">
      <SectionHeader title="Operational Field Validation" subtitle="65 taped stems, the Angular Coverage Effect, and SLAM scale rigidity" />
      <div class="rounded-2xl border border-border overflow-hidden bg-surface p-4">
        <img src="/images/cutmap/fig7_multi_stand_validation.png" alt="Figure 7 Multi-Stand Mensuration Validation" class="w-full h-auto rounded-xl" />
      </div>
    </section>

    <!-- Cross-Modality Semantic Mensuration: Figure 8 SAM ViT-B -->
    <section class="mb-20">
      <SectionHeader title="Single-Viewpoint Semantic Mensuration" subtitle="LiDAR-prompted SAM ViT-B bypassing the angular coverage penalty" />
      <div class="rounded-2xl border border-border overflow-hidden bg-surface p-4">
        <img src="/images/cutmap/fig8_sam_camera_mensuration.png" alt="Figure 8 SAM Camera Mensuration" class="w-full h-auto rounded-xl" />
      </div>
    </section>

    <!-- Publications & Citations -->
    <section class="p-8 rounded-2xl border border-border bg-surface/50">
      <!-- Publications list -->
    </section>
  </main>
</Layout>
```
