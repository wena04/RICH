import SwiftUI

/// Brand tokens distilled from the RICH React Native app's
/// `constants/Colors.ts` and `constants/Design.ts`, kept in sync by hand.
enum RICHColor {
    static let primaryGreen = Color(hex: 0x3ECDA5)
    static let primaryGreenDark = Color(hex: 0x2BB890)
    static let textPrimary = Color(hex: 0x1A1A1A)
    static let textSecondary = Color(hex: 0x666666)
    static let textMuted = Color(hex: 0x999999)
    static let cardBackground = Color.white
    static let border = Color(hex: 0xE5E5E5)
    static let entryGreen = Color(hex: 0xB5EAD7)
    static let incomeGreen = Color(hex: 0x4CAF50)
    static let warning = Color(hex: 0xE2A33A)
    static let expenseRed = Color(hex: 0xFF6B6B)
    static let panel = Color(hex: 0xF5F6F7)
    static let page = Color(hex: 0xF4F4F4)
    static let fab = Color.black
}

enum RICHSpacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 20
    static let xxl: CGFloat = 24
    static let xxxl: CGFloat = 32
}

/// RICH deliberately keeps content cards near-zero radius — a square,
/// high-contrast identity where almost every rounded-corner competitor
/// (Cash App, Robinhood, Revolut, Monarch, Copilot) does not.
enum RICHRadius {
    static let card: CGFloat = 3
    static let control: CGFloat = 6
    static let soft: CGFloat = 8
    static let pill: CGFloat = 999
}

enum RICHSize {
    static let headerAction: CGFloat = 40
    static let screenHeader: CGFloat = 64
    static let tabBar: CGFloat = 62
    static let fab: CGFloat = 58
    static let minimumTouchTarget: CGFloat = 44
}

extension Color {
    init(hex: UInt32) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8) & 0xFF) / 255
        let b = Double(hex & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
