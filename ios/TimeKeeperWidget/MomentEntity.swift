import AppIntents
import Foundation

struct MomentEntity: AppEntity {
  static var typeDisplayRepresentation: TypeDisplayRepresentation {
    TypeDisplayRepresentation(name: "Moment")
  }

  static var defaultQuery = MomentQuery()

  var id: String
  var title: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(title)")
  }
}

struct MomentQuery: EntityQuery {
  func entities(for identifiers: [MomentEntity.ID]) async throws -> [MomentEntity] {
    let all = WidgetCatalogLoader.loadMoments()
    return identifiers.compactMap { id in all.first { $0.id == id } }
  }

  func suggestedEntities() async throws -> [MomentEntity] {
    WidgetCatalogLoader.loadMoments()
  }

  func entities(matching string: String) async throws -> [MomentEntity] {
    let all = WidgetCatalogLoader.loadMoments()
    guard !string.isEmpty else { return all }
    return all.filter { $0.title.localizedCaseInsensitiveContains(string) }
  }
}
