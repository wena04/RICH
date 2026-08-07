# What you need to actually enter the Swift Student Challenge

## Account and eligibility

1. **A free Apple Account is enough.** SSC does not require a paid Apple
   Developer Program membership — that's only needed later for actual App
   Store distribution.
2. **Age/eligibility self-certification.** The application form asks for
   birthdate, country of residence (this determines your minimum age — 14+
   in mainland China, per Apple's published eligibility page), and which
   qualifying status applies: enrolled in an accredited school/homeschool
   equivalent, enrolled in a STEM-focused org curriculum, an Apple Developer
   Academy participant, or graduated high school within the last 6 months
   and awaiting/accepted into college. This is an attestation at
   application time, not a document upload — Apple can ask winners to
   verify it afterward.
3. **Parental consent.** If you're a minor (true for most SSC applicants),
   Apple's account flow requires a parent/guardian consent step — have a
   parent available when you register/verify the Apple Account used to
   apply.
4. **Individually authored.** No group submissions. Open-source/public
   domain third-party assets are allowed with credit, but the code and
   design have to be your own work.

## The submission artifact

- A `.swiftpm` App Playground, zipped, **≤25MB**.
- Must be understandable/completable in **under 3 minutes**, unnarrated —
  our current scope (welcome → home ledger → budget tab → quick-add sheet)
  fits this.
- **No network dependency** — judged fully offline. We're already clean:
  SF Symbols + hand-drawn SwiftUI shapes, no remote assets or API calls.
- Built/opened with **Swift Playgrounds 4.6+ or Xcode 26+.** This dev
  machine only has the Swift command-line toolchain, not the full IDE — see
  the verification note below.
- All submission-facing text in **English** (the in-app Chinese copy is
  fine as product identity; the write-up/description Apple collects is
  not).

## Draft written description (for the submission form)

**Short version** (elevator pitch):

> RICH is a playground exploring what a fully private, on-device
> bookkeeping app could look like: every screen — the calendar-based
> ledger, the amount-first entry flow, and the budget view — runs entirely
> offline, with a deliberately square, high-contrast visual language
> instead of the rounded-card look most finance apps share.

**Longer version** (if the form allows more room):

> I built RICH Playground to explore an idea I kept coming back to while
> designing a personal finance app of my own: that privacy in a finance app
> should be a visible design choice, not just a line in a privacy policy.
> Every value on screen — account balances, the calendar's entry-day
> markers, the budget donut — is computed locally, with no network calls
> anywhere in the app. I also wanted the interface itself to say something:
> rather than the rounded cards most finance apps default to, RICH uses a
> square, high-contrast geometry, carried through a single consistent color
> system — a mint accent against near-black text — on every screen. The
> playground walks through three connected moments: a welcome screen that
> states the privacy premise up front, a home ledger with a tappable
> calendar, and an amount-first entry flow with real chained +/- arithmetic
> before confirming a transaction — all interactive, not static mockups.

## Before submitting for real

- Open `RICHPlayground.swiftpm` in Xcode 26+ or Swift Playgrounds and
  confirm it actually builds and runs — this has only been syntax-checked
  via a scratch `swift build` on this machine (see `README.md`), never
  opened in the real Playgrounds/Xcode UI.
- Re-check the exact 2027 rules once Apple publishes them — the write-up
  format and any other details have shifted slightly cycle to cycle in the
  past (e.g. some years used a fixed 3-question reflection form instead of
  free text).
- Pick a final bundle identifier and display name before zipping the
  submission.
