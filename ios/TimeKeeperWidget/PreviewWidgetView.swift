import SwiftUI
import WidgetKit

struct PreviewWidgetView: View {
  let entry: PreviewEntry

  private var accent: Color {
    Color(hex: entry.backgroundColor) ?? Color(red: 28 / 255, green: 33 / 255, blue: 39 / 255)
  }

  var body: some View {
    Group {
      if entry.configured, let url = entry.widgetURL {
        Link(destination: url) {
          widgetContent
        }
      } else {
        widgetContent
      }
    }
    .widgetContainerBackground {
      accent
    }
  }

  private var widgetContent: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(entry.title)
        .font(.system(size: 14, weight: .bold))
        .foregroundStyle(.white)
        .lineLimit(2)

      if entry.configured {
        HStack(alignment: .lastTextBaseline, spacing: 4) {
          Text(entry.primary)
            .font(.system(size: 28, weight: .heavy))
            .foregroundStyle(.white)
          if !entry.subLabel.isEmpty {
            Text(entry.subLabel)
              .font(.system(size: 12, weight: .semibold))
              .foregroundStyle(.white.opacity(0.92))
          }
        }
      }

      Text(entry.sinceUntil)
        .font(.system(size: 12, weight: .semibold))
        .foregroundStyle(.white.opacity(0.75))
        .textCase(entry.configured ? .uppercase : .none)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .padding(14)
  }
}

private extension Color {
  init?(hex: String) {
    var cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
    if cleaned.hasPrefix("#") {
      cleaned.removeFirst()
    }
    guard cleaned.count == 6 || cleaned.count == 8 else { return nil }

    var value: UInt64 = 0
    guard Scanner(string: cleaned).scanHexInt64(&value) else { return nil }

    let r, g, b, a: Double
    if cleaned.count == 8 {
      a = Double((value & 0xFF000000) >> 24) / 255
      r = Double((value & 0x00FF0000) >> 16) / 255
      g = Double((value & 0x0000FF00) >> 8) / 255
      b = Double(value & 0x000000FF) / 255
    } else {
      a = 1
      r = Double((value & 0xFF0000) >> 16) / 255
      g = Double((value & 0x00FF00) >> 8) / 255
      b = Double(value & 0x000000FF) / 255
    }

    self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
  }
}
