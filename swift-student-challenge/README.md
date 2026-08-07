# RICH Playground — Swift Student Challenge companion

A small, individually-authored SwiftUI app playground distilling RICH's brand
and interaction design, scoped for a future Apple Swift Student Challenge
(SSC) submission. This is **not** a port of the RICH app — the main app is
Expo/React Native and cannot be submitted to SSC directly, since entries must
be a native `.swiftpm` App Playground built with Swift Playgrounds or Xcode.

## What's here

`RICHPlayground.swiftpm/` is a self-contained App Playground:

- `DesignTokens.swift` — RICH's color, spacing, and radius tokens ported by
  hand from `constants/Colors.ts` / `constants/Design.ts`.
- `WelcomeView.swift` — states the app's real differentiator (on-device only,
  nothing uploaded) before showing any UI.
- `HomeLedgerView.swift` — distilled 首页: mint header, square calendar card,
  entry-day banding, tap-to-select day, dashed-divider ledger.
- `QuickAddView.swift` — distilled amount-first composer: decimal entry,
  backspace, `+`/`-` chaining, category selection, confirm.
- `BudgetPreviewView.swift` — distilled 预算/计划 empty state (headline,
  illustrated donut, tagline, black CTA).
- `RootView.swift` — ties the above together with the real app's two-tab +
  center-FAB bottom bar instead of a stock iOS `TabView`.

Everything is bundled SF Symbols and hand-drawn SwiftUI shapes — no network
calls, no external assets, consistent with SSC's offline-judging requirement.

## Verifying it

This machine only has the Swift command-line toolchain (no full Xcode), so
`swift build` was used to type-check the view/logic code in isolation (a
scratch macOS package with the `#Preview` macros stripped — that macro needs
Xcode/Swift Playgrounds' plugin, not available to plain `swift build`). It
compiled clean. The `.swiftpm` bundle itself — including whether
`Package.swift`'s `AppleProductTypes` manifest is exactly right for the
current SSC toolchain — has **not** been opened/run, since that requires
Swift Playgrounds (iPad/Mac) or Xcode 26+, neither of which is installed
here. Before relying on this for a submission: open
`RICHPlayground.swiftpm` in Swift Playgrounds or Xcode and confirm it runs.

## Eligibility recap (as of this research, mid-2026)

- Age 13+ by default; higher minimums in some countries (mainland China is
  14+).
- Must not be a full-time professional developer; must be a student
  (accredited institution, homeschool equivalent, Apple Developer Academy,
  a STEM org curriculum, or a recent high-school graduate awaiting/accepted
  to college).
- Submission: a `.swiftpm` ZIP ≤25MB, completable within 3 minutes, judged
  offline, individually authored, all content in English.
- The 2026 cycle closed February 28, 2026. The next cycle is expected
  ~February 2027 — check `developer.apple.com/swift-student-challenge`
  closer to the date for the actual window and current rules, since Apple
  can change requirements year to year.

## Scope notes

This deliberately stays small: three screens plus one sheet, no persistence,
no navigation framework beyond a hand-rolled tab switch. SSC judges reward a
polished, interactive, story-driven playground over broad feature coverage —
better to keep this tight and finish it than to grow it toward the full app.
