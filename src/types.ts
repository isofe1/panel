export interface Genre {
  name: string;        // The genre or keyword name
  type: string;        // The category classification (e.g. "Genre" or "Keyword")
  mv_id: number | null; // TMDB Movie Genre/Keyword ID (nullable)
  tv_id: number | null; // TMDB TV Genre/Keyword ID (nullable)
  bg_url: string;      // The background backdrop image URL
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  path: string;
  branch: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface LocalSnapshot {
  id: string;
  name: string;
  timestamp: string;
  genresCount: number;
  data: Genre[];
}

export interface PinnedItem {
  drama_id: string;
  position: number; // 1-indexed
  drama?: {
    slug: string;
    title: string;
    backdrop_url: string;
    poster_url?: string;
    rating: number;
    year: number;
    type: "tv" | "movie";
    country: string;
    synopsis?: string;
  };
}

export interface HeroConfig {
  mode: "AUTO" | "MANUAL" | "HYBRID";
  max_items: number;
  auto_source: "popular" | "trending" | "latest";
  pinned_items: PinnedItem[];
}

export interface SystemStats {
  success: boolean;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  nodeVersion: string;
  platform: string;
  githubConfigured: boolean;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
}
