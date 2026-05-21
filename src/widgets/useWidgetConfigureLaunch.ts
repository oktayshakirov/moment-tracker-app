import { useCallback, useEffect, useState } from "react";
import { Linking, Platform } from "react-native";
import { getWidgetMomentId } from "./widgetBindingStore";
import {
  IOS_WIDGET_INSTANCE_ID,
  isWidgetConfigureUrl,
  parseWidgetPickerWidgetId,
} from "./widgetLinks";

type ConfigureLaunch = {
  active: boolean;
  widgetId: number;
  dismiss: () => void;
};

/**
 * Opens widget configure UI from widget deep links (Android).
 * iOS uses native Edit Widget — placeholder does not deep-link into the app.
 */
export function useWidgetConfigureLaunch(): ConfigureLaunch {
  const [active, setActive] = useState(false);
  const [widgetId, setWidgetId] = useState(IOS_WIDGET_INSTANCE_ID);

  const openConfigure = useCallback((url: string) => {
    setWidgetId(parseWidgetPickerWidgetId(url));
    setActive(true);
  }, []);

  const dismiss = useCallback(() => setActive(false), []);

  useEffect(() => {
    if (Platform.OS === "ios") {
      return;
    }

    let cancelled = false;

    void (async () => {
      const initial = await Linking.getInitialURL();
      if (cancelled || !isWidgetConfigureUrl(initial)) return;

      const id = parseWidgetPickerWidgetId(initial ?? "");
      const bound = await getWidgetMomentId(id);
      if (bound) {
        return;
      }

      if (!cancelled) openConfigure(initial ?? "");
    })();

    const sub = Linking.addEventListener("url", (event) => {
      if (isWidgetConfigureUrl(event.url)) {
        openConfigure(event.url);
      }
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [openConfigure]);

  return { active, widgetId, dismiss };
}
