import SwiftUI

private struct SampleTransaction: Identifiable {
    let id = UUID()
    let title: String
    let category: String
    let amountText: String
    let isIncome: Bool
}

/// Distilled version of the RICH React Native app's 首页 (home) screen:
/// mint header, square white calendar card, consecutive entry-days joined
/// into one band, an outlined "today" cell, and a dashed-divider ledger.
struct HomeLedgerView: View {
    private let weekdaySymbols = ["日", "一", "二", "三", "四", "五", "六"]
    private let leadingBlankDays = 3
    private let daysInMonth = 30
    private let entryDays: Set<Int> = [3, 4, 5, 9, 14, 15, 16, 17, 22, 27]
    private let today = 15

    @State private var selectedDay: Int?

    private let dailyLedger: [Int: [SampleTransaction]] = [
        15: [
            SampleTransaction(title: "晚餐 实习intern", category: "餐饮", amountText: "13.11", isIncome: false),
            SampleTransaction(title: "地铁", category: "交通", amountText: "6.00", isIncome: false),
        ],
        14: [
            SampleTransaction(title: "工资", category: "工资", amountText: "8,200.00", isIncome: true)
        ],
    ]

    var body: some View {
        VStack(spacing: 0) {
            header
            calendarCard
                .padding(.horizontal, RICHSpacing.lg)
                .padding(.top, RICHSpacing.lg)
            ledgerList
        }
        .background(RICHColor.primaryGreen.ignoresSafeArea(edges: .top))
        .onAppear { selectedDay = today }
    }

    private var header: some View {
        HStack {
            Text("RICH")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(RICHColor.textPrimary)
            Circle()
                .stroke(RICHColor.textPrimary, lineWidth: 1.5)
                .frame(width: 22, height: 22)
                .overlay(Image(systemName: "chevron.down").font(.system(size: 9)).foregroundStyle(RICHColor.textPrimary))
            Spacer()
        }
        .padding(.horizontal, RICHSpacing.xl)
        .padding(.top, RICHSpacing.md)
    }

    private var calendarCard: some View {
        VStack(spacing: RICHSpacing.md) {
            HStack {
                Text("7月 2026")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(RICHColor.textPrimary)
                    .padding(.horizontal, RICHSpacing.md)
                    .padding(.vertical, 4)
                    .background(RICHColor.page)
                    .clipShape(Capsule())
                Spacer()
                totalColumn(label: "收入", value: "¥8,200.00")
                Divider().frame(height: 22)
                totalColumn(label: "支出", value: "¥340.11")
            }

            HStack {
                ForEach(weekdaySymbols, id: \.self) { symbol in
                    Text(symbol)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(RICHColor.textSecondary)
                        .frame(maxWidth: .infinity)
                }
            }

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 6) {
                ForEach(0..<leadingBlankDays, id: \.self) { _ in
                    Color.clear.frame(height: 28)
                }
                ForEach(1...daysInMonth, id: \.self) { day in
                    dayCell(day)
                }
            }
        }
        .padding(RICHSpacing.md)
        .background(RICHColor.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: RICHRadius.soft))
        .shadow(color: .black.opacity(0.1), radius: 8, y: 2)
    }

    private func totalColumn(label: String, value: String) -> some View {
        VStack(alignment: .trailing, spacing: 2) {
            Text(label).font(.system(size: 9)).foregroundStyle(RICHColor.textSecondary)
            Text(value).font(.system(size: 11, weight: .bold)).foregroundStyle(RICHColor.textPrimary)
        }
    }

    private func dayCell(_ day: Int) -> some View {
        let isEntry = entryDays.contains(day)
        let isToday = day == today
        let isSelected = day == selectedDay

        return Button {
            selectedDay = (selectedDay == day) ? nil : day
        } label: {
            ZStack {
                if isEntry {
                    Circle().fill(RICHColor.entryGreen)
                } else if isSelected {
                    Circle().fill(Color(hex: 0xE2E2E2))
                } else if isToday {
                    Circle().strokeBorder(RICHColor.textPrimary.opacity(0.8), lineWidth: 1.5)
                }
                Text("\(day)")
                    .font(.system(size: 12, weight: isEntry || isToday ? .semibold : .regular))
                    .foregroundStyle(RICHColor.textPrimary)
                if isToday {
                    VStack {
                        Spacer()
                        Circle().fill(RICHColor.textPrimary).frame(width: 3, height: 3)
                    }
                    .padding(.bottom, 3)
                }
            }
            .frame(height: 28)
        }
        .buttonStyle(.plain)
    }

    private var ledgerList: some View {
        let entries = dailyLedger[selectedDay ?? -1] ?? []
        return VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(selectedDay.map { "7月\($0)日" } ?? "选择一个日期")
                    .font(.system(size: 13))
                    .foregroundStyle(RICHColor.textSecondary)
                Spacer()
            }
            .padding(.horizontal, RICHSpacing.xl)
            .padding(.top, RICHSpacing.lg)
            .padding(.bottom, RICHSpacing.sm)
            .overlay(alignment: .bottom) {
                DashedDivider().padding(.horizontal, RICHSpacing.xl)
            }

            if entries.isEmpty {
                Text("这天没有记录").font(.system(size: 12)).foregroundStyle(RICHColor.textMuted)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, RICHSpacing.xxl)
            } else {
                ForEach(entries) { entry in
                    HStack(spacing: RICHSpacing.md) {
                        Circle()
                            .fill(RICHColor.page)
                            .frame(width: 26, height: 26)
                            .overlay(Text(String(entry.category.prefix(1))).font(.system(size: 11)).foregroundStyle(RICHColor.textSecondary))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(entry.title).font(.system(size: 12.5, weight: .medium)).foregroundStyle(RICHColor.textPrimary)
                            Text(entry.category).font(.system(size: 10)).foregroundStyle(RICHColor.textSecondary)
                        }
                        Spacer()
                        Text((entry.isIncome ? "+" : "-") + entry.amountText)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(entry.isIncome ? RICHColor.incomeGreen : RICHColor.textPrimary)
                    }
                    .padding(.horizontal, RICHSpacing.xl)
                    .padding(.vertical, 5)
                }
            }
            Spacer()
        }
        .frame(maxWidth: .infinity)
        .background(RICHColor.cardBackground)
    }
}

/// Matches the RN app's `components/rich/DashedDivider.tsx` contract:
/// a thin dashed rule under date/amount summaries.
struct DashedDivider: View {
    var body: some View {
        Rectangle()
            .fill(Color(hex: 0xD8D8D8))
            .frame(height: 1)
            .overlay(
                GeometryReader { proxy in
                    Path { path in
                        path.move(to: CGPoint(x: 0, y: 0))
                        path.addLine(to: CGPoint(x: proxy.size.width, y: 0))
                    }
                    .stroke(Color(hex: 0xD8D8D8), style: StrokeStyle(lineWidth: 1, dash: [4, 3]))
                }
            )
    }
}

#Preview {
    HomeLedgerView()
}
