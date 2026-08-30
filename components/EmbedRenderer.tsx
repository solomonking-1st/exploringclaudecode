"use client";

import { useEffect, useRef } from "react";

// Platform embed scripts scan the DOM for their own markup (TikTok's
// blockquote.tiktok-embed, Instagram's blockquote.instagram-media, Facebook's
// fb-post/fb-video divs) and hydrate it into an iframe. A <script> tag inside
// HTML set via dangerouslySetInnerHTML never executes, so we strip it out and
// inject a fresh <script> element ourselves on every mount — safe to run
// repeatedly, since each platform's script only touches unprocessed markup.
//
// Verified working end-to-end against TikTok's oEmbed response. Instagram and
// Facebook follow the same documented pattern but are untested here, since
// fetchMetaEmbed() never returns real data until META_ACCESS_TOKEN is set
// (see lib/save-pipeline.ts) — there's simply nothing to render yet.
const PLATFORM_SCRIPTS: Record<string, string> = {
  TIKTOK: "https://www.tiktok.com/embed.js",
  INSTAGRAM: "https://www.instagram.com/embed.js",
  FACEBOOK: "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v19.0",
};

function stripScriptTags(html: string): string {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
}

export default function EmbedRenderer({
  html,
  platform,
}: {
  html: string;
  platform: "TIKTOK" | "INSTAGRAM" | "FACEBOOK";
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const src = PLATFORM_SCRIPTS[platform];
    if (!src) return;

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, platform]);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: stripScriptTags(html) }} />;
}
