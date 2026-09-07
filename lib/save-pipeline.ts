export type SourcePlatform = "TIKTOK" | "INSTAGRAM" | "FACEBOOK";
export type FetchMethod = "EMBED" | "FAILED";

export interface SavePipelineResult {
  sourcePlatform: SourcePlatform;
  sourceUrl: string;
  fetchMethod: FetchMethod;
  embedHtml: string | null;
  thumbnailUrl: string | null;
  title: string | null;
}

// Strict allow-list of exact hostnames. Deliberately NOT a substring/`.includes()`
// check — "tiktok.com.evil.com" or "eviltiktok.com" must not match. This is the
// SSRF/scope control called out in the tech spec: only these platforms are
// supported, and no other host is ever accepted as a save source.
const HOST_TO_PLATFORM: Record<string, SourcePlatform> = {
  "tiktok.com": "TIKTOK",
  "www.tiktok.com": "TIKTOK",
  "vm.tiktok.com": "TIKTOK",
  "instagram.com": "INSTAGRAM",
  "www.instagram.com": "INSTAGRAM",
  "facebook.com": "FACEBOOK",
  "www.facebook.com": "FACEBOOK",
  "fb.watch": "FACEBOOK",
};

export class UnsupportedSourceUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedSourceUrlError";
  }
}

export function detectPlatform(rawUrl: string): { platform: SourcePlatform; url: URL } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsupportedSourceUrlError("That doesn't look like a valid URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new UnsupportedSourceUrlError("Only http(s) links are supported.");
  }

  const platform = HOST_TO_PLATFORM[url.hostname.toLowerCase()];
  if (!platform) {
    throw new UnsupportedSourceUrlError(
      "Sono only supports saving links from TikTok, Instagram, or Facebook right now."
    );
  }

  return { platform, url };
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// TikTok's oEmbed endpoint is public and requires no auth today. It is not an
// official, versioned API — see the tech spec's Platform Integration Notes —
// so this is a dependency to monitor, not a stable contract.
async function fetchTikTokEmbed(sourceUrl: string) {
  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(sourceUrl)}`;
  const res = await fetchWithTimeout(endpoint);
  if (!res || !res.ok) return null;

  try {
    const data = (await res.json()) as {
      html?: string;
      thumbnail_url?: string;
      title?: string;
    };
    if (!data.html) return null;
    return {
      embedHtml: data.html,
      thumbnailUrl: data.thumbnail_url ?? null,
      title: data.title ?? null,
    };
  } catch {
    return null;
  }
}

// Meta's oEmbed Read endpoints (for Instagram + Facebook) require a registered
// Meta Developer App with the oEmbed Read product enabled, and usually App
// Review, before they work beyond your own test accounts. That access has not
// been confirmed yet, so this deliberately makes zero network calls until
// META_ACCESS_TOKEN is set — no point burning a request we know will 401.
// Once access is confirmed, set META_ACCESS_TOKEN and this starts working
// without any other code changes.
async function fetchMetaEmbed(sourceUrl: string, platform: "INSTAGRAM" | "FACEBOOK") {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return null;

  const graphField = platform === "INSTAGRAM" ? "instagram_oembed" : "oembed_post";
  const endpoint = `https://graph.facebook.com/v19.0/${graphField}?url=${encodeURIComponent(
    sourceUrl
  )}&access_token=${encodeURIComponent(token)}`;

  const res = await fetchWithTimeout(endpoint);
  if (!res || !res.ok) return null;

  try {
    const data = (await res.json()) as {
      html?: string;
      thumbnail_url?: string;
      title?: string;
    };
    if (!data.html) return null;
    return {
      embedHtml: data.html,
      thumbnailUrl: data.thumbnail_url ?? null,
      title: data.title ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Step 1 only (embed via the platform's own oEmbed). The Step 2
 * download-and-rehost fallback from the tech spec is intentionally not
 * implemented yet — if the embed fails, the item is still saved
 * (fetchMethod=FAILED) with its source link and no in-app preview, rather
 * than silently dropping the save.
 */
export async function runSavePipeline(rawUrl: string): Promise<SavePipelineResult> {
  const { platform, url } = detectPlatform(rawUrl);
  const sourceUrl = url.toString();

  const embed =
    platform === "TIKTOK" ? await fetchTikTokEmbed(sourceUrl) : await fetchMetaEmbed(sourceUrl, platform);

  if (embed) {
    return {
      sourcePlatform: platform,
      sourceUrl,
      fetchMethod: "EMBED",
      embedHtml: embed.embedHtml,
      thumbnailUrl: embed.thumbnailUrl,
      title: embed.title,
    };
  }

  return {
    sourcePlatform: platform,
    sourceUrl,
    fetchMethod: "FAILED",
    embedHtml: null,
    thumbnailUrl: null,
    title: null,
  };
}
