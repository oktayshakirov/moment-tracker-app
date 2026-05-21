import AppIntents

enum WidgetDisplayMode: String, AppEnum {
  case recent
  case specific

  static var typeDisplayRepresentation: TypeDisplayRepresentation {
    TypeDisplayRepresentation(name: "Display")
  }

  static var caseDisplayRepresentations: [WidgetDisplayMode: DisplayRepresentation] {
    [
      .recent: DisplayRepresentation(title: "Recent moment"),
      .specific: DisplayRepresentation(title: "Specific moment"),
    ]
  }
}
