import Foundation
import WidgetKit

@objc(WidgetSnapshotBridge)
class WidgetSnapshotBridge: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool {
    true
  }

  @objc func setSnapshotForMoment(_ momentId: String, json: String) {
    let ok = WidgetSnapshotSharedStorage.saveSnapshot(momentId: momentId, json: json)
    if !ok {
      WidgetLog.info("[WidgetSnapshotBridge] Failed to persist snapshot for moment \(momentId)")
    }
  }

  @objc func removeSnapshotForMoment(_ momentId: String) {
    _ = WidgetSnapshotSharedStorage.removeSnapshot(momentId: momentId)
  }

  @objc func setCatalogJson(_ json: String) {
    let ok = WidgetSnapshotSharedStorage.saveCatalog(json: json)
    if !ok {
      WidgetLog.info("[WidgetSnapshotBridge] Failed to persist moments catalog")
    }
  }

  @objc func reloadTimelines() {
    guard #available(iOS 14.0, *) else { return }
    WidgetCenter.shared.reloadAllTimelines()
    WidgetCenter.shared.reloadTimelines(ofKind: WidgetSnapshotSharedStorage.widgetKind)
    WidgetLog.info("[WidgetSnapshotBridge] Requested timeline reload")
  }
}
