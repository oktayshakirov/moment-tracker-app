import Foundation

struct WidgetSnapshotPayload: Decodable {
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

  private enum CodingKeys: String, CodingKey {
    case configured
    case momentId
    case snapshot
    case title
    case primary
    case primaryUnit
    case subLabel
    case sinceUntil
    case backgroundColor
    case backgroundImageName
    case refreshIntervalSeconds
  }

  private struct NestedSnapshot: Decodable {
    let title: String
    let primary: String
    let primaryUnit: String
    let subLabel: String
    let sinceUntil: String
    let backgroundColor: String
    let backgroundImageName: String?
    let refreshIntervalSeconds: Int
  }

  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    configured = try c.decodeIfPresent(Bool.self, forKey: .configured) ?? false
    momentId = try c.decodeIfPresent(String.self, forKey: .momentId)

    if let nested = try c.decodeIfPresent(NestedSnapshot.self, forKey: .snapshot) {
      title = nested.title
      primary = nested.primary
      primaryUnit = nested.primaryUnit
      subLabel = nested.subLabel
      sinceUntil = nested.sinceUntil
      backgroundColor = nested.backgroundColor
      backgroundImageName = nested.backgroundImageName
      refreshIntervalSeconds = nested.refreshIntervalSeconds
    } else {
      title = try c.decode(String.self, forKey: .title)
      primary = try c.decode(String.self, forKey: .primary)
      primaryUnit = try c.decodeIfPresent(String.self, forKey: .primaryUnit) ?? ""
      subLabel = try c.decode(String.self, forKey: .subLabel)
      sinceUntil = try c.decode(String.self, forKey: .sinceUntil)
      backgroundColor = try c.decode(String.self, forKey: .backgroundColor)
      backgroundImageName = try c.decodeIfPresent(String.self, forKey: .backgroundImageName)
      refreshIntervalSeconds = try c.decode(Int.self, forKey: .refreshIntervalSeconds)
    }
  }
}

enum WidgetSnapshotStorage {
  static func load(momentId: String) -> WidgetSnapshotPayload? {
    guard
      let json = WidgetSnapshotSharedStorage.loadSnapshotJSON(momentId: momentId),
      let data = json.data(using: .utf8)
    else {
      return nil
    }

    do {
      return try JSONDecoder().decode(WidgetSnapshotPayload.self, from: data)
    } catch {
      WidgetLog.info("[WidgetSnapshot] JSON decode failed for \(momentId): \(error.localizedDescription)")
      return nil
    }
  }

  static func placeholder() -> WidgetSnapshotPayload {
    WidgetSnapshotPayload(
      configured: false,
      momentId: nil,
      title: "Time Keeper",
      primary: "",
      primaryUnit: "",
      subLabel: "",
      sinceUntil: "Press and hold, then Edit Widget to choose a moment",
      backgroundColor: "#1C2127",
      backgroundImageName: nil,
      refreshIntervalSeconds: 3600
    )
  }
}

extension WidgetSnapshotPayload {
  init(
    configured: Bool,
    momentId: String?,
    title: String,
    primary: String,
    primaryUnit: String,
    subLabel: String,
    sinceUntil: String,
    backgroundColor: String,
    backgroundImageName: String?,
    refreshIntervalSeconds: Int
  ) {
    self.configured = configured
    self.momentId = momentId
    self.title = title
    self.primary = primary
    self.primaryUnit = primaryUnit
    self.subLabel = subLabel
    self.sinceUntil = sinceUntil
    self.backgroundColor = backgroundColor
    self.backgroundImageName = backgroundImageName
    self.refreshIntervalSeconds = refreshIntervalSeconds
  }
}
