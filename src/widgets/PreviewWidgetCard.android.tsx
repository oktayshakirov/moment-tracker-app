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

const WHITE: ColorProp = "#FFFFFF";
const SUB: ColorProp = "#EBEBEB";
const MUTED: ColorProp = "#BFBFBF";
const SCRIM: ColorProp = "#00000059"; // ~35% black, matches the in-app card

type Props = {
  snapshot: WidgetSnapshot;
  momentId: string;
};

export function PreviewWidgetCard({
  snapshot,
  momentId,
}: Props): React.JSX.Element {
  const { title, primary, subLabel, sinceUntil, backgroundColor } = snapshot;
  const imageUri = snapshot.backgroundImageUri;

  const content = (
    <FlexWidget
      style={{
        width: "match_parent",
        height: "match_parent",
        padding: 14,
        justifyContent: "space-between",
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: momentDetailUri(momentId) }}
    >
      <FlexWidget style={{ width: "match_parent", flexDirection: "column" }}>
        <TextWidget
          text={title}
          style={{ fontSize: 14, fontWeight: "700", color: WHITE }}
          maxLines={2}
          truncate="END"
        />
        <FlexWidget
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            marginTop: 8,
          }}
        >
          <TextWidget
            text={primary}
            style={{ fontSize: 28, fontWeight: "800", color: WHITE }}
            maxLines={1}
          />
          {subLabel ? (
            <TextWidget
              text={subLabel}
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: SUB,
                marginLeft: 6,
              }}
              maxLines={1}
            />
          ) : null}
        </FlexWidget>
        <TextWidget
          text={sinceUntil}
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: MUTED,
            marginTop: 6,
          }}
          maxLines={1}
        />
      </FlexWidget>
    </FlexWidget>
  );

  // Solid-color background: single flex container.
  if (!imageUri) {
    return (
      <FlexWidget
        style={{
          width: "match_parent",
          height: "match_parent",
          backgroundColor: backgroundColor as ColorProp,
        }}
      >
        {content}
      </FlexWidget>
    );
  }

  // Image background: photo, dark scrim, then content, stacked.
  return (
    <OverlapWidget
      style={{
        width: "match_parent",
        height: "match_parent",
        overflow: "hidden",
      }}
    >
      <ImageWidget
        image={imageUri as `data:image${string}`}
        imageWidth={400}
        imageHeight={400}
        style={{ width: "match_parent", height: "match_parent" }}
      />
      <FlexWidget
        style={{
          width: "match_parent",
          height: "match_parent",
          backgroundColor: SCRIM,
        }}
      />
      {content}
    </OverlapWidget>
  );
}
