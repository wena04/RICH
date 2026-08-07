import SwiftUI

private struct QuickCategory: Identifiable {
    let id = UUID()
    let name: String
    let systemImage: String
}

/// Distilled version of the RN app's amount-first composer
/// (`components/rich/MoneyNumpad.tsx` + the category grid on
/// `/transaction/new`): decimal entry, backspace, +/- chaining, and a
/// confirm step. Category icons are SF Symbols here — the real app uses
/// 111 custom two-tone SVGs (`components/CategoryIcon.tsx`), out of scope
/// for a distilled playground.
struct QuickAddView: View {
    var onConfirm: () -> Void

    private let categories: [QuickCategory] = [
        QuickCategory(name: "餐饮", systemImage: "fork.knife"),
        QuickCategory(name: "交通", systemImage: "bus.fill"),
        QuickCategory(name: "购物", systemImage: "bag.fill"),
        QuickCategory(name: "娱乐", systemImage: "gamecontroller.fill"),
        QuickCategory(name: "住房", systemImage: "house.fill"),
        QuickCategory(name: "医疗", systemImage: "cross.case.fill"),
    ]

    @State private var selectedCategory = 0
    @State private var displayText = "0"
    @State private var pendingValue: Double?
    @State private var pendingOperator: Character?
    @State private var confirmedMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            header
            amountLine
            DashedDivider().padding(.horizontal, RICHSpacing.lg)
            categoryGrid
            Spacer(minLength: 0)
            if let confirmedMessage {
                Text(confirmedMessage)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(RICHColor.primaryGreenDark)
                    .padding(.bottom, RICHSpacing.sm)
            }
            numpad
        }
        .background(RICHColor.cardBackground)
    }

    private var header: some View {
        HStack {
            Image(systemName: "chevron.left").foregroundStyle(RICHColor.textPrimary)
            Spacer()
            Text("今天").font(.system(size: 13)).foregroundStyle(RICHColor.textPrimary)
            Image(systemName: "chevron.down").font(.system(size: 10)).foregroundStyle(RICHColor.textSecondary)
        }
        .padding(.horizontal, RICHSpacing.lg)
        .padding(.vertical, RICHSpacing.md)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Color(hex: 0xF0F0F0)).frame(height: 1)
        }
    }

    private var amountLine: some View {
        HStack(alignment: .firstTextBaseline, spacing: 2) {
            Text("¥").foregroundStyle(RICHColor.primaryGreen)
            Text(displayText).foregroundStyle(RICHColor.textPrimary)
            if let pendingOperator {
                Text(" \(String(pendingOperator)) ...").foregroundStyle(RICHColor.textMuted)
                    .font(.system(size: 16))
            }
        }
        .font(.system(size: 36, weight: .light))
        .padding(.horizontal, RICHSpacing.xl)
        .padding(.vertical, RICHSpacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var categoryGrid: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: RICHSpacing.md) {
            ForEach(categories.indices, id: \.self) { index in
                let category = categories[index]
                let isSelected = index == selectedCategory
                Button {
                    selectedCategory = index
                } label: {
                    VStack(spacing: 5) {
                        Circle()
                            .fill(isSelected ? RICHColor.primaryGreen.opacity(0.13) : Color(hex: 0xF5F5F5))
                            .overlay(Circle().strokeBorder(isSelected ? RICHColor.primaryGreen : .clear, lineWidth: 2))
                            .overlay(Image(systemName: category.systemImage).foregroundStyle(isSelected ? RICHColor.primaryGreen : RICHColor.textSecondary))
                            .frame(width: 44, height: 44)
                        Text(category.name)
                            .font(.system(size: 10, weight: isSelected ? .medium : .regular))
                            .foregroundStyle(isSelected ? RICHColor.primaryGreen : RICHColor.textSecondary)
                    }
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, RICHSpacing.lg)
        .padding(.top, RICHSpacing.md)
    }

    private var numpad: some View {
        HStack(spacing: 0) {
            VStack(spacing: 0) {
                numpadRow(["1", "2", "3"])
                numpadRow(["4", "5", "6"])
                numpadRow(["7", "8", "9"])
                HStack(spacing: 0) {
                    numKey(symbol: "⌫", action: tapBackspace)
                    numKey(symbol: "0", action: { tapDigit("0") })
                    numKey(symbol: ".", action: tapDecimal)
                }
            }
            .frame(maxWidth: .infinity)

            VStack(spacing: 0) {
                opKey(symbol: "+", action: { tapOperator("+") })
                opKey(symbol: "-", action: { tapOperator("-") })
                Button(action: tapConfirm) {
                    Text("确定")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 46 * 2)
                        .background(RICHColor.fab)
                }
            }
            .frame(maxWidth: .infinity)
        }
        .background(Color(hex: 0xF8F8F8))
    }

    private func numpadRow(_ symbols: [String]) -> some View {
        HStack(spacing: 0) {
            ForEach(symbols, id: \.self) { symbol in
                numKey(symbol: symbol, action: { tapDigit(symbol) })
            }
        }
    }

    private func numKey(symbol: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(symbol)
                .font(.system(size: 20))
                .foregroundStyle(RICHColor.textPrimary)
                .frame(maxWidth: .infinity, minHeight: 46)
                .background(RICHColor.cardBackground)
                .overlay(Rectangle().stroke(RICHColor.border, lineWidth: 0.5))
        }
        .buttonStyle(.plain)
    }

    private func opKey(symbol: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(symbol)
                .font(.system(size: 22))
                .foregroundStyle(RICHColor.textPrimary)
                .frame(maxWidth: .infinity, minHeight: 46)
                .background(Color(hex: 0xF5F5F5))
                .overlay(Rectangle().stroke(RICHColor.border, lineWidth: 0.5))
        }
        .buttonStyle(.plain)
    }

    private func tapDigit(_ digit: String) {
        confirmedMessage = nil
        displayText = displayText == "0" ? digit : displayText + digit
    }

    private func tapDecimal() {
        confirmedMessage = nil
        if !displayText.contains(".") { displayText += "." }
    }

    private func tapBackspace() {
        confirmedMessage = nil
        displayText = displayText.count > 1 ? String(displayText.dropLast()) : "0"
    }

    private func tapOperator(_ op: Character) {
        confirmedMessage = nil
        let current = Double(displayText) ?? 0
        if let pending = pendingValue, let pendingOp = pendingOperator {
            pendingValue = apply(pendingOp, pending, current)
        } else {
            pendingValue = current
        }
        pendingOperator = op
        displayText = "0"
    }

    private func apply(_ op: Character, _ lhs: Double, _ rhs: Double) -> Double {
        op == "+" ? lhs + rhs : lhs - rhs
    }

    private func totalAmount() -> Double {
        let current = Double(displayText) ?? 0
        if let pending = pendingValue, let op = pendingOperator {
            return apply(op, pending, current)
        }
        return current
    }

    private func tapConfirm() {
        let amount = totalAmount()
        confirmedMessage = "已记一笔 ¥\(String(format: "%.2f", amount)) · \(categories[selectedCategory].name)"
        pendingValue = nil
        pendingOperator = nil
        displayText = "0"
    }
}

#Preview {
    QuickAddView(onConfirm: {})
}
