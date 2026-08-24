# RICH 记账 — Brand Guide

**Status:** canonical working standard  
**Version:** 1.2 · August 2026  
**Applies to:** product UI, Swift Student Challenge experience, App Store materials, website,
social media, presentations, and support content

This document is the source of truth for how RICH looks, sounds, and names itself. Product behavior
is defined in [PRODUCT.md](PRODUCT.md); reusable UI behavior is defined in
[COMPONENTS.md](COMPONENTS.md).

| Brand element | Canonical form |
| --- | --- |
| Public product name | **RICH 记账** |
| Primary logo / short name | **Original Avenir Next Bold mixed-case `Rich` artwork** |
| Localized signature | **Continuous `Rich记账` horizontal lockup artwork** |
| Square mark | **Complete one-line `Rich` word centered in a square canvas** |
| Chinese brand line | **把每一笔钱，变成看得见的选择。** |
| English brand line | **Turn every amount into a visible choice.** |
| Visual signature | **Mint field + ledger-white near-square panels + near-black actions + ledger rules + two-tone icons** |

In ordinary text and metadata, set `RICH` in uppercase. Chinese UI may display `RICH 记账`.
The fixed logo is the deliberate exception: its artwork reads `Rich` in mixed case to preserve the
friendlier rhythm of the original app header. Do not re-typeset that artwork, remove the normal
lowercase-i dot, or write `Rich记账 MVP`, `RICH App`, or other unapproved product-name variants.
“MVP” is an internal delivery stage, never part of the product name.

## 1. Brand foundation

### Essence

**Make money choices visible.** RICH turns a small daily action—recording an amount—into a clear
view of what that choice means within a category, subcategory, month, and budget.

### Audience

RICH is designed first for students and young adults who want to understand everyday spending
without connecting a bank account, learning finance jargon, or surrendering their data to an
advertising system. It should still feel credible and useful as their financial life grows.

### Promise

RICH helps someone capture a transaction quickly, place it in a meaningful two-level hierarchy,
and see its effect while retaining control of their data. The experience is:

- **amount-first:** record the number before the app asks for detail;
- **calendar-first:** understand money as a lived sequence of days, not only a dashboard;
- **local-first:** data remains on the device unless the person explicitly exports it; and
- **progressively detailed:** categories work immediately; subcategories add precision when useful.

### Personality

| RICH is | RICH is not |
| --- | --- |
| Clear and concrete | Clever, cryptic, or filled with finance jargon |
| Calm under pressure | Scolding, celebratory about spending, or alarmist |
| Quietly opinionated | Generic banking blue or trend-led fintech decoration |
| Practical and student-aware | Childish, patronizing, or aspirational-luxury |
| Private and honest | Vague about storage, security, or product limits |

## 2. The visual signature

The RICH screen should remain recognizable even when the logo is absent:

1. A **mint field** establishes the page or active context.
2. **Ledger-white, square or near-square panels** organize real information inside that field.
3. **Near-black actions and amounts** create decisive focal points.
4. **Solid and dashed ledger rules** explain hierarchy, rows, dates, and totals.
5. **Two-tone line icons** pair an ink outline with one meaningful mint detail.

The aesthetic is **iOS-native ledger minimalism**, not soft-card minimalism. Precision in alignment,
spacing, and rules carries the character. Do not compensate with gradients, glass effects, heavy
shadows, ornamental blobs, or a page full of rounded cards.

## 3. Logo and naming system

### Approved artwork

Use the supplied vector files; do not redraw or typeset a substitute logo:

| Asset | Use |
| --- | --- |
| `assets/brand/rich-wordmark.svg` | Primary full `Rich` wordmark on white, paper, or other light fields |
| `assets/brand/rich-wordmark-reversed.svg` | Primary full `Rich` wordmark on ink or a sufficiently dark image |
| `assets/brand/rich-wordmark-on-mint.svg` | Primary full `Rich` wordmark on the exact RICH Mint field |
| `assets/brand/rich-lockup-horizontal.svg` | Localized horizontal `Rich记账` signature artwork on light fields |
| `assets/brand/rich-lockup-horizontal-reversed.svg` | Localized signature on ink or a sufficiently dark image |
| `assets/brand/rich-lockup-horizontal-on-mint.svg` | Localized signature on the exact RICH Mint field |
| `assets/brand/rich-mark.svg` | Complete one-line `Rich` word centered in a square canvas on light fields |
| `assets/brand/rich-mark-reversed.svg` | Reversed square `Rich` mark on dark fields |
| `assets/brand/rich-mark-on-mint.svg` | Ink square `Rich` mark on RICH Mint |
| `assets/brand/rich-app-icon-master.svg` | Full-word mint composition for platform icon exports only |
| `assets/brand/rich-brand-sheet.svg` | Visual overview for review and handoff |
| `assets/brand/rich-brand-sheet.jpg` | Review-ready raster preview; generated from the SVG master |
| `assets/brand/README.md` | Asset-specific export and usage notes |

The custom horizontal **Rich** wordmark is the primary logo. Use it for first contact, branded
headers, launch materials, and marketing. The horizontal `Rich记账` lockup is a localized
signature: it contains the `Rich` wordmark once, followed by the secondary `记账` descriptor, and
must never add the square mark before the wordmark or repeat the name.

Use the square `Rich` mark for favicons, app-icon studies, and other reviewed square placements. It
keeps the complete word on one line rather than stacking or abbreviating it. The app-icon master is
not a replacement for the ordinary wordmark or localized signature. Updating the app-icon master
does not authorize replacing the production Expo icon; that remains a separate, explicit
integration decision.

### Wordmark, signature, and square-mark construction

The primary logo spells **Rich** in Avenir Next Bold (`700`) with natural tracking. The tall capital
R, lowercase i/c/h, angled c terminals, and mixed letter heights reproduce the friendly rhythm of
the original app header. This locked typesetting is intentional: do not replace it with the system
font, a rounded display font, a custom redraw, or added decorative shapes.

The circle above the lowercase i is its ordinary dot. It uses the same color as every letter, stays
centered over the stem, and is never detached, recolored, hollowed out, or interpreted as a badge.
The square mark keeps this complete word on one line and centers it optically within its canvas.

The localized horizontal signature sets `Rich记账` continuously, without an inserted space. Avenir
Next Bold carries the Latin word; PingFang SC Semibold (`600`) is 91.7% of the Latin size and sits
slightly higher on the shared baseline. Their natural font bearings create the original visible
gap. The lockup does not add the square mark, because that would duplicate the complete name.

### Spacing and minimum size

- Let `u` equal the width of the capital R's main vertical stem. Keep at least `2u` around the full
  wordmark and localized horizontal lockup, and `1.5u` around the square mark.
- Minimum digital width: 80 px for the full `Rich` wordmark and 120 px for the localized lockup.
- Use the square mark at 48 px wide or larger and verify it as a raster proof at its delivery size.
- Use the dedicated app-icon composition at platform-required sizes; never restack, crop, or
  abbreviate the ordinary wordmark to force another square construction.
- Preserve the artwork's aspect ratio and internal spacing.

Never recolor individual pieces, stretch, rotate, outline, add a shadow, place on a noisy image, or
put the artwork inside an unapproved container. Do not combine the logo with an Apple mark, award
laurel, bank logo, or another product's identity.

In ordinary interface copy, write the name as text (`RICH 记账`) in the system typeface. Branded
headers, launch materials, and marketing should use the approved `Rich` wordmark or, when the Chinese
descriptor is necessary, the localized horizontal signature.

## 4. Color

### Core palette

| Token | Hex | Role |
| --- | --- | --- |
| RICH Mint | `#3ECDA5` | Signature field, active state, selected detail, icon accent |
| Pressed Mint | `#2BB890` | Pressed or strengthened mint state |
| Accessible Ink Green | `#14745B` | Green text and focus detail on light surfaces |
| Ledger White | `#FFFFFF` | Cards, sheets, list bands, reversed content |
| Ledger Paper | `#F5F6F7` | Bounded utility panels and empty states |
| Page Gray | `#F4F4F4` | Group separation and utility-screen background |
| RICH Ink | `#1A1A1A` | Primary text, amounts, outlines, primary actions |
| Secondary Ink | `#666666` | Supporting labels and values |
| Muted Ink | `#999999` | Inactive controls and decorative metadata only |
| Ledger Rule | `#E5E5E5` | Solid inset separators and borders |
| Entry Mint | `#B5EAD7` | Calendar dates containing entries |

RICH Mint is a field and a signal, not a wash applied to every surface. The essential pair is mint
with RICH Ink; do not place small white text on mint.

### Semantic and data colors

| Token | Hex | Use |
| --- | --- | --- |
| Income Green | `#4CAF50` | Positive/income visualization; use `#247A3C` for small text on white |
| Balance Blue | `#5C9CE6` | Balance adjustments only |
| Warning Amber | `#E2A33A` | Budget use from 80% through 100% |
| Destructive Coral | `#FF6B6B` | Destructive controls and over-budget surfaces; use `#C43D4D` for small text on white |
| Chart Teal | `#61CFCB` | Primary categorical series |
| Chart Blue | `#88A8EE` | Secondary categorical series |
| Chart Violet | `#9B8CFF` | Tertiary categorical series |

Expense amounts remain ink; red does **not** mean ordinary spending. Semantic color never works
alone: pair it with a label, sign, icon, pattern, or numeric state.

## 5. Typography and numbers

RICH uses platform typography so it feels immediate, legible, and native:

- **English and Latin:** SF Pro Display / SF Pro Text through the Apple system font.
- **Simplified Chinese:** PingFang SC through the system font fallback.
- **Numbers:** the same system family with tabular numerals wherever values align or compare.
- **Code and exported technical samples only:** a system monospace. Bundled Space Mono is not a
  brand face and should not appear in ordinary product or marketing copy.

| Role | Size / weight | Guidance |
| --- | --- | --- |
| Brand title | Contextual / 700 | Reserved for the RICH name and major empty-state heading |
| Screen title | 17 / 600 | One line, visually centered |
| Section title | 14 / 600 | Compact and factual |
| Body | 13 / 400 | Default interface copy |
| Label | 12 / 400 | Supporting controls and metadata |
| Caption | 10.5 / 400 | Use sparingly; never essential at an unreadable size |
| Amount | Contextual / 500–600 | `fontVariant: ['tabular-nums']`; align decimals when comparing |

Use weights 400–600 for almost all interface text. Do not use faux bold, decorative serif display
type, all-caps sentences, condensed finance typography, or arbitrary letter spacing. Ordinary
product-name copy uses uppercase `RICH`; branded display uses the approved Avenir Next Bold
mixed-case `Rich` artwork rather than a re-typeset substitute.

## 6. Geometry, layout, and interaction

- Base spacing scale: `4, 8, 12, 16, 20, 24, 32`.
- Standard screen inset: 16 px in dense tools; 20–24 px in full-width compositions.
- Content panels: 0–4 px radius. Controls: 6 px. Soft utility elements: 8 px.
- Pills, category frames, avatars, icon controls, and sheets are intentional rounded exceptions.
- Minimum touch target: 44 × 44 px.
- A primary black action is rectangular and decisive; do not turn every command into a mint pill.
- Dashed rules mark date or amount boundaries. Solid hairlines divide rows within a panel.
- Transaction rows rely on whitespace; they do not need a border around every item.
- Category grids use five equal columns and stable 40–48 px circular frames.
- The center add action is a 58 px near-black circle that rises above the two-item tab bar.

Use alignment as the main ornament. A mint header, white ledger panel, and black command should form
one clear hierarchy rather than three competing cards.

## 7. Icons and illustration

### Category icons

- Draw on a 24 × 24 grid with a 1.7 px RICH Ink stroke, round caps, and round joins.
- Use no fill unless the individual construction requires it.
- Add at most one meaningful RICH Mint detail; the accent should clarify the object, not decorate it.
- Make each object recognizable at the actual 20–26 px product size, not only while zoomed in.
- Use 16 px only in compact ledger rows; place grid icons in a 40–48 px light-gray circle.
- Keep mass, detail density, and baseline consistent across the family.
- Never mix emoji, filled platform glyphs, or an unrelated icon pack into a RICH category grid.

Source artwork lives in `assets/icons/categories/`; `assets/icons/gallery.html` is the visual QA
sheet. Test a new icon beside its full category family and in the real five-column picker.

### Illustration

Illustration follows the same ledger logic: flat vector geometry, ink construction, restrained mint
fills, and generous white space. Favor recognizable objects from everyday student life—calendar,
receipt, groceries, transit, books, shared meals—over abstract wealth imagery. Avoid 3D rendering,
stock-character scenes, glossy gradients, coins flying through space, and luxury-investment cues.

One illustration may carry one focal gesture. It should support a task or explain a state, never
serve as filler. People and examples should be culturally neutral and inclusive without turning
identity into decoration.

## 8. Voice and language

RICH speaks like a calm, capable record keeper. It uses plain verbs, names the thing a person can
control, and explains the next action. Chinese and English should communicate the same intent, but
each should sound native rather than word-for-word translated.

### Voice rules

1. **Direct:** put the action first—`记一笔` / `Add a transaction`.
2. **Specific:** say what happened and what fixes it.
3. **Non-judgmental:** describe a budget state; never shame a purchase.
4. **Honest:** only make privacy, security, or availability claims the current build can prove.
5. **Compact:** one label does one job; remove greetings and promotional filler from workflows.

| Moment | Chinese | English |
| --- | --- | --- |
| Brand line | 把每一笔钱，变成看得见的选择。 | Turn every amount into a visible choice. |
| Empty ledger | 还没有记录。记下第一笔支出。 | No entries yet. Add your first expense. |
| Budget state | 本月已用 82%，还剩 ¥180。 | You’ve used 82% this month. ¥180 remains. |
| Local privacy | 数据保存在这台设备上，只有导出时才会离开。 | Your data stays on this device unless you export it. |
| Specific error | 无法恢复备份：不支持这个文件格式。 | Couldn’t restore this backup. The file format isn’t supported. |
| Destructive confirmation | 删除后无法恢复。仍要删除？ | This can’t be undone. Delete it? |

Avoid `开启财富自由`, `聪明理财`, `消费失败`, vague `出错了`, and claims such as `100% secure`.
Avoid “Unlock your financial future,” “Oops!”, “Bad spending,” “Something went wrong,” and other
copy that sells, jokes, or blames when the person needs direction.

Use Simplified Chinese in the main Chinese product and sentence case in English. Do not place both
languages inside the same control. Keep the established product terms `支出`, `收入`, `预算`,
`类目`, and `子类目` consistent across navigation, help, and marketing.

## 9. Accessibility

Accessibility is part of the brand promise, not a post-launch variation.

- Maintain at least 4.5:1 contrast for normal text and 3:1 for large text and essential UI shapes.
- Use RICH Ink on Mint. `#999999` is for inactive/decorative content, never required small copy.
- Support Dynamic Type without clipping amounts, dates, or primary actions.
- Preserve a logical reading order and concise accessibility labels for icon-only controls.
- Do not rely on color, position, or animation alone to communicate income, warnings, selection, or
  budget overrun.
- Respect Reduce Motion and Increase Contrast. Motion must explain a state change, not add ambience.
- Keep every actionable target at least 44 × 44 px and show visible keyboard/focus states on web.
- Use tabular numerals for comparison, but expose complete spoken currency labels to VoiceOver.
- Test at compact and tall iPhone sizes, larger text settings, VoiceOver, and increased contrast.

## 10. App Store and marketing

### Content hierarchy

Lead with the product difference, not a feature pile:

1. **把每一笔钱，变成看得见的选择。**
2. Fast manual capture.
3. Category → subcategory visibility.
4. Calendar and budget consequences.
5. Local-first control and explicit export.

Use the primary `Rich` wordmark once per composition. Use the localized `Rich记账` signature artwork instead
only when the Chinese descriptor materially improves identification. Build marketing frames from
the same mint field, ledger-white panels, near-black actions, rules, and real two-tone icons used in
the app.

### Screenshot and claim rules

- Show current, working UI with clearly fictional amounts, names, notes, and accounts.
- Never show real personal finance data, notification content, account numbers, or identifying files.
- Do not fabricate reviews, rankings, usage statistics, Apple awards, bank support, or security
  certification.
- Say “local-first” or “stored on this device” only while that is true. If analytics, sync, AI, bank
  connection, or a crash SDK transmits data, update the copy and privacy disclosure before launch.
- Do not imply Apple endorsement or combine RICH artwork with Apple product marks.
- Keep screenshots readable at store thumbnail size; one message and one visual proof per frame.
- Export the full-word app-icon composition from `rich-app-icon-master.svg` to Apple's required
  sizes and color profile; do not add transparency, a device frame, or marketing copy inside the
  icon. Keep the currently configured production icon unchanged until explicit integration approval.
- The Swift Student Challenge artifact remains a separate English-only deliverable and must follow
  the current competition rules and its own submission documentation.

Use **RICH 记账** consistently in App Store metadata, support pages, privacy materials, screenshots,
and review notes. Confirm that the chosen name fits current storefront limits before locking final
metadata.

> [!WARNING]
> ### Internal working identity — clearance required before public use
>
> **“RICH 记账,” the RICH marks, and this guide are an internal working identity. Their presence in
> the repository does not establish trademark clearance, App Store name availability, domain or
> social-handle ownership, or rights to archived reference screens.** Before TestFlight marketing,
> competition submission, press outreach, or public release, document the origin and license of all
> identity and interface artwork; search relevant trademark and storefront records; secure the
> required names and accounts; and independently redesign any element whose rights cannot be
> demonstrated. Do not present RICH as Apple-sponsored or award-winning. The release owner must
> resolve the copycat, ownership, and name-clearance risks recorded in
> [APPLE_RELEASE_2026.md](APPLE_RELEASE_2026.md) before approving external use.

## 11. Source-of-truth map

| Area | Canonical location |
| --- | --- |
| Brand strategy, voice, and usage | `docs/BRAND_GUIDE.md` |
| Logo masters and brand sheet | `assets/brand/` |
| React Native color tokens | `constants/Colors.ts` |
| React Native spacing, radius, type, and size | `constants/Design.ts` |
| Swift design tokens | `swift-student-challenge/RICHPlayground.swiftpm/Sources/RICHPlayground/DesignTokens.swift` |
| Component contracts | `docs/COMPONENTS.md` |
| Product promise and behavior | `docs/PRODUCT.md` |
| Category icon masters | `assets/icons/categories/` |
| Category icon QA gallery | `assets/icons/gallery.html` |
| Browser reference compositions | `docs/mockups.html` |
| Release, ownership, and Apple-readiness risks | `docs/APPLE_RELEASE_2026.md` |

Archived screenshots in `RICH Items/` are historical references, not a brand source of truth and
not evidence of ownership.

When the identity changes, update this guide, `assets/brand/`, React Native tokens, Swift tokens,
and affected release materials in the same change. Do not create a near-duplicate color, logo,
product-name variant, or voice pattern to solve a one-screen problem.
