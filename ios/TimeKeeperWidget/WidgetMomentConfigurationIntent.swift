import AppIntents
import WidgetKit

struct WidgetMomentConfigurationIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "Moment Widget"
  static var description = IntentDescription(
    "Display a moment on your home screen. Tap Moment below to pick which one to show."
  )

  @Parameter(title: "Moment")
  var moment: MomentEntity?

  static var parameterSummary: some ParameterSummary {
    Summary {
      \WidgetMomentConfigurationIntent.$moment
    }
  }
}
