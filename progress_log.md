# Progress Log

## [2026-03-04 17:15:00 EST]
* **Status:** Post-Sprint Revisions
* **Focus:** Addressing User Feature Requests
* **Summary:** Updated the flower album thumbnail to `thistle.jpg`. Added the user's Google Scholar profile link to both the "About Me" section and the main footer. Replaced the thumbnail for the Hyperspectral Data Pipeline project with the user-provided `hsi_thumbnal.jpg` image. Fixed a rendering bug in `<PointCloudHero />` where the Viridis/Magma color palette buttons were not cleanly unmounting the geometry buffers to trigger color updates.
* **Technical Debt/Next Steps:** Handing off the repo for Sprint 2.

## [2026-03-04 17:05:00 EST]
* **Status:** Completed Day 5. **Sprint Finished.**
* **Focus:** SEO, A11y, and Final Polish
* **Summary:** Conducted final accessibility checks on the Dark/Scientific color palette. Configured the `@astrojs/sitemap` integration inside `astro.config.mjs` and generated a `robots.txt` file to enable robust search engine crawling. Added dynamic OpenGraph and Twitter Cards to `Layout.astro` for professional link previews on X/LinkedIn. Addressed the user's mid-day request to update the Google Photos link pointing to their new flower photography album link. 
* **Technical Debt/Next Steps:** The 5-Day Sprint is officially complete. The code has been comprehensively pushed to GitHub `main` branch, automatically deploying to Vercel. Awaiting final user approval of the finished `corygarms.com` site.

## [2026-03-04 16:55:00 EST]
* **Status:** Completed Day 4 (5-Day Sprint)
* **Focus:** DevOps Automation & CI/CD
* **Summary:** Built out the "Automated Architect" features. Wrote a reliable GitHub Actions workflow (`ci.yml`) to automatically build and audit on every push. Created `scripts/health-check.js` to programmatically verify NPM vulnerabilities, build integrity, and check the DNS/SSL status of `corygarms.com`. Finally, integrated Lighthouse CI (`.lighthouserc.json`) to programmatically assert Performance (>85%), Accessibility (>95%), and SEO (>90%) benchmarks on the production build output.
* **Technical Debt/Next Steps:** Committing Day 4 infrastructure to GitHub. Day 5 (SEO/A11y Manual Checks) is next.

## [2026-03-04 16:45:00 EST]
* **Status:** Completed Day 3 (5-Day Sprint)
* **Focus:** UI Polish & Scientific Aesthetics
* **Summary:** Updated the `mailto:` link in the hero section to the correct email address (`coryglenngarms@gmail.com`). Wrote a custom IntersectionObserver script in `Layout.astro` and implemented performant `.reveal` CSS classes globally for scroll-triggered micro-animations, applied them to the About me section, Portfolio Grid, and Notes list. Finally, designed a responsive `PublicationLayout.astro` complete with DOI linking and PDF viewer shortcuts tailored for academic posters.
* **Technical Debt/Next Steps:** Pushing Day 3 UI/UX improvements to the repo. Next up is Day 4 (DevOps, CI/CD, and Lighthouse Automated Checking).

## [2026-03-04 16:35:00 EST]
* **Status:** Completed Day 2 (5-Day Sprint)
* **Focus:** Astro Content Collections & Dynamic CMS
* **Summary:** Integrated Astro Content Collections for technical notes. Wrote the Zod schema (`config.ts`), created a dynamic layout page (`[slug].astro`), and updated `NotesList.astro` to query and render markdown files recursively. Fixed a text formatting bug in `index.astro` and successfully embedded the user's `Google Photos` flower album dynamically into `PortfolioGrid.astro` alongside a new fetch function that dynamically pulls the newest GitHub repositories into the selected works grid.
* **Technical Debt/Next Steps:** Pushing Day 2 features to GitHub to trigger Vercel deployment. Awaiting user verification before kicking off Day 3 (Aesthetics & Animations).

## [2026-03-04 16:15:00 EST]
* **Status:** Completed Day 1 (5-Day Sprint)
* **Focus:** Advanced 3D Viewer & UI Toggles
* **Summary:** Added `OrbitControls` to `<PointCloudHero>` enabling zooming and panning on the homepage. Built an overlay UI with simulated color maps (Default/Viridis/Magma) leveraging `React.useState`. Successfully researched and scaffolded a `<PcdViewer>` component that uses Three.js `PCDLoader` to ingest actual `.pcd` Lidar files into the application. (Update: Also swapped `family.jpg` out for `amanda.jpg` per user request).
* **Technical Debt/Next Steps:** Committing Day 1 code to trigger a Vercel build. Awaiting user verification before kicking off Day 2 (Astro Content Collections CMS).

## [2026-03-04 16:15:00 EST]
* **Status:** Planning 5-Day Sprint
* **Focus:** Feature Roadmap
* **Summary:** The Phase 1 MVP is officially complete, checked into GitHub, and ready for free Vercel hosting. Transitioning to a 5-Day Development Sprint. Drafted a comprehensive roadmap focusing on advanced 3D (Day 1), CMS integration (Day 2), UI animations (Day 3), DevOps (Day 4), and SEO/A11y (Day 5).
* **Technical Debt/Next Steps:** Awaiting user approval on the sprint roadmap before beginning Day 1 execution.

## [2026-03-04 15:37:00 EST]
* **Status:** MVP Complete
* **Focus:** Pre-Deployment Verification
* **Summary:** The code is completely finished and fully checked into GitHub under `cory-garms/corygarms-website`.
* **Technical Debt/Next Steps:** Awaiting user to import the GitHub repo into Vercel/Netlify and configure the required GoDaddy custom nameserver DNS records. Once the DNS propagates, Phase 1 is officially done and `corygarms.com` will be live for free!

## [2026-03-04 15:35:00 EST]
* **Status:** Completed Phase 3
* **Focus:** Phase 3 Planning (Image Integration)
* **Summary:** User uploaded `profile.jpg`, `family.jpg`, and `STTR_device.jpg`/`CUTMAP_apparatus.jpg` to the images folder. All Astro components (`index.astro`, `PortfolioGrid.astro`) were updated to use these actual layout images in place of the text placeholders.
* **Technical Debt/Next Steps:** The core site is now complete. Awaiting final user verification to transition into deployment mode for Vercel/Netlify.

## [2026-03-04 15:18:00 EST]
* **Status:** Completed Phase 2
* **Focus:** Phase 2 Planning (Images, Family Shoutout, Content Structure)
* **Summary:** User manually reviewed and approved the Phase 1 visual render of the React Three Fiber Point Cloud and dark theme layout. Directed the next steps to include image placeholders and a family shoutout for wife Amanda. Completed the implementation of `<PortfolioGrid/>`, `<NotesList/>`, and the expanded About section featuring the family tribute and visual placeholders.
* **Technical Debt/Next Steps:** Awaiting user manual verification of the new layout section since the browser agent is currently limited. Need user to drop image files into the newly created `public/images/` directory to replace the rendered placeholders.

## [2026-03-04 15:15:00 EST]
* **Status:** Completed Phase 1
* **Focus:** Environment Setup & Landing Page MVP
* **Summary:** Scaffolded the Astro project with Tailwind CSS and React plugins. Implemented the layout using a scientific Viridis/Magma theme. Built the performant PointCloudHero component using React Three Fiber to fulfill the "Visual Scientist" requirement. Configured the "Container Specialist" Docker setup.
* **Technical Debt/Next Steps:** Review of the visual layout is deferred to the user manually because the internal browser agent bugged out (opened multiple windows but timed out connecting). Need user confirmation that the 3D scene loads correctly on their desktop browser.

## [2026-03-04 15:00:11 EST]
* **Status:** In Progress
* **Focus:** Initial Architecture & Strategy
* **Summary:** Initialized the project workspace for corygarms.com. Reviewed user strict directives (GEMINI.md). Conducting a technical audit of the existing directory, verifying DNS status, and researching the optimal React/Three.js/Astro stack for rendering Lidar/3D point cloud data efficiently to support the 'Visual Scientist' homepage component.
* **Technical Debt/Next Steps:** Define Phase 1 Phase 1 Plan Artifact (Environment Setup & Landing Page MVP) and await user review before creating boilerplate.
