import SwiftUI

private enum RootTab {
    case home
    case budget
}

/// Ties the distilled screens together with the RN app's real bottom-bar
/// shape: two tabs plus a black center FAB (`components/TabBar` in the
/// main app), rather than a standard iOS TabView.
struct RootView: View {
    @State private var hasEnteredApp = false
    @State private var activeTab: RootTab = .home
    @State private var showQuickAdd = false

    var body: some View {
        if !hasEnteredApp {
            WelcomeView(onContinue: { hasEnteredApp = true })
        } else {
            VStack(spacing: 0) {
                switch activeTab {
                case .home:
                    HomeLedgerView()
                case .budget:
                    BudgetPreviewView()
                }
                tabBar
            }
            .sheet(isPresented: $showQuickAdd) {
                QuickAddView(onConfirm: { showQuickAdd = false })
            }
        }
    }

    private var tabBar: some View {
        HStack(spacing: 0) {
            tabButton(title: "首页", systemImage: "square.grid.2x2", tab: .home)

            Button {
                showQuickAdd = true
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 22, weight: .light))
                    .foregroundStyle(.white)
                    .frame(width: RICHSize.fab, height: RICHSize.fab)
                    .background(Circle().fill(RICHColor.fab))
                    .shadow(color: .black.opacity(0.28), radius: 8, y: 3)
            }
            .offset(y: -21)
            .frame(maxWidth: .infinity)

            tabButton(title: "预算/计划", systemImage: "chart.pie", tab: .budget)
        }
        .frame(height: RICHSize.tabBar)
        .background(RICHColor.cardBackground)
        .shadow(color: .black.opacity(0.08), radius: 8, y: -2)
    }

    private func tabButton(title: String, systemImage: String, tab: RootTab) -> some View {
        let isActive = activeTab == tab
        return Button {
            activeTab = tab
        } label: {
            VStack(spacing: 3) {
                Image(systemName: systemImage).font(.system(size: 19))
                Text(title).font(.system(size: 10))
            }
            .foregroundStyle(isActive ? RICHColor.textPrimary : RICHColor.textMuted)
            .frame(maxWidth: .infinity)
        }
    }
}

#Preview {
    RootView()
}
