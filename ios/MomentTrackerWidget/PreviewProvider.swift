import AppIntents
import WidgetKit

struct PreviewProvider: AppIntentTimelineProvider {
  typealias Entry = PreviewEntry
  typealias Intent = WidgetMomentConfigurationIntent

  func placeholder(in context: Context) -> PreviewEntry {
    entry(from: WidgetSnapshotStorage.placeholder())
  }

  func snapshot(for configuration: WidgetMomentConfigurationIntent, in context: Context) async -> PreviewEntry {
    await entry(for: configuration, family: context.family)
  }

  func timeline(for configuration: WidgetMomentConfigurationIntent, in context: Context) async -> Timeline<PreviewEntry> {
    let current = await entry(for: configuration, family: context.family)
    let refreshSeconds = max(1, current.refreshIntervalSeconds)
    let nextUpdate =
      Calendar.current.date(byAdding: .second, value: refreshSeconds, to: Date())
        ?? Date().addingTimeInterval(TimeInterval(refreshSeconds))

    return Timeline(entries: [current], policy: .after(nextUpdate))
  }

  private func entry(
    for configuration: WidgetMomentConfigurationIntent,
    family: WidgetFamily
  ) -> PreviewEntry {
    let momentId = WidgetConfigurationResolver.momentId(for: configuration)
    let payload =
      momentId.flatMap { WidgetSnapshotStorage.load(momentId: $0) }
        ?? WidgetSnapshotStorage.placeholder()
    let configured = momentId != nil && payload.configured

    // The medium family adds an "up next" rail of other moments; their
    // snapshots are already in the shared container.
    var others: [SecondaryMomentEntry] = []
    var refreshSeconds = payload.refreshIntervalSeconds
    if family == .systemMedium && configured {
      for entry in WidgetCatalogLoader.entriesByUpcoming() where entry.id != momentId {
        guard let snapshot = WidgetSnapshotStorage.load(momentId: entry.id) else { continue }
        others.append(
          SecondaryMomentEntry(
            momentId: entry.id,
            title: snapshot.title,
            primary: snapshot.primary,
            primaryUnit: snapshot.primaryUnit,
            sinceUntil: snapshot.sinceUntil
          )
        )
        refreshSeconds = min(refreshSeconds, snapshot.refreshIntervalSeconds)
        if others.count >= 2 { break }
      }
    }

    return PreviewEntry(
      date: Date(),
      configured: configured,
      momentId: momentId,
      title: payload.title,
      primary: payload.primary,
      primaryUnit: payload.primaryUnit,
      subLabel: payload.subLabel,
      sinceUntil: payload.sinceUntil,
      backgroundColor: payload.backgroundColor,
      backgroundImageName: payload.backgroundImageName,
      refreshIntervalSeconds: refreshSeconds,
      locked: WidgetSnapshotSharedStorage.widgetsLocked(),
      others: others
    )
  }

  private func entry(from payload: WidgetSnapshotPayload) -> PreviewEntry {
    PreviewEntry(
      date: Date(),
      configured: payload.configured,
      momentId: payload.momentId,
      title: payload.title,
      primary: payload.primary,
      primaryUnit: payload.primaryUnit,
      subLabel: payload.subLabel,
      sinceUntil: payload.sinceUntil,
      backgroundColor: payload.backgroundColor,
      backgroundImageName: payload.backgroundImageName,
      refreshIntervalSeconds: payload.refreshIntervalSeconds
    )
  }
}
