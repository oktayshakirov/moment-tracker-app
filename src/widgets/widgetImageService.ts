import { Platform } from "react-native";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import type { Moment } from "@/features/moments/domain/moment";
import { resolveMomentImageUri } from "@/features/moments/data/imageFileService";
import { setWidgetImageOnIos, removeWidgetImageOnIos } from "./iosWidgetBridge";

/**
 * Widgets can't read the app's full-res photos directly:
 * - iOS runs the widget in a separate extension, so the image is copied into
 *   the App Group container (via the native bridge) and referenced by name.
 * - Android's ImageWidget only accepts http(s)/data URIs, so the image is
 *   embedded as a base64 data URI.
 *
 * Images are downscaled first to stay well under WidgetKit's ~30MB budget.
 */
const TARGET_WIDTH = 400;

export type WidgetImageRefs = {
  /** iOS: filename of the image inside the App Group container. */
  backgroundImageName: string | null;
  /** Android: a `data:image/jpeg;base64,…` URI for ImageWidget. */
  backgroundImageUri: string | null;
  /** Android: width/height of the image, so it can be cover-cropped to the widget. */
  backgroundImageAspect: number | null;
};

const NO_IMAGE: WidgetImageRefs = {
  backgroundImageName: null,
  backgroundImageUri: null,
  backgroundImageAspect: null,
};

function safeName(momentId: string): string {
  return `${momentId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jpg`;
}

/** Build (or clear) the widget background image for a moment. */
export async function prepareWidgetImage(
  moment: Moment,
): Promise<WidgetImageRefs> {
  const bg = moment.backgroundValue;
  if (bg.kind !== "image") {
    await removeWidgetImage(moment.id);
    return NO_IMAGE;
  }

  try {
    const result = await manipulateAsync(
      resolveMomentImageUri(bg.uri),
      [{ resize: { width: TARGET_WIDTH } }],
      {
        compress: 0.8,
        format: SaveFormat.JPEG,
        base64: Platform.OS === "android",
      },
    );

    if (Platform.OS === "ios") {
      const name = safeName(moment.id);
      setWidgetImageOnIos(moment.id, result.uri.replace(/^file:\/\//, ""), name);
      return {
        backgroundImageName: name,
        backgroundImageUri: null,
        backgroundImageAspect: null,
      };
    }

    if (Platform.OS === "android" && result.base64) {
      return {
        backgroundImageName: null,
        backgroundImageUri: `data:image/jpeg;base64,${result.base64}`,
        backgroundImageAspect:
          result.height > 0 ? result.width / result.height : null,
      };
    }
  } catch {
    return NO_IMAGE;
  }

  return NO_IMAGE;
}

/** Remove any widget background image associated with a moment. */
export async function removeWidgetImage(momentId: string): Promise<void> {
  if (Platform.OS === "ios") {
    removeWidgetImageOnIos(momentId);
  }
  // Android stores nothing on disk — the data URI lives only in the snapshot.
}
