import Foundation

/// A tiny, in-memory transaction model for the three-minute playground story.
/// Nothing is persisted or sent anywhere; the full RICH app owns that larger data layer.
struct StudentTransaction: Identifiable, Equatable {
    let id: String
    let day: Int
    let title: String
    let category: String
    let subcategory: String
    let amount: Double
    let isIncome: Bool

    var categoryPath: String {
        subcategory.isEmpty ? category : "\(category) › \(subcategory)"
    }
}

enum StudentStory {
    static let monthlyAllowance = 600.0

    static let sampleTransactions: [StudentTransaction] = [
        StudentTransaction(
            id: "allowance",
            day: 1,
            title: "Monthly allowance",
            category: "Income",
            subcategory: "Family support",
            amount: monthlyAllowance,
            isIncome: true
        ),
        StudentTransaction(
            id: "campus-lunch",
            day: 15,
            title: "Campus lunch",
            category: "Food",
            subcategory: "Campus meals",
            amount: 12.50,
            isIncome: false
        ),
        StudentTransaction(
            id: "library-bus",
            day: 15,
            title: "Bus to the library",
            category: "Transit",
            subcategory: "Bus",
            amount: 2.50,
            isIncome: false
        ),
        StudentTransaction(
            id: "course-reader",
            day: 14,
            title: "Course reader",
            category: "Study",
            subcategory: "Books",
            amount: 38.00,
            isIncome: false
        ),
    ]
}
