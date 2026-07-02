# Design System

The storefront should feel like an art piece, not a template. Modern, classy, calm, image-led. This file is the working reference for tokens and UI rules; PRD v2 §8 has the full design requirements.

## Color tokens (PRD v2 §8.1)

```css
--ink: #000000; /* body + heading text */
--bg: #f2f2f2; /* page background */
--surface: #ffffff; /* cards / elevated surfaces */
--primary: #b6bff2; /* primary buttons / interactive */
--primary-2: #a7b3d9; /* secondary / hover / darker button state */
--accent: #d9c99a; /* gold — highlights, sale badges, emphasis */
/* Supporting pastels, for surfaces/borders: */
--lavender-grey: #989dbf;
--ghost-white: #f4f3f9;
--lavender-grey-2: #a8adc9;
--pale-slate: #b8bcd0;
```

Semantic tokens (map in Tailwind config; components use ONLY semantic tokens, never raw hex):

`--bg`, `--surface`, `--text` (= `--ink`), `--text-muted`, `--border`, `--primary`, `--primary-contrast`, `--accent`, `--sale`, `--focus-ring`

Contrast rules:

- Black text on light pastels passes WCAG AA comfortably.
- **Black on `--primary` (#B6BFF2) verified 2026-07-02: 11.72:1 — passes AA/AAA.** White on primary fails (1.79:1); primary CTAs use black text (`--primary-contrast: #000000`).
- Implemented values (verified): `--muted: #4b4f66` (7.19:1 on bg), `--focus-ring: #4f588f` (≥3.75:1 on bg/surface/primary), `--border: #b8bcd0`.
- `--accent` gold is for highlights/badges, NOT primary button fills.
- Light theme only in v1; dark theme is Phase 3 — keep the semantic token layer so it's a mapping, not a rewrite.

## Language

UI copy is Turkish (v1) — tone: modern, classy, warm; no machine-translation stiffness. English arrives with Phase 3 i18n. Chosen fonts MUST fully support Turkish glyphs (ı İ ş Ş ğ Ğ ü Ü ö Ö ç Ç) in all used weights — check the display font especially.

## Typography

- Display: distinctive serif or high-contrast sans for headings/hero (gallery feel). TBD by designer.
- Body/UI: clean legible sans.
- Self-hosted via `next/font` — no runtime font CDN requests.
- Modular scale ~1.25 ratio; body line-height 1.5–1.6, tighter on display sizes.

## Spacing & layout

- 8px base unit; scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Generous whitespace — art must breathe. No dense grids.
- Constrained width for text sections; wide/edge-to-edge for imagery.
- Product cards: image-led, minimal metadata (name, price, sale badge).

## Navigation (tag-based)

- Nav bar lists top-level hierarchical tags (Figures, Handcrafts, Art Prints, Stickers).
- Desktop: hover/focus on a top-level tag reveals its subtags; click goes to the parent tag page. Keyboard-accessible (focus opens, Escape closes) — Radix NavigationMenu.
- Mobile: tap-to-expand accordion in the menu drawer.
- Homepage: hero + On Sale / New Arrivals / Best Sellers sections (data-driven), plus a tag entry grid.

## Imagery

- Consistent aspect ratios: 1:1 or 4:5 on cards, larger (3:2 / 4:5) on PDP gallery.
- Soft shadows or thin `--border` frames; no heavy chrome.
- Always `next/image`: responsive sizes, lazy below fold, explicit dimensions (zero CLS), meaningful alt text.

## Motion

- Restrained and purposeful: 150–300ms, ease-out on enter.
- Micro-interactions: product-card hover (subtle zoom or secondary-image swap), cart drawer slide, gentle section reveals.
- Transform/opacity only. Always respect `prefers-reduced-motion`.

## Components

Radix UI / shadcn primitives styled custom against semantic tokens: NavigationMenu (tag nav), Sheet (cart drawer), Dialog, DropdownMenu/Select (variant pickers), Toast, Tabs, Tooltip. Custom styling must not break Radix focus management or ARIA.

## Accessibility floor

WCAG 2.1 AA: 4.5:1 body / 3:1 large text contrast, visible focus rings, keyboard-complete flows, 44px touch targets, semantic landmarks.
