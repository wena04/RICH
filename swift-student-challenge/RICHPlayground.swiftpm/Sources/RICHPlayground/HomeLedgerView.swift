import SwiftUI

/// The first chapter of the story: Maya can understand her allowance and
/// purchases from a calendar without signing in or sending data to a server.
struct HomeLedgerView: View {
    let transactions: [StudentTransaction]

    private let weekdaySymbols = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    private let leadingBlankDays = 2
    private let daysInMonth = 31
    private let today = 15

    @ScaledMetric(relativeTo: .body) private var calendarCellHeight: CGFloat = 40
    @State private var selectedDay: Int? = 15

    private var entryDays: Set<Int> {
        Set(transactions.map(\.day))
    }

    private var monthIncome: Double {
        transactions.filter(\.isIncome).reduce(0) { $0 + $1.amount }
    }

    private var monthExpense: Double {
        transactions.filter { !$0.isIncome }.reduce(0) { $0 + $1.amount }
    }

    var body: some View {
        VStack(spacing: 0) {
            header

            ScrollView {
                VStack(spacing: RICHSpacing.lg) {
                    calendarCard
                    ledgerList
                }
                .padding(.horizontal, RICHSpacing.lg)
                .padding(.vertical, RICHSpacing.lg)
            }
            .background(RICHColor.page)
        }
        .background(RICHColor.primaryGreen.ignoresSafeArea(edges: .top))
    }

    private var header: some View {
        HStack(alignment: .center, spacing: RICHSpacing.md) {
            VStack(alignment: .leading, spacing: RICHSpacing.xs) {
                Text("RICH")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(RICHColor.textPrimary)
                    .accessibilityAddTraits(.isHeader)
                Text("Maya's private student budget")
                    .font(.caption)
                    .foregroundStyle(RICHColor.textPrimary)
            }

            Spacer()

            Label("Offline", systemImage: "lock.fill")
                .font(.caption.weight(.semibold))
                .foregroundStyle(RICHColor.textPrimary)
                .padding(.horizontal, RICHSpacing.md)
                .padding(.vertical, RICHSpacing.sm)
                .background(.white.opacity(0.72))
                .clipShape(Capsule())
                .accessibilityLabel("All demo data stays offline")
        }
        .padding(.horizontal, RICHSpacing.xl)
        .padding(.vertical, RICHSpacing.md)
        .background(RICHColor.primaryGreen)
    }

    private var calendarCard: some View {
        VStack(spacing: RICHSpacing.md) {
            ViewThatFits(in: .horizontal) {
                HStack(alignment: .center, spacing: RICHSpacing.md) {
                    monthLabel
                    Spacer(minLength: RICHSpacing.sm)
                    totals
                }

                VStack(alignment: .leading, spacing: RICHSpacing.md) {
                    monthLabel
                    totals
                }
            }

            HStack(spacing: 0) {
                ForEach(Array(weekdaySymbols.enumerated()), id: \.offset) { _, symbol in
                    Text(symbol)
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(RICHColor.textSecondary)
                        .minimumScaleFactor(0.7)
                        .frame(maxWidth: .infinity)
                        .accessibilityHidden(true)
                }
            }

            LazyVGrid(
                columns: Array(repeating: GridItem(.flexible(), spacing: 2), count: 7),
                spacing: 3
            ) {
                ForEach(0..<leadingBlankDays, id: \.self) { _ in
                    Color.clear.frame(minHeight: calendarCellHeight)
                }
                ForEach(1...daysInMonth, id: \.self) { day in
                    dayCell(day)
                }
            }
        }
        .padding(RICHSpacing.md)
        .background(RICHColor.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: RICHRadius.card))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("July 2026 calendar")
    }

    private var monthLabel: some View {
        Text("July 2026")
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(RICHColor.textPrimary)
            .padding(.horizontal, RICHSpacing.md)
            .padding(.vertical, RICHSpacing.sm)
            .background(RICHColor.page)
            .clipShape(Capsule())
    }

    private var totals: some View {
        HStack(spacing: RICHSpacing.md) {
            totalColumn(label: "Allowance", value: money(monthIncome), color: RICHColor.incomeGreen)
            Divider().frame(minHeight: 30)
            totalColumn(label: "Spent", value: money(monthExpense), color: RICHColor.textPrimary)
        }
        .accessibilityElement(children: .combine)
    }

    private func totalColumn(label: String, value: String, color: Color) -> some View {
        VStack(alignment: .trailing, spacing: RICHSpacing.xs) {
            Text(label)
                .font(.caption)
                .foregroundStyle(RICHColor.textSecondary)
            Text(value)
                .font(.subheadline.weight(.bold).monospacedDigit())
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
    }

    private func dayCell(_ day: Int) -> some View {
        let count = transactions.filter { $0.day == day }.count
        let isEntry = entryDays.contains(day)
        let isToday = day == today
        let isSelected = day == selectedDay

        return Button {
            selectedDay = selectedDay == day ? nil : day
        } label: {
            ZStack {
                if isSelected {
                    Circle()
                        .fill(Color(hex: 0xE2E2E2))
                        .overlay(Circle().strokeBorder(RICHColor.textPrimary, lineWidth: 1.5))
                } else if isEntry {
                    Circle().fill(RICHColor.entryGreen)
                } else if isToday {
                    Circle().strokeBorder(RICHColor.textPrimary.opacity(0.8), lineWidth: 1.5)
                }

                Text("\(day)")
                    .font(.caption.weight(isEntry || isToday ? .semibold : .regular).monospacedDigit())
                    .foregroundStyle(RICHColor.textPrimary)

                if isToday {
                    VStack {
                        Spacer()
                        Circle()
                            .fill(RICHColor.textPrimary)
                            .frame(width: 3, height: 3)
                    }
                    .padding(.bottom, 4)
                }
            }
            .frame(maxWidth: .infinity, minHeight: max(40, calendarCellHeight))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("July \(day)")
        .accessibilityValue(dayAccessibilityValue(isSelected: isSelected, isToday: isToday, count: count))
        .accessibilityHint("Shows this day's ledger entries")
    }

    private func dayAccessibilityValue(isSelected: Bool, isToday: Bool, count: Int) -> String {
        var parts: [String] = []
        if isSelected { parts.append("Selected") }
        if isToday { parts.append("Demo today") }
        parts.append(count == 1 ? "1 entry" : "\(count) entries")
        return parts.joined(separator: ", ")
    }

    private var ledgerList: some View {
        let entries = transactions.filter { $0.day == selectedDay }

        return VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: RICHSpacing.xs) {
                    Text(selectedDay.map { "July \($0)" } ?? "Choose a date")
                        .font(.headline)
                        .foregroundStyle(RICHColor.textPrimary)
                    Text("Parent categories become specific subcategories.")
                        .font(.caption)
                        .foregroundStyle(RICHColor.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer()
            }
            .padding(RICHSpacing.xl)
            .overlay(alignment: .bottom) {
                DashedDivider().padding(.horizontal, RICHSpacing.xl)
            }

            if entries.isEmpty {
                ContentUnavailableView(
                    "No entries on this day",
                    systemImage: "calendar.badge.plus",
                    description: Text("Choose July 14 or 15, or use the center add button.")
                )
                .padding(.vertical, RICHSpacing.lg)
            } else {
                ForEach(entries) { entry in
                    transactionRow(entry)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .background(RICHColor.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: RICHRadius.card))
    }

    private func transactionRow(_ entry: StudentTransaction) -> some View {
        HStack(spacing: RICHSpacing.md) {
            Image(systemName: symbol(for: entry.category))
                .font(.body)
                .foregroundStyle(entry.isIncome ? RICHColor.incomeGreen : RICHColor.textSecondary)
                .frame(width: 38, height: 38)
                .background(Circle().fill(RICHColor.page))
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: RICHSpacing.xs) {
                Text(entry.title)
                    .font(.body.weight(.medium))
                    .foregroundStyle(RICHColor.textPrimary)
                    .fixedSize(horizontal: false, vertical: true)
                Text(entry.categoryPath)
                    .font(.caption)
                    .foregroundStyle(RICHColor.textSecondary)
            }

            Spacer(minLength: RICHSpacing.sm)

            Text((entry.isIncome ? "+" : "−") + money(entry.amount))
                .font(.body.weight(.semibold).monospacedDigit())
                .foregroundStyle(entry.isIncome ? RICHColor.incomeGreen : RICHColor.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .padding(.horizontal, RICHSpacing.xl)
        .padding(.vertical, RICHSpacing.md)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(
            "\(entry.title), \(entry.categoryPath), \(entry.isIncome ? "income" : "expense") \(money(entry.amount))"
        )
    }

    private func symbol(for category: String) -> String {
        switch category {
        case "Food": return "fork.knife"
        case "Transit": return "bus.fill"
        case "Study": return "book.closed.fill"
        case "Income": return "wallet.bifold.fill"
        default: return "tag.fill"
        }
    }

    private func money(_ amount: Double) -> String {
        String(format: "$%.2f", amount)
    }
}

/// A thin dashed rule used beneath date and amount summaries.
struct DashedDivider: View {
    var body: some View {
        GeometryReader { proxy in
            Path { path in
                path.move(to: CGPoint(x: 0, y: 0.5))
                path.addLine(to: CGPoint(x: proxy.size.width, y: 0.5))
            }
            .stroke(RICHColor.border, style: StrokeStyle(lineWidth: 1, dash: [4, 3]))
        }
        .frame(height: 1)
        .accessibilityHidden(true)
    }
}

#if DEBUG
    #Preview {
        HomeLedgerView(transactions: StudentStory.sampleTransactions)
    }
#endif
