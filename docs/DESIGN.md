# Design System

The storefront should feel like an art piece, not a template. Modern, classy, calm, image-led. This file is the working reference for tokens and UI rules; PRD §8 has the full design requirements.

## Color tokens

Raw palette (pastel lavender / ghost-white):

```css
--lavender-grey:   #989DBF;
--ghost-white:     #F4F3F9;
--lavender-grey-2: #A8ADC9;
--white:           #FFFFFF;
--pale-slate:      #B8BCD0;
```

**Known gap:** the palette has no ink (text) color and no accent (CTA) color. Both MUST be added before any UI ships — pastels alone fail WCAG contrast. Placeholder direction until the designer decides (DECISIONS Q9):

```css
--ink:        #2A2A38;  /* deep desaturated plum-charcoal, body text — placeholder */
--accent:     TBD;      /* CTA + sale badges: muted rose / deep lavender / gold */
```

Semantic tokens (map in Tailwind config; components use ONLY semantic tokens, never raw hex):

`--bg`, `--bg-elevated`, `--surface`, `--text`, `--text-muted`, `--border`, `--accent`, `--accent-contrast`, `--sale`, `--focus-ring`

Light theme only in v1; keep the token layer so dark theme is a Phase 2 mapping, not a rewrite.

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

## Imagery

- Consistent aspect ratios: 1:1 or 4:5 on cards, larger on PDP gallery.
- Soft shadows or thin `--border` frames; no heavy chrome.
- Always `next/image`: responsive sizes, lazy below fold, explicit dimensions (zero CLS), meaningful alt text.

## Motion

- Restrained and purposeful: 150–300ms, ease-out on enter.
- Micro-interactions: product-card hover (subtle zoom or secondary-image swap), cart drawer slide, gentle section reveals.
- Transform/opacity only. Always respect `prefers-reduced-motion`.

## Components

Radix UI / shadcn primitives styled custom against semantic tokens: Sheet (cart drawer), Dialog, DropdownMenu/Select (variant pickers), Toast, Tabs, Tooltip. Custom styling must not break Radix focus management or ARIA.

## Accessibility floor

WCAG 2.1 AA: 4.5:1 body / 3:1 large text contrast, visible focus rings, keyboard-complete flows, 44px touch targets, semantic landmarks.
