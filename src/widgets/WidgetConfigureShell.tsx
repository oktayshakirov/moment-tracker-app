import React, { useCallback } from "react";
import { BackHandler, Platform } from "react-native";
import { useRepositories } from "@/app/database/AppDataProvider";
import { bindWidgetToMoment } from "./syncWidgets";
import { WidgetMomentPickerContent } from "./WidgetMomentPickerContent";

type Props = {
  widgetId: number;
  onDismiss: () => void;
};

/**
 * Widget-only flow: pick a moment, update the home screen widget, then dismiss.
 */
export function WidgetConfigureShell({ widgetId, onDismiss }: Props) {
  const { moments } = useRepositories();

  const finish = useCallback(() => {
    onDismiss();
    if (Platform.OS === "android") {
      BackHandler.exitApp();
    }
  }, [onDismiss]);

  const onSelect = useCallback(
    async (momentId: string) => {
      await bindWidgetToMoment(moments, widgetId, momentId);
      finish();
    },
    [finish, moments, widgetId],
  );

  return (
    <WidgetMomentPickerContent
      moments={moments}
      onSelect={onSelect}
      onCancel={finish}
      title="Add to widget"
      subtitle="Choose which moment this widget should show."
    />
  );
}
