import Foundation
import WidgetKit

@objc(WidgetSnapshotBridge)
class WidgetSnapshotBridge: NSObject {

  @objc func setSnapshotForMoment(_ momentId: String, json: String) {
    WidgetSnapshotSharedStorage.saveSnapshot(momentId: momentId, json: json)
  }

  @objc func removeSnapshotForMoment(_ momentId: String) {
    WidgetSnapshotSharedStorage.removeSnapshot(momentId: momentId)
  }

  @objc func setCatalogJson(_ json: String) {
    WidgetSnapshotSharedStorage.saveCatalog(json: json)
  }

  @objc func reloadTimelines() {
    WidgetCenter.shared.reloadTimelines(ofKind: WidgetSnapshotSharedStorage.widgetKind)
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }
}
