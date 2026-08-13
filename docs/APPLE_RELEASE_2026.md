# Apple competition and iPhone release assessment

**Assessment date:** August 12, 2026
**Project:** RICH / Rich记账 (Expo app plus a separate SwiftUI App Playground)

## Executive assessment

The project now has two credible but different paths:

- The **Expo app** is technically ready for an iPhone beta after a real-device walkthrough. Its strongest product angle is a private, local-only student budget in which parent categories set boundaries and subcategories show real tradeoffs.
- The **SwiftUI playground** is the only artifact eligible for the Swift Student Challenge. It now tells a focused, English-only, offline three-minute story and passes command-line Swift parsing/type-checking. It still must be opened and run in Swift Playground 4.6+ or Xcode 26+ on iPhone and iPad.

This is not yet a responsible App Store submission. It still needs device screenshots, accessibility/device QA, a hosted privacy policy and support page, final App Store metadata, and confirmation that the RICH name and any reference-derived design are owned or licensed. Apple's [copycat rule](https://developer.apple.com/app-store/review/guidelines/#copycats) prohibits passing off minor changes to another app's name or UI. If the archived “original RICH” screenshots are not the developer's own work, rename and independently redesign the remaining reference-matched screens before either competition or store submission.

## Swift Student Challenge

The 2026 challenge closed on **February 28, 2026 at 11:59 p.m. PST**, and Apple has published the results. No 2027 dates were announced on Apple's challenge page when this assessment was written. The 2026 cohort had 350 winners from 37 countries and regions, including 50 Distinguished Winners. See Apple's [challenge page](https://developer.apple.com/swift-student-challenge/), [2026 terms](https://developer.apple.com/swift-student-challenge/policy/), and [2026 winner story](https://www.apple.com/newsroom/2026/05/ai-meets-accessibility-in-this-years-swift-student-challenge/).

The 2026 requirements included:

- an individually created `.swiftpm` App Playground ZIP no larger than 25 MB;
- an experience that works offline with every required resource included locally;
- English-only content, no required sign-in, and no judge-tracking analytics;
- Swift Playground 4.6 or Xcode 26 or later;
- eligible student/recent-graduate status, free Apple Developer registration or paid membership, and no full-time developer employment; and
- full disclosure of AI assistance, significant individual contribution and technical understanding, plus essays written personally by the applicant.

The current playground is well positioned around **privacy, student agency, and progressive budgeting**, not merely “another expense tracker.” Its readiness is approximately:

| Area | Status |
| --- | --- |
| Focused three-minute story | Strong: Welcome → Ledger → `Food › Coffee` entry → live child-budget allocation |
| Technical accomplishment | Good for the scope: connected state, custom amount flow, hierarchical allocation, adaptive SwiftUI, VoiceOver semantics |
| Creativity/social impact | Promising, but the applicant's genuine personal/community reason must carry the written response |
| Offline/English/size | Passes static checks; source is small and has no network dependency |
| Authorship and AI disclosure | High-risk unless the student reviews, understands, substantially owns, and fully discloses the Codex-assisted revision |
| Required Apple runtime test | Not done here because this Mac has Command Line Tools rather than full Xcode/Swift Playground |

Before a future submission, follow [the playground checklist and disclosure draft](../swift-student-challenge/SUBMISSION.md), then re-read the new year's rules rather than assuming 2026 details carry forward.

## Apple Design Awards, App Store Awards, and featuring

The 2026 Apple Design Awards have already announced winners and finalists across Delight and Fun, Inclusivity, Innovation, Interaction, Social Impact, and Visuals and Graphics. Apple does not present these like an open student submission form; they recognize outstanding released products. See the current [Apple Design Awards](https://developer.apple.com/design/awards/).

The practical route is:

1. Release a stable, original app with excellent accessibility and privacy.
2. Collect real evidence that the parent/subcategory model helps students make decisions.
3. Ship a meaningful update—ideally widgets/Shortcuts, fast search, recurring entries, or a strong student/roommate setup—without burying the core flow.
4. Use **Featuring Nominations** in App Store Connect for a launch or major update. Apple asks for at least two weeks' notice and recommends up to three months for wider consideration. See [Getting Featured](https://developer.apple.com/app-store/getting-featured/).

An award is a long-term outcome, not the next release milestone. The next milestone should be a polished TestFlight beta with 10–20 students and measurable completion/retention feedback.

## Getting it onto an iPhone

### Option 1 — Expo Go: fastest, $0

The project uses Expo SDK 54, and the current iPhone App Store version of Expo Go supports SDK 54. Expo describes Expo Go as a learning/test environment rather than the production path. See the current [development-build FAQ](https://docs.expo.dev/develop/development-builds/faq/) and [device instructions](https://docs.expo.dev/get-started/start-developing/).

```bash
cd /Users/anwen/Desktop/RICH
npm install
npx expo start
```

Install Expo Go from the iPhone App Store, keep the Mac and iPhone on the same Wi-Fi, and scan the terminal QR code with the iPhone camera. This is the quickest way to perform the missing visual walkthrough, but it is not a standalone downloadable RICH app.

### Option 2 — Personal standalone build: $0, weekly reinstall

Install full Xcode 26, sign in with an Apple Account, connect the iPhone, trust the Mac, enable Developer Mode, then run a local device build:

```bash
cd /Users/anwen/Desktop/RICH
npx expo run:ios --device
```

A free Xcode Personal Team can install an app on a personal device, but its App IDs, registered devices, and provisioning profiles expire after seven days; the app then needs rebuilding/reinstalling. Apple documents limits of 10 App IDs, three devices per platform, and three installed apps per device for this path. See [Developer account overview](https://developer.apple.com/help/account/basics/about-your-developer-account#enable-a-personal-team-in-xcode).

### Option 3 — TestFlight and public App Store: $99/year

Join the Apple Developer Program, currently **US$99 per membership year or local equivalent**. Student status alone does not provide a discount. A qualifying nonprofit, accredited educational institution, or government legal entity may request a waiver, but individuals and sole proprietors cannot. See Apple's [membership comparison](https://developer.apple.com/support/compare-memberships/), [student enrollment answer](https://developer.apple.com/help/account/membership/program-enrollment/), and [fee-waiver rules](https://developer.apple.com/help/account/membership/fee-waivers/).

The simplest managed workflow is already scaffolded in `eas.json`:

```bash
cd /Users/anwen/Desktop/RICH
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --profile production
```

`build:configure` connects the local project to an Expo/EAS project and writes
the generated project ID into the app configuration. The repository intentionally
does not contain someone else's Expo project ID or credentials.

The Expo Free plan is currently $0/month and includes up to 15 iOS and 15 Android builds in a low-priority queue plus store submission; the optional Starter plan is $19/month plus additional usage. See [Expo pricing](https://expo.dev/pricing). Apple TestFlight supports up to 100 internal testers and 10,000 external testers; a build is testable for up to 90 days. See [TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).

| Goal | Minimum recurring cost | Tradeoff |
| --- | ---: | --- |
| See it on this iPhone with Expo Go | $0 | Mac dev server must be running; not a standalone app |
| Install a standalone personal build | $0 | Full Xcode required; reinstall about every seven days |
| Share through TestFlight | $99/year | Paid Apple membership; beta builds expire after 90 days |
| Publish publicly, free app | $99/year | App Review, metadata, privacy/support pages and ongoing maintenance |
| Expo cloud builds | $0 can be sufficient | Free queue/build quota; paid Expo is optional |

An individual enrollment displays the person's legal name as the App Store seller. An organization enrollment displays its legal entity name and normally requires a D-U-N-S number. Apple now requires App Store Connect uploads to be built with Xcode 26 or later and the iOS 26 SDK or later. See [enrollment](https://developer.apple.com/programs/enroll/) and [current upload requirements](https://developer.apple.com/news/upcoming-requirements/).

## App Store readiness checklist

The current local-only architecture is a review advantage: manual finance records processed only on-device are not considered “collected” for Apple's privacy label. If any future analytics, AI API, bank connection, crash reporter, or sync SDK transmits data, the answers must change. Apple classifies salary, income, assets, debts, and similar information as **Other Financial Info**, requires disclosure of third-party SDK practices, and requires a public privacy-policy URL. See [App privacy details](https://developer.apple.com/app-store/app-privacy-details/).

Before upload:

- complete a real-iPhone walkthrough of every route, including small and large iPhones, larger text, VoiceOver, dark keyboard appearance, interrupted saves, import/restore, and empty/large datasets;
- host the current privacy policy and a support/contact page at stable public HTTPS URLs;
- capture honest App Store screenshots with fictional data;
- verify the final unique name, subtitle, bundle ID, icon ownership, copyright, and support contact;
- keep v1 manual/local-only—no bank credentials, investment advice, ads, or opaque AI categorization;
- provide review notes explaining local storage, export/restore, balance adjustments, and paired transfers;
- decide storefronts deliberately. Apple says some apps offered in mainland China require a matching MIIT ICP filing number and metadata; confirm applicability before selecting that storefront. See [China mainland availability fields](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/#availability-in-china-mainland); and
- use TestFlight feedback before public submission, then nominate the launch only after stability and originality are demonstrated.

## Recommended product sequence

1. **Now:** install with Expo Go and perform the visual/accessibility walkthrough on the target iPhone.
2. **Next beta:** resolve every device finding; add search and recurring entries before adding cloud complexity.
3. **TestFlight:** enroll, produce a production EAS build, and test with a small student cohort.
4. **Public v1:** free, local-only, no ads, no account, with clear export/restore and a unique brand.
5. **Award-quality updates:** native widgets/Shortcuts, optional biometric lock, split transactions, rollover, and student/roommate templates—only after the core hierarchy proves useful.
