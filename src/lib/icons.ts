import mingcuteIcons from "@iconify-json/mingcute/icons.json";
import { getIconData, iconToSVG, replaceIDs } from "@iconify/utils";

export const SEMANTIC_ICONS: Record<string, string> = {
  // Navigation & Theme
  sun: "sun-line",
  moon: "moon-line",
  menu: "menu-line",
  close: "close-line",
  home: "home-4-line",
  "chevron-down": "down-line",
  "chevron-right": "right-line",
  "arrow-right": "arrow-right-line",

  // Brand & Site
  pen: "pen-line",
  quill: "quill-pen-line",
  pulse: "heartbeat-line",

  // Actions & Links
  copy: "copy-line",
  check: "check-line",
  "external-link": "external-link-line",
  email: "mail-line",
  mail: "mail-line",
  github: "github-line",
  rss: "rss-line",

  // Callouts & Admonitions
  note: "notebook-line",
  notes: "notebook-line",
  info: "information-line",
  tip: "bulb-line",
  warning: "alert-line",
  caution: "alert-octagon-line",
  important: "notification-line",
  abstract: "file-info-line",
  question: "question-line",
  quote: "chat-4-line",

  // Blog & SWE Concepts
  blog: "book-5-line",
  post: "book-2-line",
  code: "code-line",
  terminal: "terminal-line",
  tag: "tag-2-line",
  tags: "tag-2-line",
  hashtag: "hashtag-line",
  time: "time-line",
  calendar: "calendar-line",
  publish: "calendar-line",
  "reading-time": "time-duration-line",
};

export interface ResolvedIcon {
  attributes: Record<string, string>;
  body: string;
}

const cache = new Map<string, ResolvedIcon>();

export function resolveIcon(name: string): ResolvedIcon {
  // Normalize icon name: accept semantic ("copy"), prefix ("mingcute:copy-line"), or direct ("copy-line")
  let iconId = SEMANTIC_ICONS[name] || name;
  if (iconId.startsWith("mingcute:")) {
    iconId = iconId.replace("mingcute:", "");
  }
  if (!iconId.endsWith("-line") && !iconId.endsWith("-fill")) {
    iconId = `${iconId}-line`;
  }

  const cached = cache.get(iconId);
  if (cached) {
    return {
      attributes: cached.attributes,
      body: replaceIDs(cached.body),
    };
  }

  const iconData = getIconData(mingcuteIcons, iconId);
  if (!iconData) {
    throw new Error(`[Icon] MingCute icon "${iconId}" not found (queried: "${name}")`);
  }

  const svg = iconToSVG(iconData, { height: "1em" });
  const resolved: ResolvedIcon = {
    attributes: svg.attributes,
    body: svg.body,
  };

  cache.set(iconId, resolved);
  return {
    attributes: resolved.attributes,
    body: replaceIDs(resolved.body),
  };
}
