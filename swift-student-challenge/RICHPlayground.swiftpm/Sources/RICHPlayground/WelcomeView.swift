import SwiftUI

/// First screen: states the app's one real differentiator up front —
/// on-device only, nothing uploaded — before showing any UI.
struct WelcomeView: View {
    var onContinue: () -> Void

    var body: some View {
        VStack(spacing: RICHSpacing.xxl) {
            Spacer()

            Text("RICH")
                .font(.system(size: 40, weight: .bold, design: .rounded))
                .foregroundStyle(RICHColor.textPrimary)
            Text("记账")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(RICHColor.primaryGreenDark)

            Text("A local-first bookkeeping app.\nEvery number on the next two screens is computed on this device — nothing is uploaded, ever.")
                .multilineTextAlignment(.center)
                .font(.system(size: 15))
                .foregroundStyle(RICHColor.textSecondary)
                .padding(.horizontal, RICHSpacing.xxl)
                .fixedSize(horizontal: false, vertical: true)

            Spacer()

            Button(action: onContinue) {
                Text("查看设计 View the design")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(RICHColor.fab)
                    .clipShape(RoundedRectangle(cornerRadius: RICHRadius.control))
            }
            .padding(.horizontal, RICHSpacing.xxl)
            .padding(.bottom, RICHSpacing.xxxl)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(RICHColor.page.ignoresSafeArea())
    }
}

#Preview {
    WelcomeView(onContinue: {})
}
