import SwiftUI
import WidgetKit

extension View {
  /// Required on iOS 17+ for home screen widgets; falls back to `background` on iOS 16.
  @ViewBuilder
  func widgetContainerBackground<Background: View>(
    @ViewBuilder _ background: () -> Background
  ) -> some View {
    if #available(iOS 17.0, *) {
      containerBackground(for: .widget, content: background)
    } else {
      ZStack {
        background()
        self
      }
    }
  }
}
