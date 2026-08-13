import SwiftUI

private enum FoodBudgetChild: String, CaseIterable, Identifiable {
    case campusMeals = "Campus meals"
    case groceries = "Groceries"
    case coffee = "Coffee"

    var id: String { rawValue }

    var systemImage: String {
        switch self {
        case .campusMeals: return "fork.knife"
        case .groceries: return "basket.fill"
        case .coffee: return "cup.and.saucer.fill"
        }
    }
}

private enum AllocationPreset: String, CaseIterable, Identifiable {
    case balanced = "Balanced"
    case campusFirst = "Campus first"
    case cookMore = "Cook more"

    var id: String { rawValue }
}

/// The third chapter: a parent budget becomes a set of child decisions.
/// Judges can alter the allocation and see the unallocated remainder change.
struct BudgetPreviewView: View {
    let transactions: [StudentTransaction]

    private let allowance = StudentStory.monthlyAllowance
    private let foodLimit = 220.0

    @State private var selectedPreset: AllocationPreset = .balanced
    @State private var childLimits: [FoodBudgetChild: Double] = [
        .campusMeals: 110,
        .groceries: 80,
        .coffee: 20,
    ]

    private var totalSpent: Double {
        transactions.filter { !$0.isIncome }.reduce(0) { $0 + $1.amount }
    }

    private var foodSpent: Double {
        transactions.filter { !$0.isIncome && $0.category == "Food" }.reduce(0) { $0 + $1.amount }
    }

    private var allocated: Double {
        FoodBudgetChild.allCases.reduce(0) { $0 + (childLimits[$1] ?? 0) }
    }

    private var unallocated: Double {
        foodLimit - allocated
    }

    private var remainingAllowance: Double {
        allowance - totalSpent
    }

    var body: some View {
        VStack(spacing: 0) {
            header

            ScrollView {
                VStack(alignment: .leading, spacing: RICHSpacing.lg) {
                    monthSummary
                    hierarchyCard
                    allocationEditor
                    reflectionCard
                }
                .frame(maxWidth: 720)
                .padding(RICHSpacing.lg)
                .frame(maxWidth: .infinity)
            }
            .background(RICHColor.page)
        }
        .background(RICHColor.primaryGreen.ignoresSafeArea(edges: .top))
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: RICHSpacing.xs) {
                Text("Progressive budgeting")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(RICHColor.textPrimary)
                    .accessibilityAddTraits(.isHeader)
                Text("July • parent to subcategory")
                    .font(.caption)
                    .foregroundStyle(RICHColor.textPrimary)
            }

            Spacer()

            Image(systemName: "chart.donut.fill")
                .font(.title2)
                .foregroundStyle(RICHColor.textPrimary)
                .accessibilityHidden(true)
        }
        .padding(.horizontal, RICHSpacing.xl)
        .padding(.vertical, RICHSpacing.md)
        .background(RICHColor.primaryGreen)
    }

    private var monthSummary: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 0) {
                summaryMetric(
                    title: "Allowance",
                    value: money(allowance),
                    detail: "Set at the parent level"
                )
                Divider()
                summaryMetric(
                    title: "Spent",
                    value: money(totalSpent),
                    detail: "From the local ledger"
                )
                Divider()
                summaryMetric(
                    title: "Available",
                    value: money(remainingAllowance),
                    detail: "Still flexible"
                )
            }

            VStack(spacing: 0) {
                summaryMetric(title: "Allowance", value: money(allowance), detail: "Set at the parent level")
                Divider()
                summaryMetric(title: "Spent", value: money(totalSpent), detail: "From the local ledger")
                Divider()
                summaryMetric(title: "Available", value: money(remainingAllowance), detail: "Still flexible")
            }
        }
        .background(RICHColor.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: RICHRadius.card))
    }

    private func summaryMetric(title: String, value: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: RICHSpacing.xs) {
            Text(title)
                .font(.caption)
                .foregroundStyle(RICHColor.textSecondary)
            Text(value)
                .font(.title3.weight(.bold).monospacedDigit())
                .foregroundStyle(RICHColor.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            Text(detail)
                .font(.caption2)
                .foregroundStyle(RICHColor.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(RICHSpacing.lg)
        .accessibilityElement(children: .combine)
    }

    private var hierarchyCard: some View {
        VStack(alignment: .leading, spacing: RICHSpacing.lg) {
            VStack(alignment: .leading, spacing: RICHSpacing.xs) {
                Text("One parent, three clearer choices")
                    .font(.headline)
                    .foregroundStyle(RICHColor.textPrimary)
                    .accessibilityAddTraits(.isHeader)
                Text("The parent cap protects the month. Child allocations make everyday tradeoffs visible.")
                    .font(.subheadline)
                    .foregroundStyle(RICHColor.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            parentBudgetRow

            VStack(spacing: RICHSpacing.sm) {
                ForEach(FoodBudgetChild.allCases) { child in
                    childBudgetRow(child)
                }
            }
            .padding(.leading, RICHSpacing.xl)

            allocationRemainder
        }
        .padding(RICHSpacing.lg)
        .background(RICHColor.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: RICHRadius.card))
    }

    private var parentBudgetRow: some View {
        VStack(spacing: RICHSpacing.sm) {
            HStack(spacing: RICHSpacing.md) {
                Image(systemName: "fork.knife")
                    .frame(width: 40, height: 40)
                    .background(Circle().fill(RICHColor.entryGreen))
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: RICHSpacing.xs) {
                    Text("Food")
                        .font(.headline)
                        .foregroundStyle(RICHColor.textPrimary)
                    Text("Parent budget")
                        .font(.caption)
                        .foregroundStyle(RICHColor.textSecondary)
                }
                Spacer()
                Text("\(money(foodSpent)) / \(money(foodLimit))")
                    .font(.subheadline.weight(.semibold).monospacedDigit())
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }

            progressBar(value: foodSpent, total: foodLimit, color: RICHColor.primaryGreenDark)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Food parent budget. \(money(foodSpent)) spent of \(money(foodLimit)).")
    }

    private func childBudgetRow(_ child: FoodBudgetChild) -> some View {
        let limit = childLimits[child] ?? 0
        let spent = spent(for: child)

        return VStack(spacing: RICHSpacing.sm) {
            HStack(spacing: RICHSpacing.md) {
                Image(systemName: child.systemImage)
                    .foregroundStyle(RICHColor.textSecondary)
                    .frame(width: 34, height: 34)
                    .background(Circle().fill(RICHColor.page))
                    .accessibilityHidden(true)
                Text(child.rawValue)
                    .font(.subheadline)
                    .foregroundStyle(RICHColor.textPrimary)
                Spacer()
                Text("\(money(spent)) / \(money(limit))")
                    .font(.caption.weight(.semibold).monospacedDigit())
                    .foregroundStyle(RICHColor.textSecondary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            progressBar(value: spent, total: max(limit, 1), color: RICHColor.textPrimary)
        }
        .padding(.vertical, RICHSpacing.xs)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(child.rawValue) child budget. \(money(spent)) spent of \(money(limit)).")
    }

    private var allocationRemainder: some View {
        VStack(spacing: RICHSpacing.sm) {
            allocationBar

            HStack(alignment: .firstTextBaseline) {
                Text("Allocated \(money(allocated))")
                    .font(.caption.weight(.semibold).monospacedDigit())
                    .foregroundStyle(RICHColor.textPrimary)
                Spacer()
                Text(
                    unallocated >= 0
                        ? "Unallocated \(money(unallocated))"
                        : "Over-allocated \(money(abs(unallocated)))"
                )
                .font(.caption.weight(.semibold).monospacedDigit())
                .foregroundStyle(unallocated >= 0 ? RICHColor.primaryGreenDark : RICHColor.expenseRed)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(
            unallocated >= 0
                ? "\(money(allocated)) allocated. \(money(unallocated)) unallocated."
                : "Budget is over-allocated by \(money(abs(unallocated)))."
        )
    }

    private var allocationBar: some View {
        GeometryReader { proxy in
            HStack(spacing: 2) {
                ForEach(FoodBudgetChild.allCases) { child in
                    let width = max(0, min(foodLimit, childLimits[child] ?? 0)) / foodLimit
                    Rectangle()
                        .fill(color(for: child))
                        .frame(width: max(0, proxy.size.width * width - 2))
                }

                if unallocated > 0 {
                    Rectangle()
                        .fill(RICHColor.border)
                        .frame(maxWidth: .infinity)
                }
            }
            .clipShape(Capsule())
        }
        .frame(height: 10)
        .background(Capsule().fill(unallocated < 0 ? RICHColor.expenseRed.opacity(0.25) : RICHColor.border))
    }

    private var allocationEditor: some View {
        VStack(alignment: .leading, spacing: RICHSpacing.lg) {
            VStack(alignment: .leading, spacing: RICHSpacing.xs) {
                Text("Try a different student month")
                    .font(.headline)
                    .foregroundStyle(RICHColor.textPrimary)
                    .accessibilityAddTraits(.isHeader)
                Text("Each preset keeps the $220 Food parent cap but changes its child priorities.")
                    .font(.subheadline)
                    .foregroundStyle(RICHColor.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Picker("Allocation approach", selection: $selectedPreset) {
                ForEach(AllocationPreset.allCases) { preset in
                    Text(preset.rawValue).tag(preset)
                }
            }
            .pickerStyle(.segmented)
            .onChange(of: selectedPreset) { _, newValue in
                apply(newValue)
            }

            VStack(spacing: RICHSpacing.md) {
                ForEach(FoodBudgetChild.allCases) { child in
                    let value = childLimits[child] ?? 0
                    HStack(spacing: RICHSpacing.md) {
                        Text(child.rawValue)
                            .font(.subheadline)
                            .foregroundStyle(RICHColor.textPrimary)
                            .frame(maxWidth: .infinity, alignment: .leading)

                        Button {
                            adjust(child, by: -10)
                        } label: {
                            Image(systemName: "minus")
                                .frame(width: RICHSize.minimumTouchTarget, height: RICHSize.minimumTouchTarget)
                        }
                        .buttonStyle(.bordered)
                        .disabled(value <= 0)
                        .accessibilityLabel("Decrease \(child.rawValue) allocation by 10 dollars")

                        Text(money(value))
                            .font(.subheadline.weight(.semibold).monospacedDigit())
                            .frame(minWidth: 70, alignment: .trailing)
                            .accessibilityLabel("\(child.rawValue) allocation \(money(value))")

                        Button {
                            adjust(child, by: 10)
                        } label: {
                            Image(systemName: "plus")
                                .frame(width: RICHSize.minimumTouchTarget, height: RICHSize.minimumTouchTarget)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(RICHColor.textPrimary)
                        .disabled(unallocated < 10)
                        .accessibilityLabel("Increase \(child.rawValue) allocation by 10 dollars")
                    }
                }
            }
        }
        .padding(RICHSpacing.lg)
        .background(RICHColor.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: RICHRadius.card))
    }

    private var reflectionCard: some View {
        VStack(alignment: .leading, spacing: RICHSpacing.md) {
            Label("The point is not perfection", systemImage: "lightbulb.fill")
                .font(.headline)
                .foregroundStyle(RICHColor.textPrimary)
                .accessibilityAddTraits(.isHeader)
            Text("A parent budget answers “How much can I spend on Food?” Child budgets answer “What matters this month?” The unallocated remainder preserves room for real life.")
                .font(.body)
                .foregroundStyle(RICHColor.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(RICHSpacing.lg)
        .background(RICHColor.entryGreen.opacity(0.55))
        .clipShape(RoundedRectangle(cornerRadius: RICHRadius.card))
    }

    private func progressBar(value: Double, total: Double, color: Color) -> some View {
        let ratio = total > 0 ? max(0, min(1, value / total)) : 0

        return GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule().fill(RICHColor.border)
                Capsule()
                    .fill(color)
                    .frame(width: proxy.size.width * ratio)
            }
        }
        .frame(height: 7)
        .accessibilityHidden(true)
    }

    private func spent(for child: FoodBudgetChild) -> Double {
        transactions
            .filter { !$0.isIncome && $0.subcategory == child.rawValue }
            .reduce(0) { $0 + $1.amount }
    }

    private func color(for child: FoodBudgetChild) -> Color {
        switch child {
        case .campusMeals: return RICHColor.primaryGreenDark
        case .groceries: return Color(hex: 0x5A8FCC)
        case .coffee: return RICHColor.warning
        }
    }

    private func adjust(_ child: FoodBudgetChild, by delta: Double) {
        let current = childLimits[child] ?? 0
        let proposed = max(0, current + delta)
        let proposedAllocated = allocated - current + proposed
        guard proposedAllocated <= foodLimit else { return }

        withAnimation(.easeInOut(duration: 0.2)) {
            childLimits[child] = proposed
        }
    }

    private func apply(_ preset: AllocationPreset) {
        withAnimation(.easeInOut(duration: 0.25)) {
            switch preset {
            case .balanced:
                childLimits = [.campusMeals: 110, .groceries: 80, .coffee: 20]
            case .campusFirst:
                childLimits = [.campusMeals: 150, .groceries: 50, .coffee: 10]
            case .cookMore:
                childLimits = [.campusMeals: 60, .groceries: 130, .coffee: 10]
            }
        }
    }

    private func money(_ amount: Double) -> String {
        String(format: "$%.2f", amount)
    }
}

#if DEBUG
    #Preview {
        BudgetPreviewView(transactions: StudentStory.sampleTransactions)
    }
#endif
