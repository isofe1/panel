export interface Genre {
  genre: string; // The genre name/identifier (e.g., "Romance")
  backdrop: string; // The backdrop image URL (e.g., "https://...")
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
