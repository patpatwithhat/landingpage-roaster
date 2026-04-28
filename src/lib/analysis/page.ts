import { MAX_HTML_CHARS } from "./config";

const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
  "utm_campaign",
  "utm_content",
  "utm_id",
  "utm_medium",
  "utm_source",
  "utm_term",
]);

function canonicalizeUrl(url: URL) {
  url.hash = "";
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();

  if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) {
    url.port = "";
  }

  const nextParams = [...url.searchParams.entries()]
    .filter(([key, value]) => value.trim() && !TRACKING_PARAMS.has(key.toLowerCase()))
    .sort(([left], [right]) => left.localeCompare(right));

  url.search = "";
  for (const [key, value] of nextParams) {
    url.searchParams.append(key, value);
  }

  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  }

  return url;
}

export function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Please enter a URL.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = canonicalizeUrl(new URL(withProtocol));

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  return url;
}

export function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractTitle(html: string) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
}

export function extractMetaDescription(html: string) {
  return (
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i)?.[1]?.trim() ??
    html.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i)?.[1]?.trim() ??
    ""
  );
}

export function extractHeadings(html: string) {
  return Array.from(html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi))
    .map(([, level, content]) => `h${level}: ${stripHtml(content)}`)
    .filter(Boolean)
    .slice(0, 12);
}

export async function fetchPage(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "LandingpageRoaster/0.1 (+https://roaster.patpatwithhat.xyz)",
      accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch the page (${response.status}).`);
  }

  const html = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/html")) {
    throw new Error("The URL did not return an HTML page.");
  }

  return html.slice(0, MAX_HTML_CHARS);
}

export function buildUserPrompt(input: {
  url: URL;
  modeLabel: string;
  analysisInstructions: string[];
  title: string;
  metaDescription: string;
  headings: string[];
  pageText: string;
}) {
  return [
    `URL: ${input.url.toString()}`,
    `Domain: ${input.url.hostname}`,
    `Analysis mode: ${input.modeLabel}`,
    `Analysis instructions: ${input.analysisInstructions.join(" ")}`,
    `Title: ${input.title || "(none)"}`,
    `Meta description: ${input.metaDescription || "(none)"}`,
    `Headings: ${input.headings.length ? input.headings.join(" | ") : "(none)"}`,
    `Visible text excerpt: ${input.pageText || "(none)"}`,
    "Analyze this landing page. Keep the diagnostic layer neutral and reusable for future prompt tuning. Then present the output in the requested tone.",
  ].join("\n\n");
}
