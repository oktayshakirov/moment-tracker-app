import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { ColorProp } from "react-native-android-widget";
import { momentDetailUri } from "./widgetLinks";
import type { WidgetSnapshot } from "./widgetSnapshot";

const WHITE: ColorProp = "#FFFFFF";
const SUB: ColorProp = "#EBEBEB";
const MUTED: ColorProp = "#BFBFBF";

type Props = {
  snapshot: WidgetSnapshot;
  momentId: string;
};

export function PreviewWidgetCard({
  snapshot,
  momentId,
}: Props): React.JSX.Element {
  const { title, primary, subLabel, sinceUntil, backgroundColor } = snapshot;

  return (
    <FlexWidget
      style={{
        width: "match_parent",
        height: "match_parent",
        backgroundColor: backgroundColor as ColorProp,
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
}
