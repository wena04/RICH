import SwiftUI

/// Distilled version of the RN app's 预算/计划 empty state
/// (`app/(tabs)/charts.tsx`, the `!hasBudget` branch): headline, a soft
/// panel with an illustrated donut, a tagline, and a black full-width CTA.
struct BudgetPreviewView: View {
    var body: some View {
        VStack(spacing: RICHSpacing.lg) {
            Text("预算/计划")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(RICHColor.textPrimary)
                .padding(.top, RICHSpacing.md)

            Text("您还未创建预算")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(RICHColor.textPrimary)
                .padding(.top, RICHSpacing.xl)

            VStack(spacing: RICHSpacing.lg) {
                ZStack {
                    Circle()
                        .trim(from: 0, to: 0.55)
                        .stroke(Color(hex: 0x7ED9BE), style: StrokeStyle(lineWidth: 16, lineCap: .butt))
                        .rotationEffect(.degrees(-90))
                    Circle()
                        .trim(from: 0.55, to: 0.85)
                        .stroke(RICHColor.entryGreen, style: StrokeStyle(lineWidth: 16, lineCap: .butt))
                        .rotationEffect(.degrees(-90))
                    Circle()
                        .trim(from: 0.85, to: 1.0)
                        .stroke(Color(hex: 0xDFF2EA), style: StrokeStyle(lineWidth: 16, lineCap: .butt))
                        .rotationEffect(.degrees(-90))
                }
                .frame(width: 96, height: 96)

                Text("有预算才能无负担的花钱")
                    .font(.system(size: 13))
                    .foregroundStyle(RICHColor.textSecondary)

                Button {} label: {
                    Text("+ 创建预算")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(RICHColor.fab)
                }
            }
            .padding(RICHSpacing.xl)
            .background(RICHColor.panel)
            .padding(.horizontal, RICHSpacing.xxl)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(RICHColor.cardBackground)
    }
}

#Preview {
    BudgetPreviewView()
}
