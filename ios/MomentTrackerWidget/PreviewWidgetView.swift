import SwiftUI
import UIKit
import WidgetKit

struct PreviewWidgetView: View {
  let entry: PreviewEntry

  @Environment(\.widgetFamily) private var family

  private var accent: Color {
    Color(hex: entry.backgroundColor) ?? Color(red: 28 / 255, green: 33 / 255, blue: 39 / 255)
  }

  /// Downscaled background photo from the App Group container, if any.
  private var backgroundImage: UIImage? {
    guard
      let name = entry.backgroundImageName,
      !name.isEmpty,
      let url = WidgetSnapshotSharedStorage.imageFileURL(name: name)
    else {
      return nil
    }
    return UIImage(contentsOfFile: url.path)
  }

  /// Over a photo, always use white text on a dark scrim.
  private var useDarkText: Bool {
    backgroundImage == nil && Color.isLight(hex: entry.backgroundColor)
  }

  private func fg(_ opacity: Double) -> Color {
    useDarkText
      ? Color.black.opacity(opacity)
      : Color.white.opacity(opacity)
  }

  var body: some View {
    Group {
      if entry.locked {
        lockedContent
      } else if family == .systemMedium && entry.configured && !entry.others.isEmpty {
        mediumContent
      } else if entry.configured, let url = entry.widgetURL {
        Link(destination: url) {
          widgetContent
        }
      } else {
        widgetContent
      }
    }
    .widgetContainerBackground {
      if entry.locked {
        accent
      } else if let image = backgroundImage {
        ZStack {
          Image(uiImage: image)
            .resizable()
            .scaledToFill()
          // Dark scrim so white text stays readable over any photo.
          Color.black.opacity(0.35)
        }
      } else {
        accent
      }
    }
  }

  /// Shown when a free user exceeds the one-widget limit.
  private var lockedContent: some View {
    VStack(alignment: .leading, spacing: 6) {
      Image(systemName: "lock.fill")
        .font(.system(size: 20, weight: .bold))
        .foregroundStyle(fg(0.9))
      Spacer()
      Text("Pro feature")
        .font(.system(size: 17, weight: .black))
        .foregroundStyle(fg(1.0))
        .lineLimit(1)
        .minimumScaleFactor(0.6)
      Text("Upgrade in the app to use more than one widget.")
        .font(.system(size: 11, weight: .medium))
        .foregroundStyle(fg(0.7))
        .lineLimit(3)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .padding(14)
  }

  /// Medium family: configured moment on the left, "up next" rail on the right.
  private var mediumContent: some View {
    HStack(spacing: 0) {
      Group {
        if let url = entry.widgetURL {
          Link(destination: url) { widgetContent }
        } else {
          widgetContent
        }
      }
      .frame(maxWidth: .infinity)

      Rectangle()
        .fill(fg(0.15))
        .frame(width: 1)
        .padding(.vertical, 14)

      VStack(alignment: .leading, spacing: 6) {
        ForEach(entry.others, id: \.momentId) { other in
          secondaryRow(other)
            .frame(maxHeight: .infinity, alignment: .leading)
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
      .padding(14)
    }
  }

  private func secondaryRow(_ moment: SecondaryMomentEntry) -> some View {
    let content = VStack(alignment: .leading, spacing: 2) {
      Text(moment.title)
        .font(.system(size: 12, weight: .semibold))
        .foregroundStyle(fg(0.75))
        .lineLimit(1)
      HStack(alignment: .firstTextBaseline, spacing: 4) {
        Text(moment.primary)
          .font(.system(size: 20, weight: .black))
          .foregroundStyle(fg(1.0))
          .lineLimit(1)
          .minimumScaleFactor(0.6)
        if !moment.primaryUnit.isEmpty {
          Text(moment.primaryUnit.uppercased())
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(fg(0.85))
            .tracking(0.8)
            .lineLimit(1)
        }
      }
      Text(moment.sinceUntil)
        .font(.system(size: 9, weight: .bold))
        .foregroundStyle(fg(0.5))
        .textCase(.uppercase)
        .tracking(1.0)
        .lineLimit(1)
    }
    return Group {
      if let url = moment.widgetURL {
        Link(destination: url) { content }
      } else {
        content
      }
    }
  }

  private var widgetContent: some View {
    VStack(alignment: .leading, spacing: 0) {
      Text(entry.title)
        .font(.system(size: 13, weight: .semibold))
        .foregroundStyle(fg(0.75))
        .lineLimit(1)

      Spacer()

      if entry.configured {
        Text(entry.primary)
          .font(.system(size: 44, weight: .black))
          .foregroundStyle(fg(1.0))
          .minimumScaleFactor(0.4)
          .lineLimit(1)
        if !entry.primaryUnit.isEmpty {
          Text(entry.primaryUnit.uppercased())
            .font(.system(size: 13, weight: .bold))
            .foregroundStyle(fg(0.85))
            .tracking(1.0)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
            .padding(.top, 1)
        }

        if !entry.subLabel.isEmpty {
          Text(entry.subLabel)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(fg(0.65))
            .lineLimit(1)
            .padding(.top, 3)
        }
      }

      Text(entry.sinceUntil)
        .font(.system(size: 10, weight: .bold))
        .foregroundStyle(fg(0.5))
        .textCase(.uppercase)
        .tracking(1.2)
        .padding(.top, 8)
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

  /// W3C relative luminance — returns true when the color is light (luminance > 0.35).
  static func isLight(hex: String) -> Bool {
    var cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
    if cleaned.hasPrefix("#") { cleaned.removeFirst() }
    guard cleaned.count == 6 || cleaned.count == 8 else { return false }
    var value: UInt64 = 0
    guard Scanner(string: cleaned).scanHexInt64(&value) else { return false }

    let r = Double((value & 0xFF0000) >> 16) / 255
    let g = Double((value & 0x00FF00) >> 8) / 255
    let b = Double(value & 0x0000FF) / 255

    func linearise(_ c: Double) -> Double {
      c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4)
    }

    let luminance = 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b)
    return luminance > 0.35
  }
}
