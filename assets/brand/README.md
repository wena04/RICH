# RICH brand assets

This directory contains the editable, vector-first identity package for **RICH 记账**. In ordinary
text, use the canonical product name exactly as written: uppercase `RICH`, one space, then `记账`.
The fixed logo artwork intentionally reads **Rich** in mixed case to preserve the friendly character
of the original app header; do not treat that artwork casing as a metadata spelling change.

Canonical brand line:

- Chinese: **把每一笔钱，变成看得见的选择。**
- English: **Turn every amount into a visible choice.**

## Status and provenance

> **Internal working identity — not cleared for public release.** These assets are original working files developed inside the RICH project, but the product name, identity design, and any referenced legacy material still require ownership, trademark, and release clearance before App Store submission, publication, merchandising, or other external use.

The existing files `assets/images/icon-rich.png` and `assets/images/icon-rich-source.png` remain the current production app-icon assets until an explicit design and release approval replaces them. Do not silently swap the production icon to a file from this directory.

Expo starter artwork, template icons, favicons, and other placeholders are not RICH brand assets and must not be used in builds, store listings, presentations, or marketing exports.

## Package contents

All SVG files are masters. Keep them editable and export derivatives rather than editing generated PNGs.

| File | Purpose | Intended background |
| --- | --- | --- |
| `rich-wordmark.svg` | Primary original-style `Rich` wordmark | White, near-white, or other light neutral backgrounds |
| `rich-wordmark-reversed.svg` | Reversed primary `Rich` wordmark | Ink (`#1A1A1A`), dark photography, or another sufficiently dark solid background |
| `rich-wordmark-on-mint.svg` | Ink primary `Rich` wordmark | RICH Mint (`#3ECDA5`) fields only |
| `rich-lockup-horizontal.svg` | Localized original-style `Rich记账` signature | White, near-white, or other light neutral backgrounds |
| `rich-lockup-horizontal-reversed.svg` | Reversed localized signature | Ink (`#1A1A1A`) or another sufficiently dark background |
| `rich-lockup-horizontal-on-mint.svg` | Ink localized signature | RICH Mint (`#3ECDA5`) fields only |
| `rich-mark.svg` | Complete one-line `Rich` artwork centered in a square canvas | White, near-white, or other light neutral backgrounds |
| `rich-mark-reversed.svg` | Reversed square `Rich` mark | Ink (`#1A1A1A`), dark photography, or another sufficiently dark solid background |
| `rich-mark-on-mint.svg` | Ink square `Rich` mark | RICH Mint (`#3ECDA5`) fields only |
| `rich-app-icon-master.svg` | Square, full-bleed mint app-icon composition using the complete `Rich` word | Used as the artwork itself; do not place it inside another tile |
| `rich-brand-sheet.svg` | Reference sheet showing approved assets, palette, spacing, sizing, and misuse examples | Documentation and internal review only; never ship as a logo asset |
| `rich-brand-sheet.jpg` | Raster preview of the brand sheet for quick sharing and review | Documentation and internal review only; regenerate from the SVG after changes |

The horizontal `Rich` artwork is the primary logo. The existing horizontal lockups are localized
signatures that contain the wordmark once followed by `记账`; they must not add the square mark
before the wordmark.
If additional language-specific lockups are created, retain `RICH 记账` as the canonical product
name and use descriptive suffixes such as `-en` or `-zh`. Do not rename the product inside an asset.

## Wordmark, signature, and square-mark construction

The primary logo must read immediately as **Rich** and reproduce the original app header rather
than reinterpret it. Its locked Latin construction is Avenir Next Bold (`700`), mixed-case `Rich`,
with natural tracking. The localized signature sets `Rich记账` as one continuous line, using
PingFang SC Semibold (`600`) at 91.7% of the Latin size so both scripts share the original baseline
and visual mass. The natural font bearings create the small visible gap; do not insert a space.

The black circle above the i is its ordinary typeface dot: it is the same color as the other
letters and is never treated as a decorative badge or cutout. Do not substitute a rounded display
font, redraw individual letters, add a gap before `记账`, or change the approved weight and tracking.

The square mark keeps the complete `Rich` word on one line and centers it inside a square canvas.
It never stacks, abbreviates, or converts the word to a monogram. It is the source composition for
the app-icon master, not an alternate spelling of the name.

The localized signature combines exactly one `Rich` wordmark with one secondary `记账` descriptor
in the continuous original `Rich记账` treatment.
Never place the square mark before or beside it, which would duplicate the product name.

## Core palette

| Token | Hex | Use |
| --- | --- | --- |
| RICH Mint | `#3ECDA5` | Primary identity color and meaningful highlights |
| RICH Mint Dark | `#2BB890` | Darker mint support where additional contrast is required |
| RICH Ink | `#1A1A1A` | Primary wordmark, linework, and dark backgrounds |
| White | `#FFFFFF` | Reversed artwork and clean surfaces |
| Canvas | `#F5F5F5` | Soft product and presentation background |
| Border | `#E5E5E5` | Supporting UI rules only; not a logo color |

Use exact values for identity exports. Semantic product colors such as expense red, income green, and adjustment blue belong to the UI system and should not be introduced into the core mark or wordmark.

## Clear space

Let `u` equal the width of the capital R's main vertical stem in the approved letterforms.

- Keep at least `2u` clear space on every side of the primary wordmark and localized lockup.
- Keep at least `1.5u` clear space on every side of the square mark.
- Measure from the outermost visible artwork, not the SVG canvas.
- No text, screen edge, crop, border, illustration, or other logo may enter this area.
- Measure `u` from the artwork at its final scale; do not alter the letterforms to change the result.

## Minimum sizes

These limits protect the complete name and the internal spacing of the mixed-case construction. The
square mark serves square contexts; it does not replace the primary horizontal logo.

| Asset | Digital minimum | Print minimum |
| --- | ---: | ---: |
| Full `Rich` wordmark | 80 px wide | 22 mm wide |
| Localized `Rich记账` lockup | 120 px wide | 32 mm wide |
| Square `Rich` mark | 48 px wide | 14 mm wide |
| App icon | Use the platform-required export size | Not intended for print |

Inspect the square mark as a raster proof at 48 px, 60 px, and 76 px before release. Do not assume
that it is legible merely because the SVG can scale down.

## Export guidance

### iOS and the App Store

- Export the approved full-word composition in `rich-app-icon-master.svg` to a **1024 × 1024 px**, full-bleed, opaque PNG in sRGB for App Store submission.
- Do not add a rounded-rectangle mask; Apple applies the platform mask.
- Do not add transparent margins, a white border, or an extra container around the master artwork.
- Generate the required Xcode asset-catalog sizes from the approved master, not from a previously resized PNG.
- Review the icon at actual Home Screen, Spotlight, Settings, and notification sizes before approval.
- Render release exports on macOS and confirm that Avenir Next and PingFang SC resolve correctly;
  these live-text SVG masters can change appearance on a platform without the same fonts.
- Confirm the current requirements in Xcode and App Store Connect before submission, since platform specifications may change.

Until approval is recorded, keep `assets/images/icon-rich.png` configured as the production icon.

### Web and documents

- Prefer the full `Rich` wordmark SVG wherever the destination supports it. Use the localized lockup only when the Chinese descriptor is needed.
- For raster delivery, export transparent PNGs at 1×, 2×, and 3× from the SVG master; use descriptive names such as `rich-wordmark@2x.png`.
- Use sRGB for browser, presentation, and document exports.
- Use the primary assets on light surfaces, the `-reversed` files on dark surfaces, and the `-on-mint` files only on the exact RICH Mint field.
- For favicons and similarly constrained square contexts, make dedicated, reviewed exports from the square mark. Never use a starter placeholder.

## Correct use

Do:

- Preserve the artwork's proportions, spacing, colors, and letter construction.
- Choose the primary or reversed asset according to background contrast.
- Use the full `Rich` wordmark as the primary logo.
- Use the horizontal lockup only as the localized `Rich记账` signature artwork.
- Use the square `Rich` mark for reviewed square contexts.
- Keep the canonical name `RICH 记账` and the approved brand line unchanged.
- Export from the vector master and visually inspect the final size.

Don't:

- Recolor, stretch, rotate, outline, crop, skew, or redraw the assets.
- Add gradients, shadows, glows, bevels, strokes, containers, or unapproved animation.
- Place the primary dark artwork on a busy or dark background, or the reversed artwork on a light background.
- Add decorative cutouts, badges, symbols, or accent shapes to the letterforms.
- Place the square mark beside the wordmark or localized lockup; that duplicates the name.
- Re-typeset the wordmark with a substitute font or alter the locked weight, tracking, or continuous
  spacing in `Rich记账`.
- Change the approved mixed-case artwork, translate it, abbreviate it, or respell the canonical
  product name in ordinary copy.
- Publish these working assets, replace the current production icon, or treat the brand sheet as final clearance without explicit approval.
