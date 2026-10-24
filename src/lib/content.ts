import { getCollection, type CollectionEntry } from "astro:content";

export interface CleanPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  date?: Date;
  dateString: string;
  tags: string[];
  keywords: string[];
  readingTime: string;
  entry: CollectionEntry<"posts">;
}

export interface CleanPlan {
  id: string;
  slug: string;
  series: string;
  seriesTitle: string;
  dayNumber: number;
  title: string;
  description: string;
  date?: Date;
  dateString: string;
  tags: string[];
  readingTime: string;
  entry: CollectionEntry<"plans">;
}

export interface CleanNote {
  id: string;
  slug: string;
  category: string;
  subCategory?: string;
  title: string;
  description: string;
  date?: Date;
  dateString: string;
  tags: string[];
  readingTime: string;
  entry: CollectionEntry<"notes">;
}

export function cleanSlug(id: string): string {
  return id
    .replace(/\.md$/, "")
    .replace(/ - 已發[佈布]$/, "")
    .trim();
}

export function cleanTitle(rawTitle?: string, fallbackId?: string): string {
  if (rawTitle && rawTitle.trim()) {
    return rawTitle.trim().replace(/^['"]|['"]$/g, "");
  }
  if (!fallbackId) return "";
  const filename = fallbackId.split("/").pop() || fallbackId;
  return filename
    .replace(/\.md$/, "")
    .replace(/ - 已發[佈布]$/, "")
    .trim();
}

export function formatDate(date?: Date): string {
  if (!date || isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function extractExcerpt(body?: string, fallbackDescription?: string): string {
  if (fallbackDescription && fallbackDescription.trim()) {
    return fallbackDescription.trim();
  }
  if (!body) return "";

  // Strip frontmatter if present
  let clean = body.replace(/^---\r?\n[\s\S]*?\r?\n---/, "");

  // Strip HTML / comments
  clean = clean.replace(/<!--[\s\S]*?-->/g, "");

  // Strip markdown images and links
  clean = clean.replace(/!\[.*?\]\(.*?\)/g, "");
  clean = clean.replace(/\[(.*?)\]\(.*?\)/g, "$1");

  // Strip headings and code blocks
  clean = clean.replace(/```[\s\S]*?```/g, "");
  clean = clean.replace(/^#+\s+/gm, "");
  clean = clean.replace(/[*_`~>]/g, "");

  // Take first meaningful non-empty paragraph
  const paragraphs = clean
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith("!"))[0];

  if (!paragraphs) return "";

  if (paragraphs.length > 150) {
    return paragraphs.slice(0, 147) + "...";
  }
  return paragraphs;
}

export function calculateReadingTime(body?: string): string {
  if (!body) return "1 分鐘閱讀";
  // Count CJK characters and english words
  const cjk = (body.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (body.match(/[a-zA-Z0-9_-]+/g) || []).length;
  const total = cjk + englishWords;
  const minutes = Math.max(1, Math.ceil(total / 300));
  return `${minutes} 分鐘閱讀`;
}

export async function getAllBlogPosts(): Promise<CleanPost[]> {
  const rawPosts = await getCollection("posts");
  const posts: CleanPost[] = rawPosts.map((entry) => {
    const title = cleanTitle(entry.data.title, entry.id);
    const slug = entry.data.slug || cleanSlug(entry.id);
    const date = entry.data.date;
    const dateString = formatDate(date);
    const description = extractExcerpt(entry.body, entry.data.description);
    const tags = Array.isArray(entry.data.tags) ? entry.data.tags : [];
    const keywords = Array.isArray(entry.data.keywords) ? entry.data.keywords : [];
    const readingTime = calculateReadingTime(entry.body);

    return {
      id: entry.id,
      slug,
      title,
      description,
      date,
      dateString,
      tags,
      keywords,
      readingTime,
      entry,
    };
  });

  // Sort by date descending
  return posts.sort((a, b) => {
    const timeA = a.date ? a.date.getTime() : 0;
    const timeB = b.date ? b.date.getTime() : 0;
    return timeB - timeA;
  });
}

export const SERIES_META: Record<
  string,
  {
    title: string;
    description: string;
    status: string;
    role: string;
    github?: string;
    metrics?: string;
  }
> = {
  "cozy-chat": {
    title: "Cozy Chat",
    description:
      "以 WooTalk 為靈感的即時一對一匿名聊天室。涵蓋 WebSocket、Express、MongoDB、Monorepo 與單元測試 30 天全端實作。",
    status: "30 天挑戰完賽",
    role: "全端開發 / 架構",
    github: "https://github.com",
    metrics: "30 篇技術連載 · Socket.IO · MongoDB · Monorepo",
  },
  "boozer-cannon": {
    title: "Boozer Cannon",
    description:
      "以調酒推薦與微醺社交為主題的現代 Web 專案。從需求探索、AI 輔助決策、資料庫 Transaction 到部署維運的 30 天實戰記錄。",
    status: "30 天挑戰完賽",
    role: "全端開發 / AI 工作流",
    github: "https://github.com",
    metrics: "30 篇技術連載 · 需求探索 · AI 輔助 · 部署上線",
  },
};

export function extractDayNumber(str: string): number {
  const match = str.match(/Day[ -]?(\d+)/i);
  return match ? parseInt(match[1], 10) : 999;
}

export async function getAllPlans(): Promise<CleanPlan[]> {
  const rawPlans = await getCollection("plans");
  const plans: CleanPlan[] = rawPlans.map((entry) => {
    const parts = entry.id.split("/");
    const series = parts[0] || "misc";
    const seriesMeta = SERIES_META[series];
    const seriesTitle = seriesMeta ? seriesMeta.title : series;
    const dayNumber = extractDayNumber(entry.id);
    const title = cleanTitle(entry.data.title, entry.id);
    const slug = cleanSlug(entry.id);
    const date = entry.data.date;
    const dateString = formatDate(date);
    const description = extractExcerpt(entry.body, entry.data.description);
    const tags = Array.isArray(entry.data.tags) ? entry.data.tags : [];
    const readingTime = calculateReadingTime(entry.body);

    return {
      id: entry.id,
      slug,
      series,
      seriesTitle,
      dayNumber,
      title,
      description,
      date,
      dateString,
      tags,
      readingTime,
      entry,
    };
  });

  // Sort by series, then by day number ascending
  return plans.sort((a, b) => {
    if (a.series !== b.series) {
      return a.series.localeCompare(b.series);
    }
    return a.dayNumber - b.dayNumber;
  });
}

export function extractNoteOrder(str: string): number {
  const match = str.match(/^(\d+)[.-]/);
  return match ? parseInt(match[1], 10) : 999;
}

export async function getAllNotes(): Promise<CleanNote[]> {
  const rawNotes = await getCollection("notes");
  const notes: CleanNote[] = rawNotes.map((entry) => {
    const parts = entry.id.split("/");
    const category = parts[0] || "General";
    const subCategory = parts.length > 2 ? parts[1] : undefined;
    const title = cleanTitle(entry.data.title, entry.id);
    const slug = cleanSlug(entry.id);
    const date = entry.data.date;
    const dateString = formatDate(date);
    const description = extractExcerpt(entry.body, entry.data.description);
    const tags = Array.isArray(entry.data.tags) ? entry.data.tags : [];
    const readingTime = calculateReadingTime(entry.body);

    return {
      id: entry.id,
      slug,
      category,
      subCategory,
      title,
      description,
      date,
      dateString,
      tags,
      readingTime,
      entry,
    };
  });

  // Sort by category, then by natural order or filename
  return notes.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    const orderA = extractNoteOrder(a.id.split("/").pop() || "");
    const orderB = extractNoteOrder(b.id.split("/").pop() || "");
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.title.localeCompare(b.title);
  });
}
