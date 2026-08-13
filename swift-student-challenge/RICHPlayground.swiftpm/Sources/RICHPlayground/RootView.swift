import SwiftUI

private enum RootTab: String {
    case ledger = "Ledger"
    case budget = "Budget"
}

/// Connects the three chapters and keeps the judge's path visible: ledger,
/// quick add, then progressive budgeting.
struct RootView: View {
    @State private var hasEnteredApp = false
    @State private var activeTab: RootTab = .ledger
    @State private var showQuickAdd = false
    @State private var transactions = StudentStory.sampleTransactions

    var body: some View {
        Group {
            if !hasEnteredApp {
                WelcomeView(onContinue: { hasEnteredApp = true })
                    .transition(.opacity)
            } else {
                VStack(spacing: 0) {
                    Group {
                        switch activeTab {
                        case .ledger:
                            HomeLedgerView(transactions: transactions)
                        case .budget:
                            BudgetPreviewView(transactions: transactions)
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                    tabBar
                }
                .sheet(isPresented: $showQuickAdd) {
                    QuickAddView { transaction in
                        transactions.append(transaction)
                        showQuickAdd = false
                        activeTab = .ledger
                    }
                }
            }
        }
        .animation(.easeInOut(duration: 0.25), value: hasEnteredApp)
    }

    private var tabBar: some View {
        HStack(spacing: 0) {
            tabButton(title: "Ledger", systemImage: "calendar", tab: .ledger)

            Button {
                showQuickAdd = true
            } label: {
                Image(systemName: "plus")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(width: RICHSize.fab, height: RICHSize.fab)
                    .background(Circle().fill(RICHColor.fab))
                    .shadow(color: .black.opacity(0.24), radius: 7, y: 3)
            }
            .offset(y: -20)
            .frame(maxWidth: .infinity, minHeight: RICHSize.minimumTouchTarget)
            .accessibilityLabel("Add an expense")
            .accessibilityHint("Opens the amount, parent category, and subcategory flow")

            tabButton(title: "Budget", systemImage: "chart.pie", tab: .budget)
        }
        .frame(minHeight: RICHSize.tabBar)
        .padding(.bottom, RICHSpacing.xs)
        .background(RICHColor.cardBackground)
        .overlay(alignment: .top) {
            Rectangle().fill(RICHColor.border).frame(height: 1)
        }
    }

    private func tabButton(title: String, systemImage: String, tab: RootTab) -> some View {
        let isActive = activeTab == tab

        return Button {
            activeTab = tab
        } label: {
            VStack(spacing: RICHSpacing.xs) {
                Image(systemName: systemImage)
                    .font(.title3)
                Text(title)
                    .font(.caption)
            }
            .foregroundStyle(isActive ? RICHColor.primaryGreenDark : RICHColor.textMuted)
            .frame(maxWidth: .infinity, minHeight: RICHSize.minimumTouchTarget)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityValue(isActive ? "Selected" : "Not selected")
        .accessibilityAddTraits(isActive ? .isSelected : [])
    }

}

#if DEBUG
    #Preview {
        RootView()
    }
#endif
