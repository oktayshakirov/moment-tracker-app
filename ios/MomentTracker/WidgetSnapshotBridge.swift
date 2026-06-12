import Foundation
import WidgetKit

@objc(WidgetSnapshotBridge)
class WidgetSnapshotBridge: NSObject {

  private static let appGroupId  = "group.com.shadev.momenttracker"
  private static let widgetKind  = "MomentTrackerPreview"
  private static let snapshotsDir = "snapshots"
  private static let imagesDir   = "widget-images"

  private static var containerURL: URL? {
    FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupId)
  }

  // MARK: - Exposed to JS

  @objc func setSnapshotForMoment(_ momentId: String, json: String) {
    guard let url = Self.snapshotURL(for: momentId) else { return }
    try? json.write(to: url, atomically: true, encoding: .utf8)
  }

  @objc func removeSnapshotForMoment(_ momentId: String) {
    guard let url = Self.snapshotURL(for: momentId) else { return }
    try? FileManager.default.removeItem(at: url)
  }

  @objc func setCatalogJson(_ json: String) {
    guard let url = Self.containerURL?.appendingPathComponent("moments-catalog.json") else { return }
    try? json.write(to: url, atomically: true, encoding: .utf8)
  }

  @objc func setImageForMoment(_ momentId: String, sourcePath: String, name: String) {
    guard let dir = Self.imagesDirURL else { return }
    let dest = dir.appendingPathComponent(Self.safe(name))
    let source = URL(fileURLWithPath: sourcePath)
    try? FileManager.default.removeItem(at: dest)
    try? FileManager.default.copyItem(at: source, to: dest)
  }

  @objc func removeImageForMoment(_ momentId: String) {
    guard let dir = Self.imagesDirURL else { return }
    let name = Self.imageName(forMomentId: momentId)
    let dest = dir.appendingPathComponent(name)
    try? FileManager.default.removeItem(at: dest)
  }

  @objc func reloadTimelines() {
    WidgetCenter.shared.reloadTimelines(ofKind: Self.widgetKind)
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }

  // MARK: - Helpers

  private static func snapshotURL(for momentId: String) -> URL? {
    guard let dir = containerURL?.appendingPathComponent(snapshotsDir, isDirectory: true) else {
      return nil
    }
    if !FileManager.default.fileExists(atPath: dir.path) {
      try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    }
    let safe = momentId.replacingOccurrences(of: "/", with: "_")
    return dir.appendingPathComponent("\(safe).json")
  }

  private static var imagesDirURL: URL? {
    guard let dir = containerURL?.appendingPathComponent(imagesDir, isDirectory: true) else {
      return nil
    }
    if !FileManager.default.fileExists(atPath: dir.path) {
      try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    }
    return dir
  }

  private static func safe(_ value: String) -> String {
    value.replacingOccurrences(of: "/", with: "_")
  }

  /// Mirror of the JS `safeName` so removals resolve the same filename.
  private static func imageName(forMomentId momentId: String) -> String {
    let cleaned = momentId.map { ch -> Character in
      ch.isLetter || ch.isNumber || ch == "_" || ch == "-" ? ch : "_"
    }
    return "\(String(cleaned)).jpg"
  }
}
