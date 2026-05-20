import React from "react";
import { Platform, ScrollView, type ScrollViewProps } from "react-native";

type Props = ScrollViewProps & {
  /** Use `"handled"` when the scroll area has tappable rows while a field is focused. */
  persistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
};

/** ScrollView that dismisses the keyboard on drag and on taps outside inputs. */
export function KeyboardDismissScrollView({
  persistTaps = "never",
  keyboardDismissMode,
  ...props
}: Props) {
  return (
    <ScrollView
      keyboardShouldPersistTaps={persistTaps}
      keyboardDismissMode={
        keyboardDismissMode ??
        (Platform.OS === "ios" ? "interactive" : "on-drag")
      }
      {...props}
    />
  );
}
