import { NativeModules, Platform } from "react-native";

type WidgetSnapshotBridgeModule = {
  setSnapshotForMoment: (momentId: string, json: string) => void;
  removeSnapshotForMoment: (momentId: string) => void;
  setCatalogJson: (json: string) => void;
  reloadTimelines: () => void;
};

function getBridge(): WidgetSnapshotBridgeModule | null {
  const bridge = NativeModules.WidgetSnapshotBridge as
    | WidgetSnapshotBridgeModule
    | undefined;
  if (
    bridge &&
    typeof bridge.setSnapshotForMoment === "function" &&
    typeof bridge.removeSnapshotForMoment === "function" &&
    typeof bridge.setCatalogJson === "function" &&
    typeof bridge.reloadTimelines === "function"
  ) {
    return bridge;
  }
  return null;
}

function warnMissingBridge(): void {
  if (__DEV__) {
    console.warn(
      "[WidgetSnapshotBridge] Native module missing — rebuild the iOS app (yarn ios).",
    );
  }
}

export function pushSnapshotToIos(momentId: string, json: string): void {
  if (Platform.OS !== "ios") return;
  const bridge = getBridge();
  if (!bridge) {
    warnMissingBridge();
    return;
  }
  bridge.setSnapshotForMoment(momentId, json);
}

export function removeSnapshotOnIos(momentId: string): void {
  if (Platform.OS !== "ios") return;
  const bridge = getBridge();
  if (!bridge) return;
  bridge.removeSnapshotForMoment(momentId);
}

export function pushCatalogToIos(json: string): void {
  if (Platform.OS !== "ios") return;
  const bridge = getBridge();
  if (!bridge) return;
  bridge.setCatalogJson(json);
}

export function reloadIosWidgetTimelines(): void {
  if (Platform.OS !== "ios") return;
  const bridge = getBridge();
  if (!bridge) return;
  bridge.reloadTimelines();
}
