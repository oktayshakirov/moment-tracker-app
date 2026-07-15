import AppIntents
import SwiftUI
import WidgetKit

@main
struct MomentTrackerWidgetBundle: WidgetBundle {
  var body: some Widget {
    PreviewWidget()
  }
}

struct PreviewWidget: Widget {
  let kind = WidgetSnapshotSharedStorage.widgetKind

  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: WidgetMomentConfigurationIntent.self, provider: PreviewProvider()) {
      entry in
      PreviewWidgetView(entry: entry)
    }
    .configurationDisplayName("Moment Tracker")
    .description(
      "Show a moment on your home screen — the medium size adds your next moments alongside it. Long press the widget, then tap Edit Widget to choose which moment to display."
    )
    .supportedFamilies([.systemSmall, .systemMedium])
    .contentMarginsDisabled()
  }
}
