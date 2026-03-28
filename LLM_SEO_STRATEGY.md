# LLM & SEO Strategy

This repo hosts `https://rutinario.app` as a standalone Jekyll site.

## URL Structure

- App hub: `/`
- Routine pages: `/routines/{slug}/`
- Sitemap: `/sitemap.xml`
- Robots policy: `/robots.txt`
- LLM summary: `/llms.txt`

## Discovery Goals

- Make the app hub understandable as a workout tracker product page.
- Make each routine page indexable as a distinct workout resource.
- Keep canonical URLs on the `rutinario.app` domain only.

## Current Implementation

- [`_layouts/rutina-default.html`](/Users/ferminsilva/code/rutinario/_layouts/rutina-default.html) handles canonical tags, OpenGraph tags, Twitter tags, and JSON-LD.
- [`sitemap.xml`](/Users/ferminsilva/code/rutinario/sitemap.xml) lists the home page plus every routine in `site.routines`.
- [`robots.txt`](/Users/ferminsilva/code/rutinario/robots.txt) allows crawlers to index the app and routine pages.
- [`llms.txt`](/Users/ferminsilva/code/rutinario/llms.txt) gives crawlers a compact summary of the app and direct routine links.

## Notes

- The old `fermin-silva.github.io/rutina/...` URLs should now be treated as legacy redirects only.
- If new routines are added, they should appear in the navbar, sitemap, and `llms.txt`.
