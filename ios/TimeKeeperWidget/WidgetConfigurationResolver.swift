import Foundation

enum WidgetConfigurationResolver {
  static func momentId(for configuration: WidgetMomentConfigurationIntent) -> String? {
    switch configuration.displayMode {
    case .recent:
      return WidgetCatalogLoader.recentMomentId()
    case .specific:
      guard let id = configuration.moment?.id, !id.isEmpty else {
        return nil
      }
      return id
    }
  }
}
