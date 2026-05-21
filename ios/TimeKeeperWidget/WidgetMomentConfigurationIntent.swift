import AppIntents
import WidgetKit

struct WidgetMomentConfigurationIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "Moment Widget"
  static var description = IntentDescription(
    "Display a moment on your home screen. Choose the most recent moment or pick a specific one."
  )

  @Parameter(title: "Display", default: .specific)
  var displayMode: WidgetDisplayMode

  @Parameter(title: "Moment")
  var moment: MomentEntity?

  static var parameterSummary: some ParameterSummary {
    When(\WidgetMomentConfigurationIntent.$displayMode, .equalTo, WidgetDisplayMode.specific) {
      Summary {
        \WidgetMomentConfigurationIntent.$displayMode
        \WidgetMomentConfigurationIntent.$moment
      }
    } otherwise: {
      Summary {
        \WidgetMomentConfigurationIntent.$displayMode
      }
    }
  }
}
