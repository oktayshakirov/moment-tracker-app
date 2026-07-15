import Foundation

struct WidgetCatalogEntry: Codable {
  let id: String
  let title: String
  let backgroundColor: String
  /// ISO-8601 target date; optional because catalogs written by older app
  /// versions predate the field.
  let targetDateTime: String?
  let mode: String?

  var targetDate: Date? {
    guard let raw = targetDateTime else { return nil }
    let withFraction = ISO8601DateFormatter()
    withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let date = withFraction.date(from: raw) { return date }
    let plain = ISO8601DateFormatter()
    plain.formatOptions = [.withInternetDateTime]
    return plain.date(from: raw)
  }
}

enum WidgetCatalogLoader {
  /// First catalog entry = most recently updated moment (matches app `ORDER BY updated_at DESC`).
  static func loadMoments() -> [MomentEntity] {
    loadEntries().map { MomentEntity(id: $0.id, title: $0.title) }
  }

  static func loadEntries() -> [WidgetCatalogEntry] {
    guard
      let json = WidgetSnapshotSharedStorage.loadCatalogJSON(),
      let data = json.data(using: .utf8),
      let entries = try? JSONDecoder().decode([WidgetCatalogEntry].self, from: data)
    else {
      return []
    }
    return entries
  }

  /// Catalog ordered for the medium widget's "up next" rail: soonest upcoming
  /// moments first, then past moments newest-first, undated entries last.
  static func entriesByUpcoming(now: Date = Date()) -> [WidgetCatalogEntry] {
    let entries = loadEntries()
    let dated = entries.compactMap { entry in
      entry.targetDate.map { (entry: entry, date: $0) }
    }
    let undated = entries.filter { $0.targetDate == nil }

    let upcoming = dated
      .filter { $0.date > now }
      .sorted { $0.date < $1.date }
    let past = dated
      .filter { $0.date <= now }
      .sorted { $0.date > $1.date }

    return (upcoming + past).map(\.entry) + undated
  }
}
