# Project Handoff & Sprint State

**Date:** September 25, 2026  
**Target Architecture:** Astro v5, React Three Fiber, Three.js, Tailwind CSS v4, Vercel  
**Lead Scientist:** Dr. Cory Glenn Garms (Senior Scientist, Spectral Sciences, Inc.)  
**Contest Goal:** Best Personal Academic Website (BPAW) 2026 Contest Submission  

---

## 1. Current State of the Production Website (corygarms.com)

The website is fully operational, clean-building (20 static routes in ~6s), and continuously deployed via Vercel:

1. **Landing Hero (3D LiDAR Point Cloud):**
   - Interactive Livox Mid-360 point cloud scans with scientific colormaps (Turbo, Cividis, Forestry, Topo, Reflectance, Laser).
   - Floating glassmorphism identity card passing the academic 5-second test with direct action anchors (Research Bio, Publications Dossier, CV).
   - Solidified Vite pre-bundling (`optimizeDeps.include`) preventing dynamic hydration failures.
2. **Flagship Research & Commercial Showcases:**
   - **CUTMAP (`/cutmap`):** USDA-NIFA Phase II teaming showcase featuring interactive 3D WebGL point clouds for Groves 1–3, edge perception demo on Jetson AGX Orin, $2,200 vs $100k MLS cost comparison, and single-view SAM mensuration.
   - **UNJITR (`/unjitr` / `/astro-jitter`):** NASA Swift UVOT spacecraft jitter restoration showcase (sub-pixel FFT cross-correlation, 282 galaxy observations, 99.7% archive recovery rate).
3. **Native Publications Engine (`/research`):**
   - Dynamic client-side topic filter pills (`All`, `Forestry`, `Remote Sensing`, `Astronomy`, `Academic`).
   - Plain-language SciComm takeaways, direct DOI links, open-access PDF downloads, and instant BibTeX modal/download.
   - Complete graduate research catalog including 2020 OSU Ph.D. Dissertation and 2016 LSU Master's Thesis.
4. **Interactive 3D Bookshelf (`/reading-list`):**
   - 40-volume realistic CSS 3D hardcover bookshelf with debossed gold foil, cloth headbands, walnut fascia beams, cast-iron bookends, popover synopses, and accessible 2D grid toggle.
5. **Technical Notes Collection (`/notes`):**
   - 11 concise, conversational, and humanized dispatches covering spatial computing, spacecraft optics, baseball pitch design, and forestry mechanobiology.
   - Zero em dashes, generous typography vertical rhythm (`@tailwindcss/typography`), and normalized inline MathJax SVG rendering.
6. **Curriculum Vitae (`/cv`):**
   - Complete, verified CV covering education, awards, leadership (Medford Malden Elks), and publications.

---

## 2. Immediate Objectives for Next Session

### Priority 1: Strategic Marketing Campaign (LinkedIn & X)
Launch a coordinated campaign to showcase Dr. Garms' 2026 research progress to both the scientific community and the general public, driving high-intent traffic to the website.
- **Strict Content Standard:** Strictly **NO** long-form essays or text walls. Every post must be pointed, punchy, and visually striking with high information density in a compact format:
  1. *Visual Data Hook:* High-contrast point cloud loop, GIF, sensor diagram, or before/after image.
  2. *3 High-Impact Technical Bullets:* Problem $\rightarrow$ Innovation $\rightarrow$ Measured Benchmark.
  3. *Direct Callout:* Single link to the interactive web viewer or dataset.

### Priority 2: Bi-Directional Site & Marketing UX Synergy
Align social campaign entry points with on-site interactive experiences:
- High-fidelity OpenGraph and Twitter preview cards for `/cutmap`, `/unjitr`, and individual notes.
- Dedicated interactive anchors allowing visitors from social media to immediately test algorithms and view benchmarks.

### Priority 3: Visual Methodology Pipeline Diagrams
Design visual workflow flowcharts for:
- **CUTMAP:** FAST-LIO2 SLAM $\rightarrow$ surface-normal constrained 3D cylinder RANSAC on NVIDIA Jetson.
- **UNJITR:** Swift UVOT photon-counting arrival stream $\rightarrow$ overlapping 1.0s FFT time slices $\rightarrow$ continuous jitter trajectory inversion.

### Priority 4: BPAW 2026 Contest Polish & Submission
- WCAG 2.1 AA accessibility audit (especially dark mode contrast).
- Schema.org `Person` JSON-LD structured data for academic search engines.
- Lighthouse 95+ score verification across all routes.
- Final review gate and submission.

---

## 3. Governance & Development Rules
- **Human-in-the-Loop Authority:** Dr. Garms is the final authority. Never make sweeping refactors without explicit approval.
- **Proposal Protocol:** Inspect $\rightarrow$ Propose exact diff/copy $\rightarrow$ Await approval $\rightarrow$ Execute $\rightarrow$ Report.
- **Tone Standard:** Concise, human, authentic, technically rigorous. No AI buzzwords or cliché formatting.
