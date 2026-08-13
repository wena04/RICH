import SwiftUI

/// Opens with the playground's complete premise so a judge can understand the
/// student, the constraint, and the interaction path without narration.
struct WelcomeView: View {
    var onContinue: () -> Void

    var body: some View {
        GeometryReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: RICHSpacing.xxl) {
                    Spacer(minLength: RICHSpacing.xxxl)

                    Label("Private by design", systemImage: "lock.shield.fill")
                        .font(.headline)
                        .foregroundStyle(RICHColor.primaryGreenDark)

                    VStack(alignment: .leading, spacing: RICHSpacing.sm) {
                        Text("RICH")
                            .font(.system(.largeTitle, design: .rounded, weight: .bold))
                            .foregroundStyle(RICHColor.textPrimary)
                            .accessibilityAddTraits(.isHeader)
                        Text("A private budget for student life")
                            .font(.title2.weight(.semibold))
                            .foregroundStyle(RICHColor.textPrimary)
                    }

                    Text("Maya receives a $600 monthly allowance. RICH helps her turn it into clear choices without an account, ads, analytics, or uploads.")
                        .font(.body)
                        .foregroundStyle(RICHColor.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)

                    VStack(alignment: .leading, spacing: RICHSpacing.lg) {
                        storyStep(number: "1", title: "See the month", detail: "Read a calendar-based ledger.")
                        storyStep(number: "2", title: "Record one choice", detail: "Add an expense by parent and subcategory.")
                        storyStep(number: "3", title: "Give every dollar a job", detail: "Allocate a parent budget across its children.")
                    }
                    .padding(RICHSpacing.xl)
                    .background(RICHColor.cardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: RICHRadius.card))

                    Spacer(minLength: RICHSpacing.xxl)

                    Button(action: onContinue) {
                        Text("Start the 3-minute story")
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity, minHeight: RICHSize.minimumTouchTarget)
                            .padding(.vertical, RICHSpacing.sm)
                            .background(RICHColor.fab)
                            .clipShape(RoundedRectangle(cornerRadius: RICHRadius.control))
                    }
                    .accessibilityHint("Opens Maya's private monthly ledger")

                    Text("This playground runs entirely offline. Demo changes stay in memory for this session only.")
                        .font(.footnote)
                        .foregroundStyle(RICHColor.textSecondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: 620, minHeight: proxy.size.height, alignment: .top)
                .padding(.horizontal, RICHSpacing.xxl)
                .padding(.bottom, RICHSpacing.xxxl)
                .frame(maxWidth: .infinity)
            }
        }
        .background(RICHColor.page.ignoresSafeArea())
    }

    private func storyStep(number: String, title: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: RICHSpacing.md) {
            Text(number)
                .font(.headline.monospacedDigit())
                .foregroundStyle(RICHColor.textPrimary)
                .frame(width: 34, height: 34)
                .background(Circle().fill(RICHColor.entryGreen))
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: RICHSpacing.xs) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(RICHColor.textPrimary)
                Text(detail)
                    .font(.subheadline)
                    .foregroundStyle(RICHColor.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Step \(number). \(title). \(detail)")
    }
}

#if DEBUG
    #Preview {
        WelcomeView(onContinue: {})
    }
#endif
