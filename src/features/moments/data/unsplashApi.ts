/**
 * Unsplash JSON API — https://unsplash.com/documentation
 * Public actions use: Authorization: Client-ID YOUR_ACCESS_KEY
 */

const API_ROOT = "https://api.unsplash.com";

/** Registered app slug — used in Unsplash referral links (API attribution guideline). */
export const UNSPLASH_UTM_SOURCE = "time-keeper";

const UNSPLASH_HOME = "https://unsplash.com/";

/** Append required `utm_source` / `utm_medium` to Unsplash and photographer profile links. */
export function withUnsplashReferral(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("utm_source", UNSPLASH_UTM_SOURCE);
    parsed.searchParams.set("utm_medium", "referral");
    return parsed.toString();
  } catch {
    return url;
  }
}

export function unsplashHomeUrl(): string {
  return withUnsplashReferral(UNSPLASH_HOME);
}

export type UnsplashPhoto = {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    html: string;
    download_location?: string;
  };
  user: {
    name: string;
    username: string;
    links?: { html?: string };
  };
};

export type SearchPhotosResponse = {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
};

function getAccessKey(): string | undefined {
  const k = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  return typeof k === "string" && k.trim().length > 0 ? k.trim() : undefined;
}

async function parseJsonErrors(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { errors?: string[] };
    if (Array.isArray(body.errors) && body.errors.length > 0) {
      return body.errors.join(", ");
    }
  } catch {
    /* ignore */
  }
  return res.statusText || `HTTP ${res.status}`;
}

async function unsplashFetch<T>(
  pathWithQuery: string,
  accessKey: string,
): Promise<T> {
  const url = `${API_ROOT}${pathWithQuery}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Version": "v1",
      Authorization: `Client-ID ${accessKey}`,
    },
  });
  if (!res.ok) {
    throw new Error(await parseJsonErrors(res));
  }
  return res.json() as Promise<T>;
}

/** Access key from `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY` (see Unsplash docs — Public auth). */
export function getUnsplashAccessKey(): string | undefined {
  return getAccessKey();
}

/**
 * GET /search/photos — https://unsplash.com/documentation#search-photos
 */
export async function searchPhotos(params: {
  accessKey: string;
  query: string;
  page?: number;
  perPage?: number;
  orientation?: "landscape" | "portrait" | "squarish";
  contentFilter?: "low" | "high";
}): Promise<SearchPhotosResponse> {
  const {
    accessKey,
    query,
    page = 1,
    perPage = 30,
    orientation,
    contentFilter = "high",
  } = params;
  const q = new URLSearchParams();
  q.set("query", query.trim() || "nature");
  q.set("page", String(page));
  q.set("per_page", String(Math.min(30, Math.max(1, perPage))));
  q.set("content_filter", contentFilter);
  if (orientation) q.set("orientation", orientation);

  return unsplashFetch<SearchPhotosResponse>(
    `/search/photos?${q.toString()}`,
    accessKey,
  );
}

/**
 * GET /photos/:id/download — fire when the user downloads / selects a photo for use.
 * https://unsplash.com/documentation#track-a-photo-download
 */
export async function trackPhotoDownload(
  accessKey: string,
  photoId: string,
): Promise<void> {
  await unsplashFetch<{ url?: string }>(
    `/photos/${encodeURIComponent(photoId)}/download`,
    accessKey,
  );
}
