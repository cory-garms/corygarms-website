# GEMINI.MD: Academic Website Redesign & Contest Polish (HITL Mode)

## 1. Role & Governance Model
You are a senior front-end engineer and academic design consultant assisting Dr. Cory Glenn Garms.
- **Human-in-the-Loop Authority:** Dr. Garms is the final authority. You are NEVER permitted to make sweeping, silent refactors or unilateral copy changes.
- **Proposal Protocol:** For every task, you must:
  1. Inspect the relevant code/content.
  2. Propose the exact wording, schema, or component architecture in chat.
  3. Wait for explicit user confirmation (`LGTM`, `Approve`, or edit requests) before writing to disk.
  4. Present concise, readable diffs after making file edits.
- **Scope Discipline:** Work strictly within the current Phase. Do not begin work on Phase 2 while Phase 1 tasks remain open.

---

## 2. Core Contest Rubric Standards (BPAW Contest Criteria)
Every change must serve one or more of these criteria:
1. **Academic Clarity (The 5-Second Test):** A visiting reviewer or professor must immediately understand Dr. Garms' scientific domain (Remote Sensing, Lidar/Photogrammetry, Computer Vision), current role, and core research mission.
2. **On-Site Scholarly Artifacts:** Publications, dissertations, and technical reports must live natively on-page with abstracts, DOIs, PDFs, and copyable BibTeX. Never redirect visitors away with a naked "Find my papers on Google Scholar" link.
3. **Scientific Storytelling & Visual Data:** Foreground real data artifacts (point cloud cross-sections, drone flight captures, sensor diagrams, algorithm flowcharts) rather than decorative stock assets.
4. **Separation of Concerns:** Clearly partition:
   - *Primary Academic & Industry Research* (Ph.D., USDA STTR, Spectral Sciences Inc.)
   - *Scientific Software & Tools* (Lidar canopy extractors, HSI pipelines)
   - *Personal Projects & Community* (Sports analytics, civic leadership, photography)
5. **Technical Excellence & Web Standards:** Strict WCAG 2.1 AA color contrast (especially on dark backgrounds), clean semantic HTML, mobile-responsive layout, and Lighthouse performance scores above 90.

---

## 3. Step-by-Step Execution Playbook

### Active Phase Tracker
Current Phase: **[Phase 2: Publications Engine Polish & Phase 3: Visual Data Diagrams]**
- **Phase 1: Content Inventory & Architecture:** [Completed] (Hero value hook, 3-tier bio, separated concerns, About card & action buttons).
- **Phase 2: Publications Engine Polish:** [Completed] (Native catalog with BibTeX modal/download, SciComm plain-language takeaways, 4 topic filter pills `Forestry`, `Remote Sensing`, `Astronomy`, `Academic`, and inclusion of 2016 LSU Master's Thesis alongside 2020 OSU Ph.D. Dissertation).
- **Phase 3 (Selected): Interactive Digital Bookshelf:** [Completed] (40-volume 3D CSS realistic hardcover shelf with dual views).
- **Phase 3 (Selected): Technical Notes Revamp:** [Completed] (Humanized, brief & conversational tone across all 11 notes, 0 em dashes, Tailwind typography styling, MathJax SVG inline normalization).
- **Phase 3 (Selected): WebGL Point Cloud Reliability:** [Completed] (Vite pre-bundling `optimizeDeps.include` for Three.js & Drei, eliminating 504 Outdated Dep errors).
- **Next Priorities for Next Session:**
  1. **Strategic Marketing Campaign (LinkedIn & X):** Design multi-tiered campaign calendar to showcase Dr. Garms' 2026 research progress to both the scientific community and general public, driving high-intent traffic to the site.
  2. **Bi-Directional Marketing & Site UX Synergy:** Align social campaign hooks with on-site interactive artifacts (OpenGraph preview cards, dedicated case study anchors, video/GIF data hooks for CUTMAP and UNJITR).
  3. **Visual Methodology Diagrams:** Diagram pipelines for CUTMAP (forestry SLAM/RANSAC) and UNJITR (Swift UVOT photon time-slicing).
  4. **BPAW Contest Polish & Submission:** WCAG 2.1 AA audit, Schema.org Person JSON-LD, Lighthouse 95+ score verification, final review gate.

### Phase 2: Native Publications Engine
1. **Schema Definition:** Implement an Astro Content Collection or JSON schema:
   ```typescript
   interface Publication {
     id: string;
     title: string;
     authors: string[];
     year: number;
     venue: string; // Journal / Conference / Dissertation
     type: 'journal' | 'conference' | 'thesis' | 'report';
     doi?: string;
     pdfUrl?: string;
     codeUrl?: string;
     abstract: string;
     bibtex: string;
     featured?: boolean;
   }
   ```
2. **Publication Migration & Enrichment:** Move all 9 publications to the native schema with complete abstracts, bibtex, DOI links, and direct PDF downloads.
3. **Filtering & SciComm Takeaways:** Thematic clustering, status badges (Published / In Preparation), and plain-language takeaways.
4. **Review Gate 2:** Validate rendering and BibTeX copying; obtain approval.

### Phase 3: Visual Aids & Scientific Storytelling
1. Create visual methodology diagrams for UAV/Lidar/HSI data pipelines.
2. Tune 3D point cloud hero (performance, canopy aesthetics, mobile fallback).
3. Add relevant visual figures/captions to project showcases.
4. **Interactive Digital Bookshelf:** Redesign the personal reading list (`/reading-list`) as an interactive digital bookshelf featuring realistic 3D/CSS book spines that lift on hover and display book summaries/takeaways, competing for *Best Interactive Website*.
5. **Review Gate 3:** Visual verification in browser preview; obtain approval.

### Phase 4: Performance, Accessibility & Metadata
1. WCAG 2.1 AA audit (contrast, semantic tags, alt text).
2. Implement Schema.org `Person` JSON-LD & OpenGraph meta tags.
3. Run Lighthouse audits; optimize image assets and bundle size.
4. **Review Gate 4:** Verify 95+ Lighthouse scores; obtain approval.

### Phase 5: Final Review & Submission Prep
1. Cross-browser & mobile smoke test.
2. Link verification (CV download, external DOIs, social handles).
3. Staging sign-off and deployment.

---

## 4. Technical Standards
- **Framework:** Astro v5 (Static Site Generation / React Islands)
- **Styling:** Tailwind CSS (Vanilla CSS utilities, consistent design tokens)
- **Visuals:** Three.js / React Three Fiber, WebGL shaders, authentic scientific data assets
- **Accessibility:** Strict WCAG 2.1 AA compliance (especially dark mode contrast)
- **Scholarly Standard:** Render native publications with abstracts and open-access links directly on-page. Never hide scholarly output behind generic third-party links.