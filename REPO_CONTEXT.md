# Repo Context

Small Jekyll/GitHub Pages repo for the Rutinario workout tracker. No app framework beyond Jekyll + vanilla JS/CSS.

## Structure

- Landing page: [`index.html`](/Users/ferminsilva/code/rutinario/index.html).
- App shell: [`_layouts/rutina-default.html`](/Users/ferminsilva/code/rutinario/_layouts/rutina-default.html), [`assets/css/base.css`](/Users/ferminsilva/code/rutinario/assets/css/base.css), [`assets/css/rutina.css`](/Users/ferminsilva/code/rutinario/assets/css/rutina.css), [`assets/js/rutina-app.js`](/Users/ferminsilva/code/rutinario/assets/js/rutina-app.js).
- Routine renderer: [`_layouts/rutina-routine.html`](/Users/ferminsilva/code/rutinario/_layouts/rutina-routine.html).
- Routine content lives in [`_routines/fullbody.md`](/Users/ferminsilva/code/rutinario/_routines/fullbody.md) and [`_routines/ppl.md`](/Users/ferminsilva/code/rutinario/_routines/ppl.md).
- `_routines/` is the source collection for routine documents and shared routine data.
- `routines/` is the preferred source folder for route-specific pages that hang off a routine URL, such as `/<slug>/weekly/`, so extra pages do not blur the collection model.
- Shared snippets are in [`_includes/rutina-navbar.html`](/Users/ferminsilva/code/rutinario/_includes/rutina-navbar.html), [`_includes/rutina-week-bar.html`](/Users/ferminsilva/code/rutinario/_includes/rutina-week-bar.html), and [`_includes/info-steps.html`](/Users/ferminsilva/code/rutinario/_includes/info-steps.html).

## App Areas

- Home: goal = explain the app and route users into a routine fast.
- Routine pages: goal = support actual workout tracking week by week.
- Navbar/menu: goal = switch routines and language quickly.
- Week bar: goal = navigate workout history.
- Exercise checklist: goal = track completion and persist locally.

## Behavior

- Bilingual UI (`en`/`es`) uses `data-i18n-*` attributes plus [`_data/i18n/en.yml`](/Users/ferminsilva/code/rutinario/_data/i18n/en.yml) and [`_data/i18n/es.yml`](/Users/ferminsilva/code/rutinario/_data/i18n/es.yml).
- Exercise state is local-only in `localStorage`, keyed by routine slug + ISO week. No backend.
- Week nav is relative to the current week; future weeks are blocked.
- PWA files are [`manifest.json`](/Users/ferminsilva/code/rutinario/manifest.json) and [`sw.js`](/Users/ferminsilva/code/rutinario/sw.js).

## Local Dev

- Run with `bundle exec jekyll serve --livereload --host 0.0.0.0`
- Ruby deps are minimal: [`Gemfile`](/Users/ferminsilva/code/rutinario/Gemfile) uses `github-pages`.
