# Handoff: corygarms.com - Entering Sprint 2

**Date:** March 4, 2026
**Target Architecture:** Astro + React + Tailwind + Three.js
**Deployment:** Vercel (CI/CD connected to `cory-garms/corygarms-website` GitHub repo)

## State of the Project
The site has completed **Sprint 1 (MVP to Production)**. The foundational architecture is extremely solid, heavily relying on Astro for static site generation speed while using React Three Fiber for a hero point cloud visualization.

* **DevOps ("Automated Architect"):** GitHub Actions are configured (`.github/workflows/ci.yml`). There is a custom `scripts/health-check.js` script and Lighthouse CI integration (`.lighthouserc.json`) to enforce performance and security.
* **Content ("Content Sync"):** Astro Content Collections are set up for blog posts in `src/content/notes`. There is also a Node `fetchLatestGithubProjects` script that pulls recent repositories into the Portfolio Grid.
* **Styling ("Visual Scientist"):** A custom dark theme (Viridis/Magma inspired) is established in `global.css`, alongside vanilla JS Intersection Observer micro-animations in `Layout.astro`.

## Objectives for the Next Agent Session
We are now entering **Sprint 2: Deep Integrations & Content Expansion.**

Your primary duties based on the `task.md` and `implementation_plan.md` are:
1. **Real 3D Data:** Swap out the procedurally generated math point cloud in `<PointCloudHero />` for a real `.las` or `.pcd` loader (ask the user to provide a sample file).
2. **Markdown Refinement:** Configure the Astro Markdown engine to support MathJax equations (for scientific papers) and build custom Astro components for `<CodeSnippet>` and `<Alert>` boxes.
3. **Contact Form:** Implement a real, working Contact form utilizing Web3Forms, Formspree, or EmailJS to replace the standard `mailto:` link.

## Strict User Constraints
* **Persona:** The user is a Senior Scientist with a Ph.D. Professional, highly academic, dark-mode aesthetic is preferred.
* **Verification:** Rely heavily on the local `npm run dev` server to view UI changes in the browser before pushing to GitHub.
* **Integrity:** Never rewrite the `progress_log.md` file; only prepend new entries to it.

Start by running `npm run dev` and viewing the landing page to get oriented with the custom scroll animations, the 3D viewer, and the general site structure. Then, review the `task.md` for Day 1 of Sprint 2!
