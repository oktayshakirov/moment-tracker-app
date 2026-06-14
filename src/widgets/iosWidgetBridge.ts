import { NativeModules, Platform } from "react-native";

type WidgetSnapshotBridgeModule = {
  setSnapshotForMoment: (momentId: string, json: string) => void;
  removeSnapshotForMoment: (momentId: string) => void;
  setCatalogJson: (json: string) => void;
  setImageForMoment: (momentId: string, sourcePath: string, name: string) => void;
  removeImageForMoment: (momentId: string) => void;
  reloadTimelines: () => void;
  setProState: (isPro: boolean) => void;
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

export function setWidgetImageOnIos(
  momentId: string,
  sourcePath: string,
  name: string,
): void {
  if (Platform.OS !== "ios") return;
  const bridge = getBridge();
  if (!bridge || typeof bridge.setImageForMoment !== "function") return;
  bridge.setImageForMoment(momentId, sourcePath, name);
}

export function removeWidgetImageOnIos(momentId: string): void {
  if (Platform.OS !== "ios") return;
  const bridge = getBridge();
  if (!bridge || typeof bridge.removeImageForMoment !== "function") return;
  bridge.removeImageForMoment(momentId);
}

export function reloadIosWidgetTimelines(): void {
  if (Platform.OS !== "ios") return;
  const bridge = getBridge();
  if (!bridge) return;
  bridge.reloadTimelines();
}

/**
 * Push the Pro entitlement to the widget extension so it can lock extra widgets
 * for free users. No-op off iOS or when the native module isn't present.
 */
export function setWidgetProStateOnIos(isPro: boolean): void {
  if (Platform.OS !== "ios") return;
  const bridge = getBridge();
  if (!bridge || typeof bridge.setProState !== "function") return;
  bridge.setProState(isPro);
}
