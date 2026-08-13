# RICH Playground — 2026 submission preparation

This file is a preparation checklist and writing aid, not a guarantee of
eligibility. Re-read Apple's live terms before any future submission because
the 2026 cycle closed on February 28, 2026 and later rules may change.

Official sources:

- <https://developer.apple.com/swift-student-challenge/eligibility/>
- <https://developer.apple.com/swift-student-challenge/policy/>

## What Apple required in 2026

- Register for free as an Apple developer or belong to the paid Developer
  Program. A paid membership was not required for this challenge.
- Meet the age rule for the applicant's country or region and satisfy one of
  Apple's listed student/recent-graduate eligibility routes. Apple publishes
  country-specific minimum ages; do not assume one global minimum.
- Not be employed full time as a developer.
- Submit current proof of enrollment as PDF, PNG, or JPEG showing the
  applicant's name, school/organization, and valid dates, plus dean or
  principal contact information.
- Upload one individually created App Playground (`.swiftpm`) as a ZIP no
  larger than 25 MB.
- Make it run offline with every required resource included locally. A sign-in
  requirement, judge-tracking analytics, or a broken playground can
  disqualify the submission.
- Build and run it with Swift Playground 4.6 or Xcode 26 or later.
- Make all content English and design the experience for about three minutes.
- Credit and explain any third-party open-source or public-domain material and
  comply with its license.
- Personally write every required submission-form essay.
- Fully disclose every use of AI tools. Apple allowed AI assistance for
  specific tasks, but expected significant individual contribution,
  technical understanding, problem-solving, impact, creativity, UX/design
  judgment, and appropriate tool use.

Applicants below the ordinary minimum age for their region should follow the
guardian-permission process described by Apple; this is different from saying
that every minor automatically needs the same submission-form consent step.

## Artifact readiness

The current standalone package already has:

- a native `.swiftpm` App Playground manifest;
- no network calls, external packages, remote assets, accounts, or analytics;
- English-only visible content;
- an experience intentionally scoped to under three minutes;
- interactive state shared among the ledger, quick-add flow, and budget;
- explicit parent → subcategory semantics;
- accessibility labels/values for visually encoded controls; and
- an in-memory-only demo, so a judge can safely change values.

It still needs a real Swift Playground/Xcode validation pass. Before zipping:

1. Open the package in Swift Playground 4.6+ or Xcode 26+ and fix any
   App Playground manifest or SDK issues.
2. Test the walkthrough on iPhone and iPad, in portrait and landscape.
3. Test VoiceOver focus order, Button Shapes, Reduce Motion, and Dynamic Type
   through Accessibility sizes; confirm every control remains reachable.
4. Launch with networking disabled and complete the full story.
5. Replace the placeholder wallet icon only if a polished local icon is ready;
   do not add a remote dependency merely for submission art.
6. Archive the `.swiftpm` directory, confirm the ZIP is at most 25 MB, then
   open the zipped copy once more in the required Apple tool.
7. Re-read the live rules and make every essay and disclosure truthful for the
   final project history.

## Unnarrated three-minute judge path

1. Tap **Start the 3-minute story**.
2. In **Ledger**, tap July 14 and July 15. Read category paths such as
   `Study › Books` and `Food › Campus meals`.
3. Tap the center **Add** button. Keep `$8.75`, choose `Food`, choose `Coffee`,
   and tap **Add**. Confirm the Coffee expense appears on July 15.
4. Open **Budget**. The same expense contributes to the `Coffee` child while
   `Food` remains the parent cap.
5. Switch among `Balanced`, `Campus first`, and `Cook more`, then press one
   $10 increase/decrease control. Observe both the child amount and
   unallocated remainder change.
6. Read the reflection card to close the story.

## Draft short description

> RICH is a fully offline SwiftUI playground about one student's $600 monthly
> allowance. A calendar ledger records each purchase as both a broad parent
> category and a useful subcategory. The interactive budget then divides one
> Food cap among Campus meals, Groceries, and Coffee while preserving a visible
> unallocated remainder. It turns budgeting from a rigid prediction into a
> small, private conversation about what matters this month.

## Draft longer description

> I started RICH from a student problem: an allowance needs structure, but the
> details can be personal and a budget should not require surrendering them to
> an account or analytics service. The playground follows Maya through three
> connected moments. First, an offline calendar ledger makes the month easy to
> read. Second, an amount-first entry flow records a purchase through a parent
> and child category. Third, a progressive budget turns a $220 Food cap into
> Campus meals, Groceries, and Coffee allocations. The judge can change those
> allocations and watch the unallocated remainder respond immediately. The
> interaction makes the design idea concrete: parent categories provide a
> safety boundary, subcategories reveal tradeoffs, and a remainder leaves room
> for real life. The package uses only SwiftUI, SF Symbols, and in-memory data;
> it has no sign-in, network calls, analytics, or persistence.

Do not submit either draft unchanged if the form asks for a personal essay.
Apple requires those answers to be written by the applicant. Rewrite in your
own voice and make sure every claim matches the final, tested playground.

## Required AI disclosure — truthful draft

Apple's 2026 terms say AI assistance must be fully disclosed. This project has
used OpenAI Codex, so an appropriate disclosure must be included wherever the
submission form asks about AI/tool use. Adapt the following only after checking
the complete project history:

> I used OpenAI Codex as an AI coding assistant during a focused revision of
> the playground. It helped audit the existing SwiftUI prototype, propose and
> draft parts of the English interface, parent-to-subcategory budget
> interaction, accessibility annotations, and project documentation, and it
> assisted with command-line syntax/type checks. I reviewed the resulting
> changes, tested the interactions, corrected issues, and can explain the data
> model, state flow, allocation arithmetic, layout, and accessibility choices.
> [Add every other AI tool and every additional use here; remove or change no
> detail unless that makes the statement more accurate.]

The applicant should keep a simple tool log (tool, dates, tasks, what was
accepted/rejected, and what was personally changed) so “fully disclosed” can
be answered precisely. Disclosure is not a substitute for authorship: before
submission, the applicant should be able to rebuild or explain each important
piece, especially:

- how `StudentTransaction` moves from Quick Add into the ledger and budget;
- how parent and child spending are aggregated;
- why allocation controls cannot exceed the $220 parent cap;
- how the unallocated remainder is computed;
- which layouts adapt through semantic fonts, scrolling, adaptive grids, and
  `ViewThatFits`; and
- what every VoiceOver label/value communicates.

## Final honesty check

- [ ] I am eligible under the live rules and my enrollment proof is current.
- [ ] I personally wrote the required form essays.
- [ ] I fully disclosed Codex and every other AI use.
- [ ] I understand and can explain the final code and design.
- [ ] I credited any third-party material in the final package.
- [ ] The zipped package runs offline in an accepted Apple tool.
- [ ] The complete experience fits within three minutes.
