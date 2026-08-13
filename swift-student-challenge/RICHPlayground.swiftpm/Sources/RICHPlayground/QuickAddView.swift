import SwiftUI

private struct QuickCategory: Identifiable {
    let id: String
    let name: String
    let systemImage: String
    let subcategories: [String]
}

/// The second chapter: record one concrete student purchase through a parent
/// category and a child category. The calculator and all state are local.
struct QuickAddView: View {
    var onConfirm: (StudentTransaction) -> Void

    @Environment(\.dismiss) private var dismiss
    @ScaledMetric(relativeTo: .body) private var keyHeight: CGFloat = 48

    private let categories: [QuickCategory] = [
        QuickCategory(
            id: "food",
            name: "Food",
            systemImage: "fork.knife",
            subcategories: ["Coffee", "Campus meals", "Groceries"]
        ),
        QuickCategory(
            id: "transit",
            name: "Transit",
            systemImage: "bus.fill",
            subcategories: ["Bus", "Train", "Bike repair"]
        ),
        QuickCategory(
            id: "study",
            name: "Study",
            systemImage: "book.closed.fill",
            subcategories: ["Books", "Supplies", "Course fees"]
        ),
    ]

    @State private var selectedCategoryID = "food"
    @State private var selectedSubcategory = "Coffee"
    @State private var displayText = "8.75"
    @State private var replaceOnNextDigit = true
    @State private var pendingValue: Double?
    @State private var pendingOperator: Character?

    private var selectedCategory: QuickCategory {
        categories.first { $0.id == selectedCategoryID } ?? categories[0]
    }

    private var canConfirm: Bool {
        totalAmount() > 0
    }

    var body: some View {
        VStack(spacing: 0) {
            header

            ScrollView {
                VStack(alignment: .leading, spacing: RICHSpacing.xl) {
                    amountSection
                    DashedDivider()
                    categorySection
                    subcategorySection
                    privacyNote
                }
                .padding(RICHSpacing.lg)
            }

            numpad
        }
        .background(RICHColor.cardBackground)
    }

    private var header: some View {
        HStack(spacing: RICHSpacing.md) {
            Button("Cancel") {
                dismiss()
            }
            .font(.body)
            .foregroundStyle(RICHColor.textSecondary)
            .frame(minWidth: RICHSize.minimumTouchTarget, minHeight: RICHSize.minimumTouchTarget)

            Spacer()

            VStack(spacing: RICHSpacing.xs) {
                Text("Add an expense")
                    .font(.headline)
                    .foregroundStyle(RICHColor.textPrimary)
                Text("July 15")
                    .font(.caption)
                    .foregroundStyle(RICHColor.textSecondary)
            }
            .accessibilityElement(children: .combine)

            Spacer()

            Image(systemName: "lock.fill")
                .foregroundStyle(RICHColor.primaryGreenDark)
                .frame(width: RICHSize.minimumTouchTarget, height: RICHSize.minimumTouchTarget)
                .accessibilityLabel("Offline entry")
        }
        .padding(.horizontal, RICHSpacing.lg)
        .padding(.vertical, RICHSpacing.xs)
        .overlay(alignment: .bottom) {
            Rectangle().fill(RICHColor.border).frame(height: 1)
        }
    }

    private var amountSection: some View {
        VStack(alignment: .leading, spacing: RICHSpacing.md) {
            HStack(alignment: .firstTextBaseline, spacing: RICHSpacing.xs) {
                Text("$")
                    .foregroundStyle(RICHColor.primaryGreenDark)
                Text(displayText)
                    .foregroundStyle(RICHColor.textPrimary)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.55)

                if let pendingOperator {
                    Text("\(String(pendingOperator)) next amount")
                        .font(.caption)
                        .foregroundStyle(RICHColor.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer(minLength: 0)
            }
            .font(.largeTitle.weight(.light))
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Expense amount")
            .accessibilityValue("\(displayText) dollars")

            ViewThatFits(in: .horizontal) {
                HStack(spacing: RICHSpacing.sm) {
                    presetButton(4.50)
                    presetButton(8.75)
                    presetButton(12.50)
                    clearButton
                }

                VStack(alignment: .leading, spacing: RICHSpacing.sm) {
                    HStack(spacing: RICHSpacing.sm) {
                        presetButton(4.50)
                        presetButton(8.75)
                        presetButton(12.50)
                    }
                    clearButton
                }
            }

            Text("A demo amount is ready, so the full interaction can be completed quickly.")
                .font(.caption)
                .foregroundStyle(RICHColor.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func presetButton(_ amount: Double) -> some View {
        Button(String(format: "$%.2f", amount)) {
            displayText = String(format: "%.2f", amount)
            pendingValue = nil
            pendingOperator = nil
            replaceOnNextDigit = true
        }
        .font(.caption.weight(.semibold).monospacedDigit())
        .foregroundStyle(RICHColor.textPrimary)
        .padding(.horizontal, RICHSpacing.md)
        .frame(minHeight: RICHSize.minimumTouchTarget)
        .background(RICHColor.page)
        .clipShape(Capsule())
        .accessibilityLabel("Set amount to \(String(format: "%.2f", amount)) dollars")
    }

    private var clearButton: some View {
        Button("Clear") {
            displayText = "0"
            pendingValue = nil
            pendingOperator = nil
            replaceOnNextDigit = true
        }
        .font(.caption.weight(.semibold))
        .foregroundStyle(RICHColor.primaryGreenDark)
        .frame(minWidth: RICHSize.minimumTouchTarget, minHeight: RICHSize.minimumTouchTarget)
    }

    private var categorySection: some View {
        VStack(alignment: .leading, spacing: RICHSpacing.md) {
            sectionHeading(step: "1", title: "Choose a parent category")

            LazyVGrid(
                columns: [GridItem(.adaptive(minimum: 92), spacing: RICHSpacing.md)],
                spacing: RICHSpacing.md
            ) {
                ForEach(categories) { category in
                    let isSelected = category.id == selectedCategoryID
                    Button {
                        selectedCategoryID = category.id
                        selectedSubcategory = category.subcategories[0]
                    } label: {
                        VStack(spacing: RICHSpacing.sm) {
                            Image(systemName: category.systemImage)
                                .font(.title3)
                                .frame(width: 48, height: 48)
                                .background(
                                    Circle().fill(
                                        isSelected
                                            ? RICHColor.primaryGreen.opacity(0.18)
                                            : RICHColor.page
                                    )
                                )
                                .overlay(
                                    Circle().strokeBorder(
                                        isSelected ? RICHColor.primaryGreenDark : .clear,
                                        lineWidth: 2
                                    )
                                )
                            Text(category.name)
                                .font(.subheadline.weight(isSelected ? .semibold : .regular))
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .foregroundStyle(isSelected ? RICHColor.primaryGreenDark : RICHColor.textSecondary)
                        .frame(maxWidth: .infinity, minHeight: 82)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(category.name) parent category")
                    .accessibilityValue(isSelected ? "Selected" : "Not selected")
                    .accessibilityAddTraits(isSelected ? .isSelected : [])
                }
            }
        }
    }

    private var subcategorySection: some View {
        VStack(alignment: .leading, spacing: RICHSpacing.md) {
            sectionHeading(step: "2", title: "Make it specific")

            Text("\(selectedCategory.name) › \(selectedSubcategory)")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(RICHColor.textPrimary)
                .accessibilityLabel("Selected category path: \(selectedCategory.name), \(selectedSubcategory)")

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: RICHSpacing.sm) {
                    ForEach(selectedCategory.subcategories, id: \.self) { subcategory in
                        let isSelected = subcategory == selectedSubcategory
                        Button(subcategory) {
                            selectedSubcategory = subcategory
                        }
                        .font(.subheadline.weight(isSelected ? .semibold : .regular))
                        .foregroundStyle(isSelected ? .white : RICHColor.textPrimary)
                        .padding(.horizontal, RICHSpacing.lg)
                        .frame(minHeight: RICHSize.minimumTouchTarget)
                        .background(isSelected ? RICHColor.textPrimary : RICHColor.page)
                        .clipShape(Capsule())
                        .accessibilityValue(isSelected ? "Selected" : "Not selected")
                        .accessibilityAddTraits(isSelected ? .isSelected : [])
                    }
                }
            }
        }
    }

    private var privacyNote: some View {
        Label(
            "The entry is added only to this in-memory demo.",
            systemImage: "iphone.and.arrow.forward.inward"
        )
        .font(.footnote)
        .foregroundStyle(RICHColor.textSecondary)
        .fixedSize(horizontal: false, vertical: true)
    }

    private func sectionHeading(step: String, title: String) -> some View {
        HStack(spacing: RICHSpacing.sm) {
            Text(step)
                .font(.caption.weight(.bold).monospacedDigit())
                .foregroundStyle(RICHColor.textPrimary)
                .frame(width: 26, height: 26)
                .background(Circle().fill(RICHColor.entryGreen))
                .accessibilityHidden(true)
            Text(title)
                .font(.headline)
                .foregroundStyle(RICHColor.textPrimary)
                .accessibilityAddTraits(.isHeader)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Step \(step). \(title)")
    }

    private var numpad: some View {
        GeometryReader { proxy in
            HStack(spacing: 0) {
                VStack(spacing: 0) {
                    numpadRow(["1", "2", "3"])
                    numpadRow(["4", "5", "6"])
                    numpadRow(["7", "8", "9"])
                    HStack(spacing: 0) {
                        numKey(symbol: "delete.left", spokenLabel: "Delete digit", isImage: true, action: tapBackspace)
                        numKey(symbol: "0", spokenLabel: "Zero", action: { tapDigit("0") })
                        numKey(symbol: ".", spokenLabel: "Decimal point", action: tapDecimal)
                    }
                }
                .frame(width: proxy.size.width * 0.75)

                VStack(spacing: 0) {
                    opKey(symbol: "+", spokenLabel: "Add", action: { tapOperator("+") })
                    opKey(symbol: "−", spokenLabel: "Subtract", action: { tapOperator("-") })
                    Button(action: tapConfirm) {
                        Text("Add")
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity, minHeight: keyHeight * 2)
                            .background(canConfirm ? RICHColor.fab : RICHColor.textMuted)
                    }
                    .disabled(!canConfirm)
                    .accessibilityLabel("Add \(selectedSubcategory) expense")
                    .accessibilityHint("Adds this entry to July 15 and returns to the ledger")
                }
                .frame(width: proxy.size.width * 0.25)
            }
        }
        .frame(height: keyHeight * 4)
        .background(RICHColor.page)
    }

    private func numpadRow(_ symbols: [String]) -> some View {
        HStack(spacing: 0) {
            ForEach(symbols, id: \.self) { symbol in
                numKey(symbol: symbol, spokenLabel: symbol, action: { tapDigit(symbol) })
            }
        }
    }

    private func numKey(
        symbol: String,
        spokenLabel: String,
        isImage: Bool = false,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Group {
                if isImage {
                    Image(systemName: symbol)
                } else {
                    Text(symbol)
                }
            }
            .font(.title3)
            .foregroundStyle(RICHColor.textPrimary)
            .frame(maxWidth: .infinity, minHeight: keyHeight)
            .background(RICHColor.cardBackground)
            .overlay(Rectangle().stroke(RICHColor.border, lineWidth: 0.5))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(spokenLabel)
    }

    private func opKey(symbol: String, spokenLabel: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(symbol)
                .font(.title2)
                .foregroundStyle(RICHColor.textPrimary)
                .frame(maxWidth: .infinity, minHeight: keyHeight)
                .background(RICHColor.page)
                .overlay(Rectangle().stroke(RICHColor.border, lineWidth: 0.5))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(spokenLabel)
    }

    private func tapDigit(_ digit: String) {
        if replaceOnNextDigit {
            displayText = digit
            replaceOnNextDigit = false
            return
        }

        let parts = displayText.split(separator: ".", omittingEmptySubsequences: false)
        if parts.count == 2, parts[1].count >= 2 { return }
        if parts[0].count >= 6, parts.count == 1 { return }
        displayText = displayText == "0" ? digit : displayText + digit
    }

    private func tapDecimal() {
        if replaceOnNextDigit {
            displayText = "0."
            replaceOnNextDigit = false
        } else if !displayText.contains(".") {
            displayText += "."
        }
    }

    private func tapBackspace() {
        replaceOnNextDigit = false
        displayText = displayText.count > 1 ? String(displayText.dropLast()) : "0"
    }

    private func tapOperator(_ op: Character) {
        let current = Double(displayText) ?? 0
        if let pendingValue, let pendingOperator {
            self.pendingValue = apply(pendingOperator, pendingValue, current)
        } else {
            pendingValue = current
        }
        pendingOperator = op
        displayText = "0"
        replaceOnNextDigit = true
    }

    private func apply(_ op: Character, _ lhs: Double, _ rhs: Double) -> Double {
        op == "+" ? lhs + rhs : lhs - rhs
    }

    private func totalAmount() -> Double {
        let current = Double(displayText) ?? 0
        if let pendingValue, let pendingOperator {
            return apply(pendingOperator, pendingValue, current)
        }
        return current
    }

    private func tapConfirm() {
        let amount = totalAmount()
        guard amount > 0 else { return }

        onConfirm(
            StudentTransaction(
                id: "quick-\(UUID().uuidString)",
                day: 15,
                title: selectedSubcategory,
                category: selectedCategory.name,
                subcategory: selectedSubcategory,
                amount: amount,
                isIncome: false
            )
        )
    }
}

#if DEBUG
    #Preview {
        QuickAddView(onConfirm: { _ in })
    }
#endif
