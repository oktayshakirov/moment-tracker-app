import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import type { WidgetConfigurationScreenProps } from "react-native-android-widget";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MomentRepository } from "@/features/moments/data/momentRepository";
import { openAppDatabase } from "@/shared/persistence/db";
import { ThemeProvider } from "@/shared/theme/ThemeContext";
import { bindWidgetToMoment } from "./syncWidgets";
import { WidgetMomentPickerContent } from "./WidgetMomentPickerContent";
import { WidgetSlotGate } from "./WidgetSlotGate";

/** Android long-press “Configure” entry — same picker as tapping an unconfigured widget. */
export function WidgetConfigurationEntry({
  widgetInfo,
  setResult,
}: WidgetConfigurationScreenProps) {
  const [moments, setMoments] = useState<MomentRepository | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const db = await openAppDatabase();
      if (cancelled) return;
      setMoments(new MomentRepository(db));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelect = useCallback(
    async (momentId: string) => {
      if (!moments) return;
      await bindWidgetToMoment(moments, widgetInfo.widgetId, momentId);
      setResult("ok");
    },
    [moments, setResult, widgetInfo.widgetId],
  );

  if (!moments) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <WidgetSlotGate
          widgetId={widgetInfo.widgetId}
          onCancel={() => setResult("cancel")}
        >
          <WidgetMomentPickerContent
            moments={moments}
            onSelect={onSelect}
            onCancel={() => setResult("cancel")}
            title="Add to widget"
            subtitle="Choose which moment this widget should show."
          />
        </WidgetSlotGate>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
