import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { createId } from '@/shared/lib/ids';

const SUBDIR = 'moment-images';

/** Longest edge used when embedding an image in an export, to keep files small. */
const EXPORT_MAX_WIDTH = 1080;

function baseDir(): string {
  const root = FileSystem.documentDirectory;
  if (!root) throw new Error('documentDirectory unavailable');
  return `${root}${SUBDIR}`;
}

export async function ensureMomentImageDir(): Promise<string> {
  const dir = baseDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/**
 * Reduce any stored image reference to a bare filename. Handles new-style
 * relative names as well as legacy absolute `file://…/moment-images/<name>`
 * paths, whose container UUID changes on every reinstall.
 */
export function momentImageFileName(stored: string): string {
  const marker = `${SUBDIR}/`;
  const idx = stored.lastIndexOf(marker);
  if (idx >= 0) return stored.slice(idx + marker.length);
  return stored.replace(/^.*\//, '');
}

/**
 * Turn a stored image reference into an absolute file URI against the *current*
 * app container. Rebuilding the path on each launch is what lets images survive
 * reinstalls and container-UUID changes (old absolute paths break otherwise).
 */
export function resolveMomentImageUri(stored: string): string {
  if (/^(https?|data):/i.test(stored)) return stored;
  return `${baseDir()}/${momentImageFileName(stored)}`;
}

export async function copyImageToAppStorage(sourceUri: string): Promise<string> {
  const dir = await ensureMomentImageDir();
  const ext = sourceUri.split('.').pop()?.split('?')[0];
  const safeExt = ext && ext.length <= 5 ? ext : 'jpg';
  const name = `${createId()}.${safeExt}`;
  const dest = `${dir}/${name}`;
  if (/^https?:\/\//i.test(sourceUri)) {
    await FileSystem.downloadAsync(sourceUri, dest);
  } else {
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
  }
  // Store the filename only; the absolute path is rebuilt on read.
  return name;
}

/**
 * Write image bytes carried inside an export back into app storage and return
 * the stored filename. Used when importing moments on a new device.
 */
export async function writeImportedImage(
  base64: string,
  ext = 'jpg',
): Promise<string> {
  const dir = await ensureMomentImageDir();
  const safeExt = ext && ext.length <= 5 ? ext : 'jpg';
  const name = `${createId()}.${safeExt}`;
  const dest = `${dir}/${name}`;
  await FileSystem.writeAsStringAsync(dest, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return name;
}

/**
 * Read a moment's image (Unsplash or local) and return it downscaled as base64
 * so it can be embedded in an export and restored on another device. Returns
 * null when the file can't be read (e.g. it was already lost).
 */
export async function encodeMomentImageForExport(
  stored: string,
): Promise<{ data: string; mime: string } | null> {
  try {
    const uri = resolveMomentImageUri(stored);
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: EXPORT_MAX_WIDTH } }],
      { compress: 0.8, format: SaveFormat.JPEG, base64: true },
    );
    if (!result.base64) return null;
    return { data: result.base64, mime: 'image/jpeg' };
  } catch {
    return null;
  }
}
