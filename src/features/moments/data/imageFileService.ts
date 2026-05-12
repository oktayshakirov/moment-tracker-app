import * as FileSystem from 'expo-file-system/legacy';
import { createId } from '@/shared/lib/ids';

const SUBDIR = 'moment-images';

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
  return dest;
}
