import React from "react";
import {
  FlexWidget,
  ImageWidget,
  OverlapWidget,
  TextWidget,
} from "react-native-android-widget";
import type { ColorProp } from "react-native-android-widget";
import { momentDetailUri } from "./widgetLinks";
import type { WidgetSnapshot } from "./widgetSnapshot";

const PLACEHOLDER_BG = "#1C2127";
const SCRIM: ColorProp = "#00000059"; // ~35% black, matches the in-app card
const CARD_RADIUS = 24; // rounded corners, like the iOS widget

/** Foreground opacity → 8-bit alpha suffix (react-native-android-widget uses #RRGGBBAA). */
const ALPHA = {
  full: "FF",
  strong: "D9", // 0.85
  title: "BF", // 0.75
  sub: "A6", // 0.65
  faint: "80", // 0.5
} as const;

/**
 * W3C relative luminance > 0.35 → light background. Mirrors the iOS widget so
 * both platforms pick black vs white text the same way.
 */
function isLightColor(hex: string): boolean {
  const c = hex.trim().replace(/^#/, "");
  if (c.length !== 6 && c.length !== 8) return false;
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const lin = (v: number) =>
    v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.35;
}

type Props = {
  snapshot: WidgetSnapshot;
  momentId: string;
  /** Actual widget size (dp); the card renders as a centered square within it. */
  size?: { width: number; height: number };
};

export function PreviewWidgetCard({
  snapshot,
  momentId,
  size,
}: Props): React.JSX.Element {
  const { title, primary, primaryUnit, subLabel, sinceUntil, backgroundColor } =
    snapshot;
  const imageUri = snapshot.backgroundImageUri;

  // Home-screen grid cells aren't square, so to match the iOS widget we draw a
  // centered square (side = the smaller dimension) and leave the rest transparent.
  const wd = size?.width && size.width > 0 ? size.width : 160;
  const hd = size?.height && size.height > 0 ? size.height : 160;
  const side = Math.min(wd, hd);

  // Over a photo always use white text on the dark scrim; on a solid color pick
  // black or white for contrast — same rule as the iOS widget.
  const useDarkText = !imageUri && isLightColor(backgroundColor);
  const baseHex = useDarkText ? "000000" : "FFFFFF";
  const fg = (alpha: (typeof ALPHA)[keyof typeof ALPHA]): ColorProp =>
    `#${baseHex}${alpha}` as ColorProp;

  const content = (
    <FlexWidget
      style={{
        width: "match_parent",
        height: "match_parent",
        padding: 14,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: momentDetailUri(momentId) }}
    >
      {/* Title pinned to the top */}
      <TextWidget
        text={title}
        style={{ fontSize: 13, fontWeight: "600", color: fg(ALPHA.title) }}
        maxLines={1}
        truncate="END"
      />

      {/* Counter block pinned to the bottom */}
      <FlexWidget style={{ flexDirection: "column" }}>
        {primary ? (
          <TextWidget
            text={primary}
            style={{
              fontSize: 40,
              fontWeight: "900",
              color: fg(ALPHA.full),
              adjustsFontSizeToFit: true,
            }}
            maxLines={1}
          />
        ) : null}
        {primaryUnit ? (
          <TextWidget
            text={primaryUnit.toUpperCase()}
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: fg(ALPHA.strong),
              letterSpacing: 1,
            }}
            maxLines={1}
          />
        ) : null}
        {subLabel ? (
          <TextWidget
            text={subLabel}
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: fg(ALPHA.sub),
              marginTop: 3,
            }}
            maxLines={1}
          />
        ) : null}
        <TextWidget
          text={sinceUntil.toUpperCase()}
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: fg(ALPHA.faint),
            letterSpacing: 1,
            marginTop: 8,
          }}
          maxLines={1}
        />
      </FlexWidget>
    </FlexWidget>
  );

  let card: React.JSX.Element;
  if (!imageUri) {
    // Solid-color square card.
    card = (
      <FlexWidget
        style={{
          width: side,
          height: side,
          borderRadius: CARD_RADIUS,
          backgroundColor: (backgroundColor || PLACEHOLDER_BG) as ColorProp,
        }}
      >
        {content}
      </FlexWidget>
    );
  } else {
    // Image square card: cover-crop the photo at its true aspect ratio (size it
    // to cover the square and shift with negative margins; the FrameLayout clips
    // the overflow → centered crop, no distortion), then scrim + content.
    const aspect =
      snapshot.backgroundImageAspect && snapshot.backgroundImageAspect > 0
        ? snapshot.backgroundImageAspect
        : 1;
    const coverW = Math.round(Math.max(side, side * aspect));
    const coverH = Math.round(Math.max(side, side / aspect));
    const offsetX = Math.round((coverW - side) / 2);
    const offsetY = Math.round((coverH - side) / 2);
    card = (
      <OverlapWidget
        style={{
          width: side,
          height: side,
          borderRadius: CARD_RADIUS,
          overflow: "hidden",
        }}
      >
        <ImageWidget
          image={imageUri as `data:image${string}`}
          imageWidth={coverW}
          imageHeight={coverH}
          style={{
            width: coverW,
            height: coverH,
            marginLeft: -offsetX,
            marginTop: -offsetY,
          }}
        />
        <FlexWidget
          style={{ width: side, height: side, backgroundColor: SCRIM }}
        />
        {content}
      </OverlapWidget>
    );
  }

  // Center the square card within the (possibly non-square) widget cell.
  return (
    <FlexWidget
      style={{
        width: "match_parent",
        height: "match_parent",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {card}
    </FlexWidget>
  );
}
