import AppIntents
import WidgetKit

struct PreviewProvider: AppIntentTimelineProvider {
  typealias Entry = PreviewEntry
  typealias Intent = WidgetMomentConfigurationIntent

  func placeholder(in context: Context) -> PreviewEntry {
    entry(from: WidgetSnapshotStorage.placeholder())
  }

  func snapshot(for configuration: WidgetMomentConfigurationIntent, in context: Context) async -> PreviewEntry {
    await entry(for: configuration)
  }

  func timeline(for configuration: WidgetMomentConfigurationIntent, in context: Context) async -> Timeline<PreviewEntry> {
    let current = await entry(for: configuration)
    let refreshSeconds = max(1, current.refreshIntervalSeconds)
    let nextUpdate =
      Calendar.current.date(byAdding: .second, value: refreshSeconds, to: Date())
        ?? Date().addingTimeInterval(TimeInterval(refreshSeconds))

    return Timeline(entries: [current], policy: .after(nextUpdate))
  }

  private func entry(for configuration: WidgetMomentConfigurationIntent) -> PreviewEntry {
    let momentId = WidgetConfigurationResolver.momentId(for: configuration)
    let payload =
      momentId.flatMap { WidgetSnapshotStorage.load(momentId: $0) }
        ?? WidgetSnapshotStorage.placeholder()
    let configured = momentId != nil && payload.configured
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
      refreshIntervalSeconds: payload.refreshIntervalSeconds
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
      refreshIntervalSeconds: payload.refreshIntervalSeconds
    )
  }
}
