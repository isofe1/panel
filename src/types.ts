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
