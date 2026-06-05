import Foundation

enum WidgetConfigurationResolver {
  static func momentId(for configuration: WidgetMomentConfigurationIntent) -> String? {
    guard let id = configuration.moment?.id, !id.isEmpty else {
      return nil
    }
    return id
  }
}
