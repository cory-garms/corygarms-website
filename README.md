# Cory Glenn Garms - Personal Website

A high-end, dynamic personal portfolio and blog built for **Cory Glenn Garms, Ph.D.**, a Senior Scientist specializing in remote sensing, Lidar, and 3D computer vision at Spectral Sciences, Inc.

The site is built with an "Automated Architect" mindset, prioritizing performance, accessibility, and clean container-ready development.

## 🚀 Tech Stack

* **Framework:** [Astro](https://astro.build/) (Static Site Generation for extreme performance)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) with a custom Scientific/Dark (Viridis/Magma) theme.
* **3D Rendering:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) / [Three.js](https://threejs.org/) for the Point Cloud visualization.
* **CMS:** Astro Content Collections (Markdown/MDX for the "Notes" section).
* **Automation:** Node.js custom scripting & GitHub Actions.

## 🏃‍♂️ Getting Started Locally

All commands are run from the root of the project.

### Prerequisites

* Node.js (v20+)
* npm (or pnpm/yarn)

### Installation & Development

```sh
# 1. Install dependencies
npm install

# 2. Start the local development server at http://localhost:4321
npm run dev
```

### Building & Testing

```sh
# Build the production site into the ./dist/ directory
npm run build

# Preview the built production site locally
npm run preview
```

## 🛠️ DevOps & "Automated Architect" Scripts

The project includes custom scripts designed to ensure the site remains healthy, performant, and secure over time:

* `npm run health-check`: Runs a comprehensive security audit (`npm audit`), verifies the build integrity, and checks the production SSL/DNS status of `corygarms.com`.
* `npm run audit:perf`: Executes an automated [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) assertion against the generated static site to enforce Performance (>85%), Accessibility (>95%), and SEO (>90%) constraints.

**Continuous Integration:**
This repository uses GitHub Actions (`.github/workflows/ci.yml`) to automatically run the build and health checks on every push or pull request to the `main` branch.

## 📝 Content Management (Notes)

The "Notes" section acts as a markdown-based CMS. 

To add a new note/blog post:
1. Create a new `.md` file in `src/content/notes/`.
2. Include the required frontmatter:
   ```yaml
   ---
   title: "Your Post Title"
   publishDate: "YYYY-MM-DD"
   description: "A short summary."
   tags: ["Tag1", "Tag2"]
   ---
   ```
3. Write your content. It will be automatically parsed, routed to `/notes/[slug]`, and listed on the homepage API.

## 🌐 Deployment

This site is continuously deployed via **Vercel**. Any commits pushed to the `main` branch will automatically trigger a production build and deployment to `corygarms.com`.

## 🎨 Acknowledgements & Design

* Designed with a layout specifically tailored for academic papers and posters (`src/layouts/PublicationLayout.astro`).
* Implements robust accessibility (A11y) standards, an automated sitemap (`@astrojs/sitemap`), and rich OpenGraph/Twitter social meta tags.
* Incorporates custom vanilla JS Intersection Observers for lightweight, performant scroll-reveal micro-animations.

---
&copy; Cory Glenn Garms. All rights reserved.
