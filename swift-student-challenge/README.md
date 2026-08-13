# RICH Playground — Swift Student Challenge companion

`RICHPlayground.swiftpm` is a self-contained SwiftUI App Playground for the
Swift Student Challenge. It is intentionally separate from the larger
React Native RICH app: the submission artifact is native Swift, runs without
a network connection, and can be understood in under three minutes.

## The story

Maya is a student with a $600 monthly allowance. She wants enough structure
to make good choices, but she does not want a finance account, ads, analytics,
or uploads of sensitive spending data.

The playground connects three moments:

1. **See the month.** The English-only welcome screen opens Maya's July ledger.
   Tapping a calendar date reveals sample transactions and their full
   parent-to-subcategory paths, such as `Food › Campus meals`.
2. **Record one choice.** The center add button opens an amount-first expense
   sheet. A judge can use a prepared amount, choose `Food`, `Transit`, or
   `Study`, then choose one of that parent's children and add the entry. The
   custom keypad also supports decimal entry and chained addition/subtraction.
3. **Give every dollar a job.** The Budget tab shows a $220 `Food` parent cap
   divided among `Campus meals`, `Groceries`, and `Coffee`. Allocation presets
   and $10 decrease/increase controls update the child amounts and unallocated
   remainder immediately. A quick-added matching expense also contributes to
   the relevant child progress.

This hierarchy is the signature interaction: the parent answers “How much can
I spend on Food?”, while its children answer “What matters this month?” The
unallocated remainder deliberately leaves room for student life to change.

## Suggested three-minute walkthrough

- **0:00–0:25:** Read the privacy premise and three steps, then tap
  **Start the 3-minute story**.
- **0:25–1:00:** In **Ledger**, choose July 14 and July 15. Notice that every
  transaction identifies both its parent and child category.
- **1:00–1:45:** Tap the center **Add** button. Keep the prepared `$8.75`,
  choose `Food › Coffee`, and tap **Add**. The entry returns to July 15.
- **1:45–2:45:** Open **Budget**. Try `Campus first` and `Cook more`, then use
  a $10 plus or minus control. Watch the parent allocation strip and
  unallocated remainder respond.
- **2:45–3:00:** Read the final reflection: progressive budgeting adds useful
  specificity without pretending every month can be predicted perfectly.

## Package contents

- `StudentStory.swift` — small in-memory student transaction model and sample
  story data.
- `WelcomeView.swift` — privacy premise and visible three-step path.
- `HomeLedgerView.swift` — tappable English calendar, monthly totals, and
  parent/subcategory ledger rows.
- `QuickAddView.swift` — interactive amount, parent category, subcategory,
  arithmetic keypad, and confirm flow.
- `BudgetPreviewView.swift` — live parent/child budget allocation, progress,
  presets, and unallocated remainder.
- `RootView.swift` — shared in-memory state, two tabs, and center add action.
- `DesignTokens.swift` — RICH's mint, near-black, compact spacing, and
  square-card visual language, with darker semantic text colors for contrast.

Everything uses SwiftUI, SF Symbols, and shapes bundled with the package.
There are no remote assets, accounts, analytics SDKs, API calls, or network
permissions. Changes last only for the current playground session.

## Accessibility and layout

- Visible text is English, as required by the 2026 rules.
- Interactive calendar dates, category choices, allocation controls, tabs,
  and keypad actions have explicit VoiceOver labels, values, and hints where
  their visual meaning is not enough.
- Selected tabs/categories expose the selected accessibility trait.
- Primary controls meet or exceed a 44-point touch target.
- Text uses semantic SwiftUI styles, numeric values use monospaced digits,
  adaptive grids replace fixed column widths, and `ViewThatFits` provides
  compact alternatives for summary layouts.
- Every primary screen scrolls so larger Dynamic Type sizes can reach all
  content. A final device pass with Accessibility sizes is still required.

## Verification performed here

The available machine has the Apple command-line tools, not full Xcode or
Swift Playground. The following checks pass:

```text
swiftc -parse Sources/RICHPlayground/*.swift
swiftc -typecheck -parse-as-library \
  -module-cache-path /tmp/rich-swift-module-cache \
  Sources/RICHPlayground/*.swift
```

The type-check uses a writable module cache and excludes `#Preview` expansion
outside `DEBUG`; the actual previews remain available in Xcode/Swift
Playground. `Package.swift` imports `AppleProductTypes`, which belongs to the
App Playground environment and cannot be validated by plain SwiftPM here.

Before submission, open `RICHPlayground.swiftpm` in Swift Playground 4.6+ or
Xcode 26+, run it on both iPhone and iPad, test portrait and landscape, test
VoiceOver and larger Dynamic Type sizes, and complete the full path offline.

## 2026 rule and AI disclosure note

Apple's 2026 terms require an English, offline App Playground ZIP of no more
than 25 MB that runs in Swift Playground 4.6 or Xcode 26 or later. AI tools may
assist with specific tasks only when **all use is fully disclosed**; the
applicant must still demonstrate significant individual contribution and
technical understanding, and must personally write every required submission
essay.

This repository was revised with OpenAI Codex assistance. If any of this work
is submitted, do not describe it as created without AI. Review, understand,
test, and substantially own every line, then adapt the truthful disclosure
draft in `SUBMISSION.md` to match the complete history of tools actually used.

Official sources:

- <https://developer.apple.com/swift-student-challenge/eligibility/>
- <https://developer.apple.com/swift-student-challenge/policy/>
