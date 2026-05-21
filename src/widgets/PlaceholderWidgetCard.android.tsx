import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { ColorProp } from "react-native-android-widget";
import { widgetPickerUri } from "./widgetLinks";
import { WIDGET_PLACEHOLDER_SNAPSHOT } from "./widgetSnapshot";

const WHITE: ColorProp = "#FFFFFF";
const MUTED: ColorProp = "#AEAEB2";

type Props = {
  widgetId: number;
};

export function PlaceholderWidgetCard({ widgetId }: Props): React.JSX.Element {
  const { title, sinceUntil, backgroundColor } = WIDGET_PLACEHOLDER_SNAPSHOT;

  return (
    <FlexWidget
      style={{
        width: "match_parent",
        height: "match_parent",
        backgroundColor: backgroundColor as ColorProp,
        padding: 14,
        justifyContent: "center",
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: widgetPickerUri(widgetId) }}
    >
      <FlexWidget style={{ width: "match_parent", flexDirection: "column" }}>
        <TextWidget
          text={title}
          style={{ fontSize: 14, fontWeight: "700", color: WHITE }}
          maxLines={2}
          truncate="END"
        />
        <TextWidget
          text={sinceUntil}
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: MUTED,
            marginTop: 8,
          }}
          maxLines={2}
          truncate="END"
        />
      </FlexWidget>
    </FlexWidget>
  );
}
