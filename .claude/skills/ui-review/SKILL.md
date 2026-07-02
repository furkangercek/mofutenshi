---
name: ui-review
description: Review UI components/pages against the MofuTenshi design system (docs/DESIGN.md) and accessibility floor. Use after building or modifying any storefront or admin UI, before committing it. Usage - /ui-review [component or page paths].
---

# UI review

Check the named components/pages (default: UI files in the working diff) against `docs/DESIGN.md`. Read that file first - it is the source of truth, this is the checklist.

## Tokens & visuals

- [ ] Only semantic tokens used (`--bg`, `--text`, `--accent`, ...) - no raw hex, no raw palette vars in components
- [ ] Spacing on the 8px scale; generous whitespace (art must breathe, no dense grids)
- [ ] Product imagery: consistent aspect ratio for the context (1:1 or 4:5 cards), soft framing, no heavy chrome
- [ ] Sale UI: badge + strikethrough original + effective price, per DESIGN/PRD

## Images

- [ ] `next/image` with explicit dimensions (zero CLS)
- [ ] Meaningful alt text (not filename dumps)
- [ ] Lazy-loaded below the fold

## Motion

- [ ] 150-300ms, ease-out enters; restrained, no bounce
- [ ] Animates transform/opacity ONLY
- [ ] `prefers-reduced-motion` respected

## Accessibility (WCAG 2.1 AA floor)

- [ ] Contrast: 4.5:1 body, 3:1 large text
- [ ] Full keyboard path; visible focus rings (`--focus-ring`)
- [ ] Touch targets >= 44px
- [ ] Semantic landmarks/headings; form inputs labeled
- [ ] Radix primitives used for overlays/menus - custom styling must not break their focus/ARIA behavior

## Architecture

- [ ] Server component unless interaction demands client; client islands minimal
- [ ] Storefront page stays SSR/static-optimized (no accidental dynamic opt-out)
- [ ] Empty/loading/error states exist and are branded, not raw

Report violations with `file:line`, fix the mechanical ones, and flag design-judgment calls (e.g., contrast of pastel combinations) to the owner.
