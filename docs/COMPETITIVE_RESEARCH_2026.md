# Chinese iPhone Bookkeeping App Research

**Research date:** August 12, 2026
**Scope:** Current China-region App Store listings where available, plus official product documentation. Ratings, rankings, prices, feature gates, and availability can change by storefront or promotion.

## Competitive snapshot

| App | Product model | Particularly useful ideas | Privacy and visible pricing at time of review |
| --- | --- | --- | --- |
| [钱迹](https://apps.apple.com/cn/app/id1473785373) | Clean personal/family bookkeeping with first- and second-level categories, monthly/yearly total and category budgets, multiple/shared books, assets and liabilities. | Instant-open entry, AI/Shortcuts capture, recurring entries, daily remaining budget, WeChat/Alipay import, Excel/image export. See its [official guide](https://docs.qianjiapp.com/) and [budget rules](https://docs.qianjiapp.com/vip/vip_budget.html). | No ads; App Store label lists only unlinked crash diagnostics. ¥6/month, ¥36/year, ¥128 lifetime. |
| [鲨鱼记账](https://apps.apple.com/cn/app/id1079718756) | Mass-market, speed-led tracker whose core promise is a three-second entry flow. | Minimal amount/category entry, smart note suggestions, reminders, quick-entry widget and simple consumption trends. | Contains ads and reports identifier-based tracking. ¥15/month and ¥38/quarter; yearly price differed between its description and IAP list (¥148 versus ¥119), so verify in-app. |
| [随手记](https://apps.apple.com/cn/app/id372353614) | Broad personal, family and small-business system built around scenario templates and shared books. | Student, class-fund, roommate, couple and travel templates; role permissions; operation history; deleted-entry recovery; image/receipt batch recognition; Apple Watch. | Contains ads and reports identifier-based tracking plus several unlinked data types. Multiple memberships and virtual-currency products make pricing harder to understand; visible plans included ¥15/month and plans up to ¥273/year. |
| [挖财记账](https://apps.apple.com/cn/app/id1544045905) | Feature-rich bookkeeping and asset/liability manager. Supports expense, income and surplus targets over daily through yearly periods, with child budgets by category, member, tag or merchant. | Back-tap/Shortcuts capture, templates, 29 report types, four calendar views, repayment planning, credit-card controls and configurable home modules. | Contains ads and reports tracking/linked data. Visible standard/super tiers ranged roughly from ¥6–25/month, ¥48–98/year, with a ¥68 basic lifetime option; promotions vary. |
| [一木记账](https://apps.apple.com/cn/app/id1572969723) | Efficient no-ad tracker centered on text, voice and screenshot entry, with assets, credit installments, debt, reimbursement and custom-period reporting. | One-sentence entry, hold-to-talk capture, screenshot/Excel import, WebDAV/cloud backup, Sankey cash-flow views, repayment reminders and budget widgets. See the [official product site](https://www.yimuapp.com/). | No ads or investment promotion. App Store label lists linked contact information and unlinked location/diagnostics. ¥9.90/month, ¥52/year, ¥116 lifetime. |
| [薄荷记账](https://apps.apple.com/cn/app/id1613127475) | Lightweight shared/investment bookkeeping with flexible budget periods and rollover. | Best progressive category picker found: second-level categories stay hidden until a parent is selected; users can reorder the panel and choose its height. Screenshot import supports multiple transactions and duplicate warnings. | App Store label lists only unlinked email, device identifier and diagnostics. ¥12/month, ¥48/year, ¥128 for 60 months (not lifetime). |
| [MOZE](https://apps.apple.com/tw/app/moze/id1460011387) | Apple-focused personal finance app with project → main category → subcategory budgets, detailed accounts/credit cards, reports, widgets and Watch support. | Strongest hierarchy: child allocations can be fixed amounts or percentages of a parent, unused budget can roll over, and contextual “entry modes” preselect relevant accounts/categories. It also supports [split transactions](https://doc.moze.app/spilt-categories). See [product](https://moze.app/en/) and [budget documentation](https://doc.moze.app/prepare/project/budget). | Taiwan label lists only unlinked support content/diagnostics. NT$60/month or NT$600/year; global site showed US$1.99/month Pro and US$3.99/month Pro+AI. MOZE says its ChatGPT-based AI is unavailable in the mainland-China storefront build. |
| [Dime](https://apps.apple.com/cn/app/id1635280255) | A restrained, native-feeling expense tracker with category budgets, recurring/future transactions and iCloud sync. English only. | Excellent Apple-platform polish: quick actions, Siri, home/lock-screen widgets, Dynamic Type, biometric lock and payday-aligned custom periods. | App Store label says no data is collected. Free with optional ¥22/38/58 tips. Its latest listed release was November 2023, so use it as a design reference rather than evidence of active maintenance. |

Additional useful reference: [iCost](https://apps.apple.com/cn/app/id1484262528) offers explicit first/second-level categories, report drill-down, import from 30+ bookkeeping products, iCloud-centered storage, and low-friction ¥30/year or ¥60 lifetime pricing.

## Patterns worth adapting

### Progressive subcategories

1. Put the amount first, followed by a short, familiar row of parent categories.
2. Reveal only the selected parent's children in a compact grid; keep the full hierarchy out of the default entry screen.
3. Rank children by recent/frequent use, while retaining manual reordering and search for larger lists.
4. Always provide a safe fallback such as “Other within Food” so categorization never blocks saving.
5. Ship useful student defaults—such as Food → campus dining/groceries/cafés, Education → tuition/books/software, and Transport → transit/ride-hailing/parking—but allow complete customization.
6. Let users correct an AI-suggested category in one tap, and learn only from confirmed corrections.

### Hierarchical budgets

- Show one parent progress row (`spent / budget / remaining`) with a disclosure control for children.
- Support either fixed child amounts or percentages of the parent, inspired by MOZE's allocation model.
- Show the parent's unallocated remainder instead of silently distributing it.
- Make rollover an explicit per-budget setting and clearly separate “available this period” from the recurring baseline.
- Drill from a parent chart segment into child detail with a visible breadcrumb back.
- Support a split transaction so one supermarket receipt can affect groceries, household supplies and pharmacy budgets without creating duplicate payments.
- Calculate parent totals from leaf transactions; do not independently store both parent and child spending totals.

### Other strong patterns

- Adopt 钱迹's no-ads/no-investment-upsell clarity and free export philosophy.
- Borrow the principle—not the screen—of Dime's native typography, restraint, widgets, accessibility and biometric protection.
- Add 薄荷's duplicate-import warning and never delete a source screenshot until its entries save successfully.
- Offer 一木's natural-language quick capture, but always show the parsed result before committing uncertain fields.
- Use 随手记's student/roommate templates, collaboration roles, audit history and recoverable deletion only when those advanced needs arise.
- Keep reports progressively disclosed. “Many reports” should not mean a crowded primary navigation.

## Implementation risks to test

Competitor release notes show that nested budgets are a recurring correctness risk. 钱迹 fixed incorrect hierarchy display when only a second-level budget existed, while iCost fixed excluded child spending leaking into its parent and several rollover calculations. Test at minimum:

- child-only and parent-plus-child budgets;
- unallocated parent amounts and budget rollover;
- excluded, archived, moved and deleted child categories;
- transfers, refunds, reimbursements and split bills;
- recurring entries, imports and duplicate detection;
- mixed currencies and rounding;
- reports/widgets after edits or cross-device sync.

Primary references: [钱迹 iOS changelog](https://docs.qianjiapp.com/change-log/change_log_ios.html) and [iCost iOS changelog](https://help.icostapp.com/guide/other/update.html).

## Ethical and legal boundary

Adapt interaction principles and solve the same user problems independently. Do **not** copy another product's code, screen layout, visual assets, icons, illustrations, animations, wording, App Store screenshots or branding. Dime's [source repository](https://github.com/rafsoh/dimeApp) is GPL-3.0; copying its implementation can create GPL distribution obligations. Prefer an original implementation unless the project intentionally adopts and complies with that license.

Apple privacy labels are developer-reported and not independently verified by Apple. Re-check the user's target storefront and the live in-app purchase sheet before using any price, privacy claim or feature availability in product or marketing decisions.
