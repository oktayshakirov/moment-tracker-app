import Foundation

enum WidgetLog {
  static func info(_ message: String) {
    #if DEBUG
    NSLog("%@", message)
    #endif
  }
}
