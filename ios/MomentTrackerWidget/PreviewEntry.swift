import Foundation
import WidgetKit

struct PreviewEntry: TimelineEntry {
  let date: Date
  let configured: Bool
  let momentId: String?
  let title: String
  let primary: String
  let primaryUnit: String
  let subLabel: String
  let sinceUntil: String
  let backgroundColor: String
  let backgroundImageName: String?
  let refreshIntervalSeconds: Int
  /// When true the free-tier widget limit is exceeded; show an upgrade notice.
  var locked: Bool = false

  /// Only configured widgets open the app (moment detail). Placeholder uses Edit Widget.
  var widgetURL: URL? {
    guard configured, let momentId, !momentId.isEmpty else { return nil }
    let encoded =
      momentId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? momentId
    return URL(string: "momenttracker://moment/\(encoded)")
  }
}
