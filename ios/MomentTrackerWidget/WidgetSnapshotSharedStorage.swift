import Foundation

/// Reads/writes widget data in the App Group shared container.
enum WidgetSnapshotSharedStorage {
  static let appGroupId = "group.com.shadev.momenttracker"
  static let widgetKind = "MomentTrackerPreview"
  static let catalogFileName = "moments-catalog.json"
  static let snapshotsDirectoryName = "snapshots"
  static let imagesDirectoryName = "widget-images"

  static var containerURL: URL? {
    FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupId)
  }

  /// Shared key/value store for Pro entitlement + widget gating flags.
  static var sharedDefaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }

  /// True when a free user has more widgets than the free plan allows; the
  /// widget then renders an upgrade notice instead of moment data.
  static func widgetsLocked() -> Bool {
    sharedDefaults?.bool(forKey: "widgetsLocked") ?? false
  }

  static var catalogFileURL: URL? {
    containerURL?.appendingPathComponent(catalogFileName)
  }

  static var snapshotsDirectoryURL: URL? {
    guard let container = containerURL else { return nil }
    let dir = container.appendingPathComponent(snapshotsDirectoryName, isDirectory: true)
    if !FileManager.default.fileExists(atPath: dir.path) {
      try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    }
    return dir
  }

  static func snapshotFileURL(momentId: String) -> URL? {
    let safe = momentId.replacingOccurrences(of: "/", with: "_")
    return snapshotsDirectoryURL?.appendingPathComponent("\(safe).json")
  }

  static var imagesDirectoryURL: URL? {
    guard let container = containerURL else { return nil }
    let dir = container.appendingPathComponent(imagesDirectoryName, isDirectory: true)
    if !FileManager.default.fileExists(atPath: dir.path) {
      try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    }
    return dir
  }

  static func imageFileURL(name: String) -> URL? {
    let safe = name.replacingOccurrences(of: "/", with: "_")
    return imagesDirectoryURL?.appendingPathComponent(safe)
  }

  @discardableResult
  static func saveCatalog(json: String) -> Bool {
    write(json: json, to: catalogFileURL, label: "moments catalog")
  }

  @discardableResult
  static func saveSnapshot(momentId: String, json: String) -> Bool {
    guard let url = snapshotFileURL(momentId: momentId) else {
      WidgetLog.info("[WidgetSnapshot] Cannot resolve snapshot path for moment \(momentId)")
      return false
    }
    return write(json: json, to: url, label: "snapshot \(momentId)")
  }

  static func loadCatalogJSON() -> String? {
    readJSON(from: catalogFileURL)
  }

  static func loadSnapshotJSON(momentId: String) -> String? {
    readJSON(from: snapshotFileURL(momentId: momentId))
  }

  @discardableResult
  static func removeSnapshot(momentId: String) -> Bool {
    guard let url = snapshotFileURL(momentId: momentId) else { return false }
    guard FileManager.default.fileExists(atPath: url.path) else { return true }
    do {
      try FileManager.default.removeItem(at: url)
      WidgetLog.info("[WidgetSnapshot] Removed snapshot for moment \(momentId)")
      return true
    } catch {
      WidgetLog.info(
        "[WidgetSnapshot] Failed to remove snapshot for \(momentId): \(error.localizedDescription)"
      )
      return false
    }
  }

  @discardableResult
  private static func write(json: String, to url: URL?, label: String) -> Bool {
    guard let url else {
      WidgetLog.info(
        "[WidgetSnapshot] App group container is nil (\(appGroupId)). Enable App Groups on MomentTracker and MomentTrackerWidget."
      )
      return false
    }

    do {
      try json.write(to: url, atomically: true, encoding: .utf8)
      WidgetLog.info("[WidgetSnapshot] Wrote \(label) to \(url.path)")
      return true
    } catch {
      WidgetLog.info("[WidgetSnapshot] File write failed (\(label)): \(error.localizedDescription)")
      return false
    }
  }

  private static func readJSON(from url: URL?) -> String? {
    guard
      let url,
      FileManager.default.fileExists(atPath: url.path),
      let json = try? String(contentsOf: url, encoding: .utf8),
      !json.isEmpty
    else {
      return nil
    }
    return json
  }
}
