# Personal Website and Freelancermap Portfolio

Static personal website for Dominik Stiftinger-Lang. It uses the same grayscale palette, Poppins typography, dot motif, and editorial structure as the 2024 CV design.

## Open locally

Open `index.html` directly in a browser. The production site has no external runtime dependencies.

For a clean deployment bundle:

```bash
npm install
npm run build
```

The generated `dist/` directory contains only files intended for public hosting.

## Contents

- `index.html`: main personal website
- `links.html`: compact self-hosted link-in-bio page
- `impressum.html`: verified company disclosure
- `datenschutz.html`: privacy notice for a tracker-free static site
- `assets/dominik-stiftinger-lang-cv.pdf`: current Freelancermap CV
- `portfolio/exports/`: six 1600 x 1000 PNG files ready for Freelancermap
- `portfolio/freelancermap-portfolio.md`: titles and descriptions for the six uploads
- `previews/`: verified desktop and mobile full-page screenshots
- `tools/`: build, browser verification, and portfolio-export scripts

## Hosting

The production site is published at [cyberpwny.github.io/personal-website](https://cyberpwny.github.io/personal-website/). GitHub Actions builds and deploys only the generated `dist/` directory to GitHub Pages after every push to `main`.

A custom domain can be added later without changing the site structure.

## Before public deployment

1. Add each public case-study anchor URL to the optional Freelancermap link field.
2. Confirm that the confidential-deployment claims remain approved for public use.

No analytics, cookies, embedded social feeds, or contact form are included.
