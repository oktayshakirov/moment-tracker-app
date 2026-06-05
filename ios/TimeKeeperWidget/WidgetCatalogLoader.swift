import Foundation

struct WidgetCatalogEntry: Codable {
  let id: String
  let title: String
  let backgroundColor: String
}

enum WidgetCatalogLoader {
  /// First catalog entry = most recently updated moment (matches app `ORDER BY updated_at DESC`).
  static func loadMoments() -> [MomentEntity] {
    guard
      let json = WidgetSnapshotSharedStorage.loadCatalogJSON(),
      let data = json.data(using: .utf8),
      let entries = try? JSONDecoder().decode([WidgetCatalogEntry].self, from: data)
    else {
      return []
    }
    return entries.map { MomentEntity(id: $0.id, title: $0.title) }
  }

}
