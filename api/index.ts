import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Google Gen AI safely
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini client successfully initialized.");
  } catch (error) {
    console.error("Error initializing GoogleGenAI client:", error);
  }
} else {
  console.log("GEMINI_API_KEY not configured. Running AI Assistant in simulation/educational fallback mode.");
}

const DEFAULT_GENRES = [
  {
    "name": "Romance",
    "type": "Genre",
    "mv_id": 10749,
    "tv_id": 10766,
    "bg_url": "https://image.tmdb.org/t/p/w185/lq0YqJuffMuZhoKTiC5xDqvtCSn.jpg"
  },
  {
    "name": "Fantasy",
    "type": "Genre",
    "mv_id": 14,
    "tv_id": 10765,
    "bg_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200"
  },
  {
    "name": "Mystery",
    "type": "Genre",
    "mv_id": 9648,
    "tv_id": 80,
    "bg_url": "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200"
  },
  {
    "name": "Comedy",
    "type": "Genre",
    "mv_id": 35,
    "tv_id": 35,
    "bg_url": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200"
  },
  {
    "name": "Action",
    "type": "Genre",
    "mv_id": 28,
    "tv_id": 10759,
    "bg_url": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1200"
  },
  {
    "name": "Thriller",
    "type": "Genre",
    "mv_id": 53,
    "tv_id": null,
    "bg_url": "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=1200"
  },
  {
    "name": "Sci-Fi",
    "type": "Genre",
    "mv_id": 878,
    "tv_id": 10765,
    "bg_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200"
  }
];

const DEFAULT_HERO_CONFIG = {
  "hero_config": {
    "mode": "HYBRID",
    "max_items": 6,
    "auto_source": "popular",
    "pinned_items": [
      {
        "drama_id": "drama_123_id",
        "position": 1
      },
      {
        "drama_id": "drama_456_id",
        "position": 3
      }
    ]
  }
};

const app = express();
app.use(express.json({ limit: "5mb" }));

// Server-side in-memory cache for resolved TMDB details to protect Gemini free-tier rate limits
const tmdbDetailsCache: Record<string, any> = {};
const inFlightDetails: Record<string, Promise<any>> = {};

// --- API Routes ---

// Middleware to verify the admin password
const verifyAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const password = req.headers["x-admin-password"] || req.body.password;
  const correctPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (password !== correctPassword) {
    return res.status(401).json({ success: false, error: "Unauthorized: Invalid or missing administrator password." });
  }
  next();
};

// Login verification
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  const correctPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (password === correctPassword) {
    return res.json({ success: true, message: "Authentication successful." });
  } else {
    return res.status(401).json({ success: false, error: "Incorrect administrator password. Access denied." });
  }
});

// System health and stats route
app.get("/api/system/stats", (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    success: true,
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memory.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100, // MB
    },
    nodeVersion: process.version,
    platform: process.platform,
    githubConfigured: !!(process.env.GITHUB_OWNER && process.env.GITHUB_REPO && process.env.GITHUB_TOKEN),
    owner: process.env.GITHUB_OWNER || "Not Set",
    repo: process.env.GITHUB_REPO || "Not Set",
    branch: process.env.GITHUB_BRANCH || "main",
    filePath: process.env.GITHUB_FILE_PATH || "genres.json"
  });
});

// Public endpoint to fetch genres (no-auth, bypasses CDN cache, used by external/mobile clients)
app.get("/api/get-genres", async (req, res) => {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const filePath = process.env.GITHUB_FILE_PATH || "genres.json";
  const branch = process.env.GITHUB_BRANCH || "main";
  const githubToken = process.env.GITHUB_TOKEN;

  // Set headers to strictly disable caching
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const missing = [];
  if (!owner) missing.push("GITHUB_OWNER");
  if (!repo) missing.push("GITHUB_REPO");

  // Local fallback if GitHub secrets are missing
  if (missing.length > 0) {
    try {
      const localPath = path.join(process.cwd(), "genres.json");
      if (fs.existsSync(localPath)) {
        const fileContent = fs.readFileSync(localPath, "utf-8");
        return res.json(JSON.parse(fileContent));
      } else {
        return res.json(DEFAULT_GENRES);
      }
    } catch (localErr: any) {
      return res.status(500).json({ error: "Failed to load local fallback genres", details: String(localErr) });
    }
  }

  try {
    // Construct Raw GitHub content URL to fetch the freshest commits bypassing any intermediary CDN proxy
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}?v=${Date.now()}`;
    const headers: Record<string, string> = {
      "User-Agent": "Genres-Admin-Dashboard"
    };
    if (githubToken) {
      headers["Authorization"] = `token ${githubToken}`;
    }

    const r = await fetch(rawUrl, { 
      headers,
      cache: "no-store" 
    });

    if (!r.ok) {
      // If raw file doesn't exist yet but GitHub is configured, return local or default fallback
      const localPath = path.join(process.cwd(), "genres.json");
      if (fs.existsSync(localPath)) {
        const fileContent = fs.readFileSync(localPath, "utf-8");
        return res.json(JSON.parse(fileContent));
      }
      return res.json(DEFAULT_GENRES);
    }

    const json = await r.json();
    return res.json(json);
  } catch (err: any) {
    // Ultimate fallback if fetch fails
    try {
      const localPath = path.join(process.cwd(), "genres.json");
      if (fs.existsSync(localPath)) {
        const fileContent = fs.readFileSync(localPath, "utf-8");
        return res.json(JSON.parse(fileContent));
      }
    } catch (_) {}
    return res.status(500).json({ error: "Failed to load genres", details: String(err) });
  }
});

// --- Dynamic Hero Banner Endpoints ---

// Get Hero Config (Public, cache-busted, used by developer client app)
app.get("/api/get-hero-config", async (req, res) => {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const githubToken = process.env.GITHUB_TOKEN;
  const filePath = process.env.GITHUB_HERO_FILE_PATH || "hero_config.json";

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const missing = [];
  if (!owner) missing.push("GITHUB_OWNER");
  if (!repo) missing.push("GITHUB_REPO");

  // Local fallback if GitHub credentials are not configured
  if (missing.length > 0) {
    try {
      const localPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(localPath)) {
        const fileContent = fs.readFileSync(localPath, "utf-8");
        return res.json(JSON.parse(fileContent));
      } else {
        return res.json(DEFAULT_HERO_CONFIG);
      }
    } catch (localErr: any) {
      return res.status(500).json({ error: "Failed to load local fallback hero config", details: String(localErr) });
    }
  }

  try {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}?v=${Date.now()}`;
    const headers: Record<string, string> = {
      "User-Agent": "Hero-Config-Admin-Dashboard"
    };
    if (githubToken) {
      headers["Authorization"] = `token ${githubToken}`;
    }

    const r = await fetch(rawUrl, { headers, cache: "no-store" });

    if (!r.ok) {
      const localPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(localPath)) {
        const fileContent = fs.readFileSync(localPath, "utf-8");
        return res.json(JSON.parse(fileContent));
      }
      return res.json(DEFAULT_HERO_CONFIG);
    }

    const json = await r.json();
    return res.json(json);
  } catch (err: any) {
    try {
      const localPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(localPath)) {
        const fileContent = fs.readFileSync(localPath, "utf-8");
        return res.json(JSON.parse(fileContent));
      }
    } catch (_) {}
    return res.status(500).json({ error: "Failed to load hero config", details: String(err) });
  }
});

// Update Hero Config (Admin Auth, commits update to GitHub or saves locally)
app.post("/api/github/update-hero-config", verifyAdmin, async (req, res) => {
  const { hero_config, commitMessage } = req.body;

  if (!hero_config) {
    return res.status(400).json({ success: false, error: "Missing parameter: hero_config is required." });
  }

  // Pre-resolve all pinned items to populate the nested "drama" object before committing
  const pinnedItems = hero_config.pinned_items || [];
  const updatedItems = [];
  for (const item of pinnedItems) {
    const dId = item.drama_id;
    if (dId) {
      // If the client has sent a complete, custom drama object with a custom title, preserve it and bypass TMDB lookup completely!
      if (item.drama && item.drama.title && !item.drama.title.startsWith("Drama (ID:")) {
        let finalBackdrop = item.drama.backdrop_url || "";
        if (finalBackdrop && finalBackdrop.includes("/t/p/w1280/")) {
          finalBackdrop = finalBackdrop.replace("/t/p/w1280/", "/t/p/w500/");
        } else if (!finalBackdrop.startsWith("http") && finalBackdrop) {
          // If it is just a TMDB path (e.g. /abc123xyz.jpg)
          finalBackdrop = `https://image.tmdb.org/t/p/w500${finalBackdrop}`;
        }
        
        let synopsis = item.drama.synopsis || item.drama.overview || "";
        if (synopsis && synopsis.length > 130) {
          const truncated = synopsis.slice(0, 130);
          const lastSpace = truncated.lastIndexOf(" ");
          synopsis = (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated) + "...";
        }

        updatedItems.push({
          drama_id: dId,
          position: item.position,
          drama: {
            slug: item.drama.slug || `${item.drama.type || "tv"}-${dId}`,
            title: item.drama.title.trim(),
            backdrop_url: finalBackdrop.trim(),
            rating: Number(item.drama.rating) || 8.0,
            year: Number(item.drama.year) || 2024,
            type: item.drama.type || "tv",
            country: item.drama.country || "KR",
            synopsis: synopsis.trim()
          }
        });
        continue;
      }

      // Warm up cache if we already have valid client data
      if (item.drama && item.drama.title && !item.drama.title.startsWith("Drama (ID:")) {
        const cacheKey = `${dId}_${item.drama.type || "tv"}`;
        if (!tmdbDetailsCache[cacheKey]) {
          tmdbDetailsCache[cacheKey] = {
            id: String(dId),
            title: item.drama.title,
            type: item.drama.type || "tv",
            poster_path: item.drama.backdrop_url,
            backdrop_path: item.drama.backdrop_url,
            release_date: item.drama.year ? `${item.drama.year}-01-01` : "2024-01-01",
            overview: item.drama.synopsis || item.drama.overview || "",
            genres: ["Drama"],
            vote_average: item.drama.rating || 8.0,
            country: item.drama.country || "KR"
          };
        }
      }

      try {
        const details = await fetchDramaDetails(dId, item.drama?.type || "tv");
        const dramaYear = details.release_date ? parseInt(details.release_date.split("-")[0], 10) : 2024;
        
        // If details returned a placeholder title, but the client already sent a valid title, prioritize the client title
        const useClientData = item.drama && item.drama.title && !item.drama.title.startsWith("Drama (ID:") && details.title.startsWith("Drama (ID:");
        
        let finalBackdrop = useClientData ? item.drama.backdrop_url : details.backdrop_path;
        if (finalBackdrop && finalBackdrop.includes("/t/p/w1280/")) {
          finalBackdrop = finalBackdrop.replace("/t/p/w1280/", "/t/p/w500/");
        } else if (finalBackdrop && !finalBackdrop.startsWith("http")) {
          finalBackdrop = `https://image.tmdb.org/t/p/w500${finalBackdrop}`;
        }

        const fullOverview = details.overview || (item.drama && (item.drama.synopsis || item.drama.overview)) || "";
        let synopsis = "";
        if (fullOverview) {
          if (fullOverview.length <= 130) {
            synopsis = fullOverview;
          } else {
            const truncated = fullOverview.slice(0, 130);
            const lastSpace = truncated.lastIndexOf(" ");
            synopsis = (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated) + "...";
          }
        }

        updatedItems.push({
          drama_id: dId,
          position: item.position,
          drama: {
            slug: `${useClientData ? item.drama.type : details.type}-${dId}`,
            title: useClientData ? item.drama.title : details.title,
            backdrop_url: finalBackdrop,
            rating: useClientData ? (Number(item.drama.rating) || 8.0) : (Number(details.vote_average) || 0.0),
            year: useClientData ? (item.drama.year || 2024) : (isNaN(dramaYear) ? 2024 : dramaYear),
            type: useClientData ? item.drama.type : (details.type || "tv"),
            country: useClientData ? item.drama.country : (details.country || "KR"),
            synopsis: synopsis
          }
        });
      } catch (err) {
        console.error(`Error resolving ${dId} on save:`, err);
        updatedItems.push(item);
      }
    } else {
      updatedItems.push(item);
    }
  }
  hero_config.pinned_items = updatedItems;

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const githubToken = process.env.GITHUB_TOKEN;
  const filePath = process.env.GITHUB_HERO_FILE_PATH || "hero_config.json";

  const missing = [];
  if (!owner) missing.push("GITHUB_OWNER");
  if (!repo) missing.push("GITHUB_REPO");
  if (!githubToken) missing.push("GITHUB_TOKEN");

  const fullConfig = { hero_config };

  // Local fallback if GitHub secrets are missing
  if (missing.length > 0) {
    try {
      const localPath = path.join(process.cwd(), filePath);
      fs.writeFileSync(localPath, JSON.stringify(fullConfig, null, 2), "utf-8");

      return res.json({
        success: true,
        message: "Successfully updated local hero_config.json file (Development Mode).",
        isLocalFallback: true,
        data: fullConfig
      });
    } catch (localErr: any) {
      console.error("Local fallback hero_config write failed:", localErr);
      return res.status(500).json({ success: false, error: "Failed to save local hero config.", details: String(localErr) });
    }
  }

  const headers = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": `token ${githubToken}`,
    "User-Agent": "Hero-Config-Admin-Dashboard",
    "Content-Type": "application/json"
  };

  const getHeaders = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": `token ${githubToken}`,
    "User-Agent": "Hero-Config-Admin-Dashboard"
  };

  const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

  try {
    // Fetch current state of file to resolve SHA
    console.log(`GitHub Hero Config Update: Fetching current state of file to resolve SHA...`);
    const getResponse = await fetch(getUrl, { headers: getHeaders });

    let currentSha = "";
    if (getResponse.ok) {
      const fileData = await getResponse.json() as any;
      currentSha = fileData.sha;
    }

    // Convert to pretty base64
    const updatedJsonString = JSON.stringify(fullConfig, null, 2);
    const updatedBase64 = Buffer.from(updatedJsonString, "utf-8").toString("base64");

    // PUT commit update
    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const payload: any = {
      message: commitMessage || `Admin UI: Update dynamic hero configuration`,
      content: updatedBase64,
      branch: branch
    };

    if (currentSha) {
      payload.sha = currentSha;
    }

    console.log(`GitHub Hero Config Update: Sending PUT commit request to: ${putUrl}`);
    const putResponse = await fetch(putUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload)
    });

    if (!putResponse.ok) {
      const errText = await putResponse.text();
      return res.status(putResponse.status).json({
        success: false,
        error: `GitHub PUT commit failed (${putResponse.status}): ${errText}`
      });
    }

    const putResult = await putResponse.json() as any;
    res.json({
      success: true,
      message: "Successfully committed hero configuration to GitHub repository!",
      commitSha: putResult.commit.sha,
      htmlUrl: putResult.content.html_url,
      data: fullConfig
    });
  } catch (err: any) {
    console.error("Error committing hero config to GitHub:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error during GitHub hero config commit." });
  }
});

// Sync and refresh all nested drama metadata inside the current config, then save/commit it!
app.post("/api/github/sync-hero-metadata", verifyAdmin, async (req, res) => {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const githubToken = process.env.GITHUB_TOKEN;
  const filePath = process.env.GITHUB_HERO_FILE_PATH || "hero_config.json";

  // First, load active config
  let activeConfig: any = null;
  try {
    const localPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(localPath)) {
      const fileContent = fs.readFileSync(localPath, "utf-8");
      activeConfig = JSON.parse(fileContent);
    }
  } catch (err) {
    console.warn("Failed to read active config locally:", err);
  }

  // Fallback to fetch from GitHub if local file doesn't exist or is empty
  if (!activeConfig && owner && repo) {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      const headers: Record<string, string> = {
        "User-Agent": "Hero-Config-Admin-Dashboard"
      };
      if (githubToken) {
        headers["Authorization"] = `token ${githubToken}`;
      }
      const r = await fetch(rawUrl, { headers, cache: "no-store" });
      if (r.ok) {
        activeConfig = await r.json();
      }
    } catch (err) {
      console.warn("Failed to fetch active config from GitHub:", err);
    }
  }

  if (!activeConfig || !activeConfig.hero_config) {
    activeConfig = JSON.parse(JSON.stringify(DEFAULT_HERO_CONFIG));
  }

  const pinnedItems = activeConfig.hero_config.pinned_items || [];
  const updatedItems = [];

  console.log(`Syncing metadata for ${pinnedItems.length} pinned items...`);

  for (const item of pinnedItems) {
    const dId = item.drama_id;
    if (dId) {
      // Warm up cache if we already have valid data in the file
      if (item.drama && item.drama.title && !item.drama.title.startsWith("Drama (ID:")) {
        const cacheKey = `${dId}_${item.drama.type || "tv"}`;
        if (!tmdbDetailsCache[cacheKey]) {
          tmdbDetailsCache[cacheKey] = {
            id: String(dId),
            title: item.drama.title,
            type: item.drama.type || "tv",
            poster_path: item.drama.backdrop_url,
            backdrop_path: item.drama.backdrop_url,
            release_date: item.drama.year ? `${item.drama.year}-01-01` : "2024-01-01",
            overview: item.drama.synopsis || item.drama.overview || "",
            genres: ["Drama"],
            vote_average: item.drama.rating || 8.0,
            country: item.drama.country || "KR"
          };
        }
      }

      try {
        const details = await fetchDramaDetails(dId, item.drama?.type || "tv");
        const dramaYear = details.release_date ? parseInt(details.release_date.split("-")[0], 10) : 2024;
        
        // If details returned a placeholder title, but we already have a valid title, prioritize it
        const useFileData = item.drama && item.drama.title && !item.drama.title.startsWith("Drama (ID:") && details.title.startsWith("Drama (ID:");
        
        let finalBackdrop = useFileData ? item.drama.backdrop_url : details.backdrop_path;
        if (finalBackdrop && finalBackdrop.includes("/t/p/w1280/")) {
          finalBackdrop = finalBackdrop.replace("/t/p/w1280/", "/t/p/w500/");
        }

        const fullOverview = details.overview || (item.drama && (item.drama.synopsis || item.drama.overview)) || "";
        let synopsis = "";
        if (fullOverview) {
          if (fullOverview.length <= 130) {
            synopsis = fullOverview;
          } else {
            const truncated = fullOverview.slice(0, 130);
            const lastSpace = truncated.lastIndexOf(" ");
            synopsis = (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated) + "...";
          }
        }

        updatedItems.push({
          drama_id: dId,
          position: item.position,
          drama: {
            slug: `${useFileData ? item.drama.type : details.type}-${dId}`,
            title: useFileData ? item.drama.title : details.title,
            backdrop_url: finalBackdrop,
            rating: useFileData ? (Number(item.drama.rating) || 8.0) : (Number(details.vote_average) || 0.0),
            year: useFileData ? (item.drama.year || 2024) : (isNaN(dramaYear) ? 2024 : dramaYear),
            type: useFileData ? item.drama.type : (details.type || "tv"),
            country: useFileData ? item.drama.country : (details.country || "KR"),
            synopsis: synopsis
          }
        });
      } catch (err) {
        console.error(`Error resolving ${dId} during sync:`, err);
        updatedItems.push(item);
      }
    } else {
      updatedItems.push(item);
    }
  }

  activeConfig.hero_config.pinned_items = updatedItems;

  // Save the synchronized config back to GitHub or locally
  const missing = [];
  if (!owner) missing.push("GITHUB_OWNER");
  if (!repo) missing.push("GITHUB_REPO");
  if (!githubToken) missing.push("GITHUB_TOKEN");

  if (missing.length > 0) {
    try {
      const localPath = path.join(process.cwd(), filePath);
      fs.writeFileSync(localPath, JSON.stringify(activeConfig, null, 2), "utf-8");
      return res.json({
        success: true,
        message: "Successfully synchronized and saved local hero_config.json file (Development Mode).",
        isLocalFallback: true,
        data: activeConfig
      });
    } catch (localErr: any) {
      return res.status(500).json({ success: false, error: "Failed to save local hero config.", details: String(localErr) });
    }
  }

  const headers = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": `token ${githubToken}`,
    "User-Agent": "Hero-Config-Admin-Dashboard",
    "Content-Type": "application/json"
  };

  const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

  try {
    const getResponse = await fetch(getUrl, { headers: { ...headers, "Content-Type": undefined } as any });
    let currentSha = "";
    if (getResponse.ok) {
      const fileData = await getResponse.json() as any;
      currentSha = fileData.sha;
    }

    const updatedJsonString = JSON.stringify(activeConfig, null, 2);
    const updatedBase64 = Buffer.from(updatedJsonString, "utf-8").toString("base64");

    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const payload: any = {
      message: `Admin UI: Sync and update pinned TMDB drama metadata`,
      content: updatedBase64,
      branch: branch
    };

    if (currentSha) {
      payload.sha = currentSha;
    }

    const putResponse = await fetch(putUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload)
    });

    if (!putResponse.ok) {
      const errText = await putResponse.text();
      return res.status(putResponse.status).json({
        success: false,
        error: `GitHub PUT commit failed: ${errText}`
      });
    }

    res.json({
      success: true,
      message: "Successfully synchronized metadata and committed to GitHub repository!",
      data: activeConfig
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- TMDB API Proxy & Gemini Fallback Endpoints ---

const TMDB_IMAGE_BASE_W500 = "https://image.tmdb.org/t/p/w500";
const TMDB_IMAGE_BASE_W1280 = "https://image.tmdb.org/t/p/w1280";

const STATIC_POPULAR_DRAMAS = [
  {
    id: "111837",
    title: "Queen of Tears",
    type: "tv",
    poster_path: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=600",
    backdrop_path: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
    release_date: "2024-03-09",
    overview: "The queen of department stores and her small-town husband weather a marital crisis — until love miraculously begins to bloom again.",
    genres: ["Drama", "Comedy", "Romance"],
    vote_average: 8.5
  },
  {
    id: "94605",
    title: "Sweet Home",
    type: "tv",
    poster_path: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=600",
    backdrop_path: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200",
    release_date: "2020-12-18",
    overview: "As humans turn into savage monsters and wreak terror, one troubled teen and his apartment neighbors fight to survive — and to hold on to their humanity.",
    genres: ["Sci-Fi & Fantasy", "Drama", "Mystery"],
    vote_average: 8.4
  },
  {
    id: "96648",
    title: "Squid Game",
    type: "tv",
    poster_path: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600",
    backdrop_path: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200",
    release_date: "2021-09-17",
    overview: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games. Inside, a tempting prize awaits — with deadly high stakes.",
    genres: ["Action & Adventure", "Mystery", "Drama"],
    vote_average: 8.7
  },
  {
    id: "117376",
    title: "Vincenzo",
    type: "tv",
    poster_path: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600",
    backdrop_path: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200",
    release_date: "2021-02-20",
    overview: "During a visit to his homeland, a Korean-Italian mafia lawyer gives an unrivaled conglomerate a taste of its own medicine with a side of justice.",
    genres: ["Comedy", "Crime", "Drama"],
    vote_average: 8.5
  },
  {
    id: "212151",
    title: "My Demon",
    type: "tv",
    poster_path: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600",
    backdrop_path: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200",
    release_date: "2023-11-24",
    overview: "A pitiless demon becomes powerless after getting entangled with a frigid heiress, who may hold the key to his lost abilities — and his heart.",
    genres: ["Sci-Fi & Fantasy", "Drama", "Comedy"],
    vote_average: 8.6
  }
];

// Helper to construct TMDB image URLs
const formatTmdbImage = (imgpath: string | null, size: "poster" | "backdrop"): string => {
  if (!imgpath) return "";
  if (imgpath.startsWith("http")) return imgpath;
  return size === "poster" ? `${TMDB_IMAGE_BASE_W500}${imgpath}` : `${TMDB_IMAGE_BASE_W1280}${imgpath}`;
};

// Search Movies & TV Shows (Public endpoint)
app.get("/api/tmdb/search", async (req, res) => {
  const query = req.query.query as string;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Missing required query parameter: query" });
  }

  const tmdbKey = process.env.TMDB_API_KEY;

  if (tmdbKey && tmdbKey !== "") {
    try {
      console.log(`Searching TMDB for: "${query}" using configured API key`);
      const tmdbUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(query)}&language=en-US`;
      const response = await fetch(tmdbUrl);
      if (response.ok) {
        const data = await response.json() as any;
        const results = (data.results || [])
          .filter((item: any) => item.media_type === "tv" || item.media_type === "movie")
          .map((item: any) => {
            const resItem = {
              id: String(item.id),
              title: item.name || item.title || "Untitled",
              type: item.media_type,
              poster_path: formatTmdbImage(item.poster_path, "poster") || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
              backdrop_path: formatTmdbImage(item.backdrop_path, "backdrop") || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
              release_date: item.first_air_date || item.release_date || "",
              overview: item.overview || ""
            };
            
            // Cache details immediately to prevent resolving issues if user pins this
            const cacheKey = `${resItem.id}_${resItem.type}`;
            tmdbDetailsCache[cacheKey] = {
              ...resItem,
              genres: ["Drama"],
              vote_average: 8.0,
              country: "KR"
            };
            
            return resItem;
          });
        return res.json({ success: true, results, source: "tmdb" });
      } else {
        console.warn(`TMDB search API responded with status ${response.status}. Falling back to Gemini/Static.`);
      }
    } catch (err: any) {
      console.error("TMDB API Search request failed, attempting fallback:", err);
    }
  }

  // Fallback A: Gemini Synthesis
  if (ai) {
    try {
      console.log(`Calling Gemini API to synthesize TMDB search results for query: "${query}"`);
      const prompt = `The user is building a K-Drama dashboard called HanZone. Search TMDB index or generate top-tier search results matching drama or movie query: "${query}". Return between 3 and 6 highly realistic matching entries.
      Be extremely accurate with actual TMDB IDs, true show names, true release years, and real descriptions if they correspond to known Korean/Asian dramas or global films. For the poster_path and backdrop_path, use high-quality, fully-qualified Unsplash image URLs representing theatrical, romantic, sci-fi, or urban aesthetics.

      Provide output strictly matching this JSON schema:
      [
        {
          "id": "real_numeric_id_string_or_believable_id",
          "title": "Exact Show/Movie Name",
          "type": "tv" or "movie",
          "poster_path": "https://images.unsplash.com/...",
          "backdrop_path": "https://images.unsplash.com/...",
          "release_date": "YYYY-MM-DD",
          "overview": "Enchanting 2-3 sentence overview..."
        }
      ]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (text) {
        const results = JSON.parse(text);
        
        // Cache Gemini results so they can be retrieved by /api/tmdb/details
        results.forEach((resItem: any) => {
          const cacheKey = `${String(resItem.id)}_${resItem.type || "tv"}`;
          tmdbDetailsCache[cacheKey] = {
            id: String(resItem.id),
            title: resItem.title,
            type: resItem.type || "tv",
            poster_path: resItem.poster_path,
            backdrop_path: resItem.backdrop_path,
            release_date: resItem.release_date,
            overview: resItem.overview,
            genres: resItem.genres || ["Drama"],
            vote_average: resItem.vote_average || 8.0,
            country: "KR"
          };
        });
        
        return res.json({ success: true, results, source: "gemini_synthesis" });
      }
    } catch (geminiErr: any) {
      console.error("Gemini Search Synthesis failed:", geminiErr);
    }
  }

  // Fallback B: Local filtering of popular curation
  console.log(`Both TMDB & Gemini unavailable/failed. Running local string search in popular static dramas.`);
  const q = query.toLowerCase();
  const matched = STATIC_POPULAR_DRAMAS.filter(
    item => item.title.toLowerCase().includes(q) || item.overview.toLowerCase().includes(q)
  ).map(item => ({
    ...item,
    id: String(item.id)
  }));
  
  if (matched.length === 0) {
    const generatedId = "999" + Math.floor(Math.random() * 1000);
    const mockItem = {
      id: generatedId,
      title: query,
      type: "tv",
      poster_path: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
      backdrop_path: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
      release_date: new Date().toISOString().split("T")[0],
      overview: `A thrilling drama exploring the themes of "${query}". Hand-curated and dynamically resolved by HanZone server.`,
      genres: ["Drama"],
      vote_average: 8.0
    };
    matched.push(mockItem);
    
    // Cache the fallback so pinning it immediately works
    const cacheKey = `${generatedId}_tv`;
    tmdbDetailsCache[cacheKey] = {
      ...mockItem,
      country: "KR"
    };
  } else {
    // Cache the matched popular dramas too
    matched.forEach(item => {
      const cacheKey = `${item.id}_${item.type}`;
      tmdbDetailsCache[cacheKey] = {
        ...item,
        country: "KR"
      };
    });
  }

  return res.json({ success: true, results: matched, source: "static_fallback" });
});

// Helper function to fetch detailed drama/movie metadata with TMDB key or fallbacks
async function fetchDramaDetails(idInput: string | number, typeHint: string = "tv"): Promise<any> {
  const id = String(idInput).trim();
  const cacheKey = `${id}_${typeHint}`;
  if (tmdbDetailsCache[cacheKey]) {
    return tmdbDetailsCache[cacheKey];
  }

  // Check if ID is a non-numeric/mock ID or contains letters
  const isMockId = !/^\d+$/.test(id);
  if (isMockId) {
    if (id.includes("123")) {
      return {
        id,
        title: "Guardian: The Lonely and Great God",
        type: typeHint,
        poster_path: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
        backdrop_path: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
        release_date: "2016-12-02",
        overview: "Kim Shin, an immortal goblin who is protector of souls, goes on a quest to find his human bride, the only one who can pull out the sword that keeps him immortal.",
        genres: ["Drama", "Fantasy", "Romance"],
        vote_average: 9.1,
        country: "KR"
      };
    }
    if (id.includes("456")) {
      return {
        id,
        title: "Crash Landing on You",
        type: typeHint,
        poster_path: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
        backdrop_path: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
        release_date: "2019-12-14",
        overview: "A paragliding mishap drops a South Korean heiress in North Korea - and into the life of an army officer, who decides he will help her hide.",
        genres: ["Drama", "Comedy", "Romance"],
        vote_average: 8.9,
        country: "KR"
      };
    }
    
    const cleanName = id
      .replace(/^drama_/, "")
      .replace(/_id$/, "")
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return {
      id,
      title: cleanName || "Chronicles of HanZone",
      type: typeHint,
      poster_path: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
      backdrop_path: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
      release_date: "2024-01-01",
      overview: `A thrilling cinematic masterpiece titled "${cleanName || "Chronicles of HanZone"}", following complex characters entangled in destiny and intrigue across breathtaking Asian landscapes.`,
      genres: ["Drama", "Mystery", "Thriller"],
      vote_average: 8.5,
      country: "KR"
    };
  }

  // A. TMDB Key Resolution
  const tmdbKey = process.env.TMDB_API_KEY;
  if (tmdbKey && tmdbKey !== "") {
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/${typeHint}/${id}?api_key=${tmdbKey}&language=en-US`;
      const response = await fetch(tmdbUrl);
      
      if (response.ok) {
        const item = await response.json() as any;
        const origin_country = item.origin_country?.[0] || item.production_countries?.[0]?.iso_3166_1 || "KR";
        const result = {
          id: String(item.id),
          title: item.name || item.title || "Untitled Show",
          type: typeHint,
          poster_path: formatTmdbImage(item.poster_path, "poster") || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
          backdrop_path: formatTmdbImage(item.backdrop_path, "backdrop") || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
          release_date: item.first_air_date || item.release_date || "",
          overview: item.overview || "",
          genres: (item.genres || []).map((g: any) => g.name),
          vote_average: item.vote_average || 0.0,
          country: origin_country
        };
        tmdbDetailsCache[cacheKey] = result;
        return result;
      } else {
        // Try fallback type in case they passed the wrong type Hint (tv vs movie)
        const alternateType = typeHint === "tv" ? "movie" : "tv";
        const fallbackUrl = `https://api.themoviedb.org/3/${alternateType}/${id}?api_key=${tmdbKey}&language=en-US`;
        const fbResponse = await fetch(fallbackUrl);
        if (fbResponse.ok) {
          const item = await fbResponse.json() as any;
          const origin_country = item.origin_country?.[0] || item.production_countries?.[0]?.iso_3166_1 || "KR";
          const result = {
            id: String(item.id),
            title: item.name || item.title || "Untitled Show",
            type: alternateType,
            poster_path: formatTmdbImage(item.poster_path, "poster") || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
            backdrop_path: formatTmdbImage(item.backdrop_path, "backdrop") || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
            release_date: item.first_air_date || item.release_date || "",
            overview: item.overview || "",
            genres: (item.genres || []).map((g: any) => g.name),
            vote_average: item.vote_average || 0.0,
            country: origin_country
          };
          tmdbDetailsCache[cacheKey] = result;
          return result;
        }
      }
    } catch (err: any) {
      console.error(`TMDB details query failed for ID ${id}:`, err);
    }
  }

  // B. Static Curated Fallback
  const staticFound = STATIC_POPULAR_DRAMAS.find(item => String(item.id) === id);
  if (staticFound) {
    const enrichedStatic = { ...staticFound, country: (staticFound as any).country || "KR" };
    tmdbDetailsCache[cacheKey] = enrichedStatic;
    return enrichedStatic;
  }

  // C. Gemini synthesis Fallback
  if (ai) {
    try {
      const prompt = `Synthesize TMDB details for TV show/movie with ID: "${id}".
      If this ID corresponds to a famous K-Drama or movie, generate its exact title, overview, release date, genres, and realistic ratings. (e.g. 111837 is Queen of Tears, 94605 is Sweet Home, 96648 is Squid Game, 117376 is Vincenzo, 212151 is My Demon).
      If the ID is unrecognized, synthesize a beautiful, premium, highly realistic Korean/Asian drama name and plot.
      For images, provide high-quality Unsplash image URLs that represent cinematic aesthetics.

      Provide output strictly matching this JSON schema:
      {
        "id": "${id}",
        "title": "Exact or synthesized title",
        "type": "tv" or "movie",
        "poster_path": "https://images.unsplash.com/...",
        "backdrop_path": "https://images.unsplash.com/...",
        "release_date": "YYYY-MM-DD",
        "overview": "Detailed show plot summary...",
        "genres": ["Drama", "Romance"],
        "vote_average": 8.5,
        "country": "KR"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (text) {
        const result = JSON.parse(text);
        if (!result.country) result.country = "KR";
        tmdbDetailsCache[cacheKey] = result;
        return result;
      }
    } catch (geminiErr: any) {
      console.warn(`Gemini Details Synthesis failed for ID "${id}":`, geminiErr);
    }
  }

  // D. Safe hard fallback (Default Mock Item)
  const fallback = {
    id,
    title: `Drama (ID: ${id})`,
    type: typeHint,
    poster_path: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
    backdrop_path: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
    release_date: "2024-01-01",
    overview: "A captivating drama series dynamically loaded from the HanZone content repository. Full information can be pulled with a configured TMDB API key.",
    genres: ["Drama", "Action"],
    vote_average: 8.0,
    country: "KR"
  };
  tmdbDetailsCache[cacheKey] = fallback;
  return fallback;
}

// Fetch detailed metadata by TMDB ID (Public endpoint)
app.get("/api/tmdb/details", async (req, res) => {
  const id = req.query.id as string;
  const typeHint = (req.query.type as string) || "tv";

  if (!id || !id.trim()) {
    return res.status(400).json({ error: "Missing required parameter: id" });
  }

  const cacheKey = `${id}_${typeHint}`;

  // Check in-memory cache first
  if (tmdbDetailsCache[cacheKey]) {
    console.log(`[Details Cache] Serving details for ID: "${id}" from cache.`);
    return res.json({ success: true, data: tmdbDetailsCache[cacheKey], source: "memory_cache" });
  }

  // Coalesce concurrent requests for the exact same resource ID to avoid multiple parallel API requests
  if (inFlightDetails[cacheKey]) {
    try {
      console.log(`[Details Coalescing] Awaiting in-flight resolution for ID: "${id}".`);
      const data = await inFlightDetails[cacheKey];
      return res.json({ success: true, data, source: "coalesced_request" });
    } catch (err: any) {
      console.warn(`[Details Coalescing] Coalesced promise rejected for ID "${id}", retrying directly...`);
    }
  }

  const promise = fetchDramaDetails(id, typeHint);
  inFlightDetails[cacheKey] = promise;

  try {
    const result = await promise;
    delete inFlightDetails[cacheKey];
    return res.json({ success: true, data: result, source: "resolved" });
  } catch (err: any) {
    delete inFlightDetails[cacheKey];
    console.error(`Failed resolving details resolver for ID "${id}":`, err);
    return res.status(500).json({ success: false, error: err.message || "Failed resolving details." });
  }
});

// --- Drama Media Links Storage Helpers ---

let isDramaLinksLoadedFromGithub = false;

const loadDramaLinks = async (): Promise<Record<string, { stream_url: string | null; download_url: string | null; title?: string; seasons?: any; media_type?: string }>> => {
  const localPath = path.join(process.cwd(), "drama_links.json");

  // If we have already loaded from GitHub once, the local file is our absolute single-source of truth.
  // Reading it directly avoids CDN propagation/cache delay issues on GitHub Raw files.
  if (isDramaLinksLoadedFromGithub && fs.existsSync(localPath)) {
    try {
      const content = fs.readFileSync(localPath, "utf-8");
      return JSON.parse(content);
    } catch (err) {
      console.error("Error reading cached local drama_links.json:", err);
    }
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const filePath = process.env.GITHUB_DRAMA_LINKS_FILE_PATH || "drama_links.json";
  const branch = process.env.GITHUB_BRANCH || "main";
  const githubToken = process.env.GITHUB_TOKEN;

  if (owner && repo) {
    try {
      // Fetch via GitHub Contents API which bypasses Raw CDN caching completely
      const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
      const headers: Record<string, string> = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Drama-Links-Admin"
      };
      if (githubToken) {
        headers["Authorization"] = `token ${githubToken}`;
      }
      
      console.log(`[GitHub Sync] Initial fetch for drama_links.json via API`);
      const r = await fetch(getUrl, { headers });
      if (r.ok) {
        const fileData = await r.json() as any;
        if (fileData.content) {
          const content = Buffer.from(fileData.content, "base64").toString("utf-8");
          const parsed = JSON.parse(content);
          fs.writeFileSync(localPath, JSON.stringify(parsed, null, 2), "utf-8");
          isDramaLinksLoadedFromGithub = true;
          return parsed;
        }
      } else {
        console.warn(`[GitHub Sync] Contents API failed with status ${r.status}. Trying Raw fallback...`);
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}?v=${Date.now()}`;
        const rawHeaders: Record<string, string> = { "User-Agent": "Drama-Links-Admin" };
        if (githubToken) {
          rawHeaders["Authorization"] = `token ${githubToken}`;
        }
        const rRaw = await fetch(rawUrl, { headers: rawHeaders, cache: "no-store" });
        if (rRaw.ok) {
          const content = await rRaw.text();
          const parsed = JSON.parse(content);
          fs.writeFileSync(localPath, JSON.stringify(parsed, null, 2), "utf-8");
          isDramaLinksLoadedFromGithub = true;
          return parsed;
        }
      }
    } catch (err) {
      console.error("Error fetching drama_links.json from GitHub:", err);
    }
  }

  try {
    if (fs.existsSync(localPath)) {
      const content = fs.readFileSync(localPath, "utf-8");
      isDramaLinksLoadedFromGithub = true;
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading drama_links.json fallback:", err);
  }
  return {};
};

const saveDramaLinks = async (links: Record<string, { stream_url: string | null; download_url: string | null; title?: string; seasons?: any; media_type?: string }>): Promise<boolean> => {
  const localPath = path.join(process.cwd(), "drama_links.json");
  const jsonContent = JSON.stringify(links, null, 2);
  
  try {
    fs.writeFileSync(localPath, jsonContent, "utf-8");
    isDramaLinksLoadedFromGithub = true; // Keep local source of truth flagged as loaded/valid
  } catch (err) {
    console.error("Error writing drama_links.json locally:", err);
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const filePath = process.env.GITHUB_DRAMA_LINKS_FILE_PATH || "drama_links.json";
  const branch = process.env.GITHUB_BRANCH || "main";
  const githubToken = process.env.GITHUB_TOKEN;

  if (owner && repo && githubToken) {
    try {
      const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
      const headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `token ${githubToken}`,
        "User-Agent": "Drama-Links-Admin",
        "Content-Type": "application/json"
      };

      const getHeaders = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `token ${githubToken}`,
        "User-Agent": "Drama-Links-Admin"
      };

      const getResponse = await fetch(getUrl, { headers: getHeaders });
      let currentSha = "";
      if (getResponse.ok) {
        const fileData = await getResponse.json() as any;
        currentSha = fileData.sha;
      }

      const base64Content = Buffer.from(jsonContent, "utf-8").toString("base64");

      const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
      const payload: any = {
        message: `Admin UI: Update drama links configuration`,
        content: base64Content,
        branch: branch
      };
      if (currentSha) {
        payload.sha = currentSha;
      }

      const putResponse = await fetch(putUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload)
      });

      if (!putResponse.ok) {
        const errText = await putResponse.text();
        console.error(`GitHub PUT failed for drama_links.json: ${errText}`);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error committing drama_links.json to GitHub:", err);
      return false;
    }
  }

  return true;
};

// --- Home Screen Layout Dynamic Configuration Storage Helpers ---

const DEFAULT_HOME_LAYOUT = [
  {
    "section_id": "1",
    "layout_type": "HERO",
    "title": "Featured Spotlight",
    "visible": true
  },
  {
    "section_id": "2",
    "layout_type": "TOP_10",
    "title": "Top 10 Hits",
    "visible": true
  },
  {
    "section_id": "3",
    "layout_type": "DRAMA_RAIL",
    "title": "Korean & Japanese Hits",
    "visible": true,
    "data_source": {
      "media_type": "all",
      "countries": ["KR", "JP"],
      "sort_by": "popularity"
    }
  },
  {
    "section_id": "4",
    "layout_type": "ACTORS",
    "title": "Trending Stars",
    "visible": true
  }
];

const loadHomeLayout = async (): Promise<any[]> => {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const filePath = process.env.GITHUB_HOME_LAYOUT_FILE_PATH || "home_layout.json";
  const branch = process.env.GITHUB_BRANCH || "main";
  const githubToken = process.env.GITHUB_TOKEN;

  const localPath = path.join(process.cwd(), "home_layout.json");

  if (owner && repo) {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}?v=${Date.now()}`;
      const headers: Record<string, string> = { "User-Agent": "Home-Layout-Admin" };
      if (githubToken) {
        headers["Authorization"] = `token ${githubToken}`;
      }
      const r = await fetch(rawUrl, { headers, cache: "no-store" });
      if (r.ok) {
        const content = await r.text();
        const parsed = JSON.parse(content);
        fs.writeFileSync(localPath, JSON.stringify(parsed, null, 2), "utf-8");
        return parsed;
      }
    } catch (err) {
      console.error("Error fetching home_layout.json from GitHub:", err);
    }
  }

  try {
    if (fs.existsSync(localPath)) {
      const content = fs.readFileSync(localPath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading home_layout.json, using default:", err);
  }
  return DEFAULT_HOME_LAYOUT;
};

const saveHomeLayout = async (layout: any[]): Promise<boolean> => {
  const localPath = path.join(process.cwd(), "home_layout.json");
  const jsonContent = JSON.stringify(layout, null, 2);

  try {
    fs.writeFileSync(localPath, jsonContent, "utf-8");
  } catch (err) {
    console.error("Error writing home_layout.json locally:", err);
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const filePath = process.env.GITHUB_HOME_LAYOUT_FILE_PATH || "home_layout.json";
  const branch = process.env.GITHUB_BRANCH || "main";
  const githubToken = process.env.GITHUB_TOKEN;

  if (owner && repo && githubToken) {
    try {
      const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
      const headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `token ${githubToken}`,
        "User-Agent": "Home-Layout-Admin",
        "Content-Type": "application/json"
      };

      const getHeaders = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `token ${githubToken}`,
        "User-Agent": "Home-Layout-Admin"
      };

      const getResponse = await fetch(getUrl, { headers: getHeaders });
      let currentSha = "";
      if (getResponse.ok) {
        const fileData = await getResponse.json() as any;
        currentSha = fileData.sha;
      }

      const base64Content = Buffer.from(jsonContent, "utf-8").toString("base64");

      const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
      const payload: any = {
        message: `Admin UI: Update home screen layout configuration`,
        content: base64Content,
        branch: branch
      };
      if (currentSha) {
        payload.sha = currentSha;
      }

      const putResponse = await fetch(putUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload)
      });

      if (!putResponse.ok) {
        const errText = await putResponse.text();
        console.error(`GitHub PUT failed for home_layout.json: ${errText}`);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error committing home_layout.json to GitHub:", err);
      return false;
    }
  }

  return true;
};

// --- Mobile Android / Public Proxy Endpoints ---

// 1. Unified Search Endpoint
app.get("/api/search", async (req, res) => {
  const query = req.query.query as string;
  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, error: "Missing required parameter: query" });
  }

  const tmdbKey = process.env.TMDB_API_KEY;

  if (tmdbKey && tmdbKey !== "") {
    try {
      console.log(`[Proxy Search] Searching TMDB for: "${query}"`);
      const tmdbUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(query)}&language=en-US`;
      const response = await fetch(tmdbUrl);
      if (response.ok) {
        const data = await response.json() as any;
        const results = (data.results || []).map((item: any) => {
          if (item.media_type === "person") {
            return {
              id: String(item.id),
              name: item.name || "Unknown",
              type: "person",
              profile_path: formatTmdbImage(item.profile_path, "poster"),
              known_for_department: item.known_for_department || "",
              known_for: (item.known_for || []).map((k: any) => ({
                id: String(k.id),
                title: k.title || k.name || "Untitled",
                type: k.media_type || "tv",
                poster_path: formatTmdbImage(k.poster_path, "poster"),
                backdrop_path: formatTmdbImage(k.backdrop_path, "backdrop"),
                release_date: k.release_date || k.first_air_date || "",
                overview: k.overview || ""
              }))
            };
          } else {
            return {
              id: String(item.id),
              title: item.title || item.name || "Untitled",
              type: item.media_type || "tv",
              poster_path: formatTmdbImage(item.poster_path, "poster") || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
              backdrop_path: formatTmdbImage(item.backdrop_path, "backdrop") || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
              release_date: item.release_date || item.first_air_date || "",
              overview: item.overview || "",
              vote_average: item.vote_average || 0.0
            };
          }
        });
        return res.json({ success: true, results, source: "tmdb" });
      }
    } catch (err: any) {
      console.error("[Proxy Search] TMDB search failed, falling back:", err);
    }
  }

  // Fallback to Gemini AI if TMDB key is missing or failed
  if (ai) {
    try {
      console.log(`[Proxy Search] Calling Gemini API fallback for query: "${query}"`);
      const prompt = `The user is searching the HanZone K-Drama & Asian film database. Search TMDB index or generate realistic search results matching the query: "${query}".
      Return an array of 4-6 highly realistic, beautiful Asian drama or movie matches, including some actors.
      For actors ("type": "person"), include "id" (unique number string), "name", "profile_path" (high-quality Unsplash portrait), "known_for_department" (e.g., "Acting"), and a "known_for" array (with 2-3 of their typical movies/tv shows).
      For tv shows/movies, include "id" (unique number string), "title", "type" ("tv" or "movie"), "poster_path" (Unsplash), "backdrop_path" (Unsplash), "release_date" (YYYY-MM-DD), "overview", and "vote_average" (number between 1.0 and 10.0).

      Provide output strictly matching this JSON schema:
      [
        {
          "id": "string",
          "name": "string",
          "title": "string",
          "type": "person" | "tv" | "movie",
          "profile_path": "string",
          "known_for_department": "string",
          "poster_path": "string",
          "backdrop_path": "string",
          "release_date": "string",
          "overview": "string",
          "vote_average": 8.5,
          "known_for": [
            {
              "id": "string",
              "title": "string",
              "type": "tv" | "movie",
              "poster_path": "string",
              "backdrop_path": "string",
              "release_date": "string",
              "overview": "string"
            }
          ]
        }
      ]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      if (response.text) {
        const results = JSON.parse(response.text);
        return res.json({ success: true, results, source: "gemini_fallback" });
      }
    } catch (err: any) {
      console.error("[Proxy Search] Gemini fallback search failed:", err);
    }
  }

  // Simple static fallback
  const q = query.toLowerCase();
  const matched = STATIC_POPULAR_DRAMAS.filter(
    item => item.title.toLowerCase().includes(q) || item.overview.toLowerCase().includes(q)
  ).map(item => ({
    ...item,
    id: String(item.id)
  }));
  return res.json({ success: true, results: matched, source: "static_fallback" });
});

// 2. Drama/Movie Details & Similar Items (Enriched with stream and download URLs)
app.get("/api/drama/details", async (req, res) => {
  const id = req.query.id as string;
  const type = (req.query.type as string) || "tv";

  if (!id || !id.trim()) {
    return res.status(400).json({ success: false, error: "Missing required parameter: id" });
  }

  let finalDetails: any = null;
  const tmdbKey = process.env.TMDB_API_KEY;

  if (tmdbKey && tmdbKey !== "" && !isNaN(Number(id))) {
    try {
      console.log(`[Proxy Details] Querying TMDB for ${type} ID: ${id}`);
      const tmdbUrl = `https://api.themoviedb.org/3/${type}/${id}?api_key=${tmdbKey}&append_to_response=credits,similar&language=en-US`;
      const response = await fetch(tmdbUrl);
      if (response.ok) {
        const item = await response.json() as any;
        const origin_country = item.origin_country?.[0] || item.production_countries?.[0]?.iso_3166_1 || "KR";
        
        const mappedCast = (item.credits?.cast || []).slice(0, 10).map((c: any) => ({
          id: String(c.id),
          name: c.name,
          character: c.character,
          profile_path: formatTmdbImage(c.profile_path, "poster") || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400"
        }));

        const mappedSimilar = (item.similar?.results || []).slice(0, 6).map((s: any) => ({
          id: String(s.id),
          title: s.title || s.name || "Untitled",
          type: type,
          poster_path: formatTmdbImage(s.poster_path, "poster") || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
          backdrop_path: formatTmdbImage(s.backdrop_path, "backdrop") || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
          release_date: s.release_date || s.first_air_date || "",
          overview: s.overview || "",
          vote_average: s.vote_average || 0.0
        }));

        finalDetails = {
          id: String(item.id),
          title: item.name || item.title || "Untitled Show",
          type: type,
          poster_path: formatTmdbImage(item.poster_path, "poster") || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
          backdrop_path: formatTmdbImage(item.backdrop_path, "backdrop") || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
          release_date: item.first_air_date || item.release_date || "",
          overview: item.overview || "",
          genres: (item.genres || []).map((g: any) => g.name),
          vote_average: item.vote_average || 0.0,
          country: origin_country,
          credits: { cast: mappedCast },
          similar: mappedSimilar
        };
      }
    } catch (err: any) {
      console.error(`[Proxy Details] TMDB details query failed for ${type} ID ${id}:`, err);
    }
  }

  // Fallback to Gemini if TMDB is failing or not configured
  if (!finalDetails && ai) {
    try {
      console.log(`[Proxy Details] Calling Gemini fallback for ${type} ID: "${id}"`);
      const prompt = `Synthesize incredibly detailed, rich, TMDB-style information for a ${type} with ID "${id}".
      If this ID corresponds to a famous Asian film/TV show (e.g. Queen of Tears, Squid Game, Vincenzo, Sweet Home, My Demon), return its real actors (credits.cast), authentic overview, poster, backdrop, rating, and similar recommendations.
      Otherwise, synthesize a highly beautiful, coherent K-Drama or movie with appropriate cast names and similar shows.

      Provide output strictly matching this JSON schema:
      {
        "id": "${id}",
        "title": "Exact or synthesized title",
        "type": "${type}",
        "poster_path": "https://images.unsplash.com/...",
        "backdrop_path": "https://images.unsplash.com/...",
        "release_date": "YYYY-MM-DD",
        "overview": "Detailed show plot summary of 3-4 sentences.",
        "genres": ["Drama", "Romance"],
        "vote_average": 8.5,
        "country": "KR",
        "credits": {
          "cast": [
            {
              "id": "cast_1",
              "name": "Actor Name",
              "character": "Character Name",
              "profile_path": "https://images.unsplash.com/..."
            }
          ]
        },
        "similar": [
          {
            "id": "similar_1",
            "title": "Similar Drama Title",
            "type": "${type}",
            "poster_path": "https://images.unsplash.com/...",
            "backdrop_path": "https://images.unsplash.com/...",
            "release_date": "YYYY-MM-DD",
            "overview": "Brief description...",
            "vote_average": 8.0
          }
        ]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      if (response.text) {
        finalDetails = JSON.parse(response.text);
      }
    } catch (err: any) {
      console.error("[Proxy Details] Gemini details fallback failed:", err);
    }
  }

  // Last-resort mock fallback
  if (!finalDetails) {
    const staticFound = STATIC_POPULAR_DRAMAS.find(item => String(item.id) === id);
    if (staticFound) {
      finalDetails = {
        ...staticFound,
        id: String(staticFound.id),
        type,
        country: "KR",
        credits: { cast: [] },
        similar: []
      };
    } else {
      finalDetails = {
        id,
        title: `Drama (ID: ${id})`,
        type,
        poster_path: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
        backdrop_path: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
        release_date: "2024-01-01",
        overview: "A fascinating drama dynamically loaded from our server. Configure a TMDB API Key for complete cast and recommendations.",
        genres: ["Drama"],
        vote_average: 8.0,
        country: "KR",
        credits: { cast: [] },
        similar: []
      };
    }
  }

  // Inject custom stream and download links from local drama_links database!
  const links = await loadDramaLinks();
  const matchedLink = links[id];
  finalDetails.stream_url = matchedLink?.stream_url || null;
  finalDetails.download_url = matchedLink?.download_url || null;
  
  // If we have custom season/episode records, include them in the details payload so the client app can load them
  if (matchedLink && (matchedLink as any).seasons) {
    finalDetails.custom_seasons = (matchedLink as any).seasons;
  }

  return res.json({ success: true, data: finalDetails, source: "proxy" });
});

// --- Direct Streaming Link Specific Endpoints (Option A & B Support) ---

// Option A: Get stream links for a single title (Supports query params "?id={tmdb_id}&season={season_num}&episode={ep_num}")
app.get("/api/get-stream-links", async (req, res) => {
  const id = req.query.id as string;
  const season = req.query.season ? String(req.query.season) : undefined;
  const episode = req.query.episode ? String(req.query.episode) : undefined;

  if (!id || !id.trim()) {
    return res.status(400).json({ success: false, error: "Missing required query parameter: id" });
  }

  const links = await loadDramaLinks();
  const matched = links[id];

  let stream_url = matched?.stream_url || null;
  let download_url = matched?.download_url || null;

  // Resolve episode-specific links if they are available
  if (season && episode && matched && (matched as any).seasons?.[season]?.[episode]) {
    const epData = (matched as any).seasons[season][episode];
    if (epData.stream_url) stream_url = epData.stream_url;
    if (epData.download_url) download_url = epData.download_url;
  }

  return res.json({
    success: true,
    id: id,
    season: season || null,
    episode: episode || null,
    stream_url,
    download_url,
    title: matched?.title || null,
    has_custom_episodes: !!(matched && (matched as any).seasons)
  });
});

app.get("/api/get-stream-links/:id", async (req, res) => {
  const id = req.params.id;
  const season = req.query.season ? String(req.query.season) : undefined;
  const episode = req.query.episode ? String(req.query.episode) : undefined;

  if (!id || !id.trim()) {
    return res.status(400).json({ success: false, error: "Missing required path parameter: id" });
  }

  const links = await loadDramaLinks();
  const matched = links[id];

  let stream_url = matched?.stream_url || null;
  let download_url = matched?.download_url || null;

  // Resolve episode-specific links if they are available
  if (season && episode && matched && (matched as any).seasons?.[season]?.[episode]) {
    const epData = (matched as any).seasons[season][episode];
    if (epData.stream_url) stream_url = epData.stream_url;
    if (epData.download_url) download_url = epData.download_url;
  }

  return res.json({
    success: true,
    id: id,
    season: season || null,
    episode: episode || null,
    stream_url,
    download_url,
    title: matched?.title || null,
    has_custom_episodes: !!(matched && (matched as any).seasons)
  });
});

// Option B: Get all active custom overrides/links in a single unified JSON for local caching
app.get("/api/get-all-stream-links", async (req, res) => {
  const links = await loadDramaLinks();
  return res.json({
    success: true,
    links
  });
});

// --- Dynamic Home Screen Layout Endpoints ---

// Public endpoint for the Android client app to fetch the layout configuration
app.get("/api/get-home-layout", async (req, res) => {
  const layout = await loadHomeLayout();
  return res.json({
    success: true,
    layout
  });
});

// Admin endpoint to read the current layout configuration
app.get("/api/admin/home-layout", verifyAdmin, async (req, res) => {
  const layout = await loadHomeLayout();
  return res.json({
    success: true,
    layout
  });
});

// Admin endpoint to write/update the layout configuration
app.post("/api/admin/home-layout", verifyAdmin, async (req, res) => {
  const { layout } = req.body;
  if (!layout || !Array.isArray(layout)) {
    return res.status(400).json({ success: false, error: "Invalid layout payload. Must be a JSON array of sections." });
  }

  const success = await saveHomeLayout(layout);
  if (success) {
    return res.json({
      success: true,
      message: "Successfully saved Home Layout configuration!",
      layout
    });
  } else {
    return res.status(500).json({
      success: false,
      error: "Failed to persist Home Layout configuration to disk."
    });
  }
});

// 3. Discover & Filter Endpoint (With paginated categories and filters)
app.get("/api/discover", async (req, res) => {
  const type = (req.query.type as string) || "tv";
  const genre = req.query.genre as string;
  const keyword = req.query.keyword as string;
  const page = parseInt(req.query.page as string, 10) || 1;

  const tmdbKey = process.env.TMDB_API_KEY;

  if (tmdbKey && tmdbKey !== "") {
    try {
      let tmdbUrl = `https://api.themoviedb.org/3/discover/${type}?api_key=${tmdbKey}&language=en-US&sort_by=popularity.desc&page=${page}`;
      if (genre) {
        tmdbUrl += `&with_genres=${genre}`;
      }
      if (keyword) {
        tmdbUrl += `&with_keywords=${keyword}`;
      }
      console.log(`[Proxy Discover] Calling TMDB discover: "${tmdbUrl}"`);
      const response = await fetch(tmdbUrl);
      if (response.ok) {
        const data = await response.json() as any;
        const results = (data.results || []).map((s: any) => ({
          id: String(s.id),
          title: s.title || s.name || "Untitled",
          type: type,
          poster_path: formatTmdbImage(s.poster_path, "poster") || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
          backdrop_path: formatTmdbImage(s.backdrop_path, "backdrop") || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
          release_date: s.release_date || s.first_air_date || "",
          overview: s.overview || "",
          vote_average: s.vote_average || 0.0
        }));

        return res.json({
          success: true,
          page: data.page || page,
          results,
          total_pages: Math.min(data.total_pages || 1, 500), // TMDB caps page queries at 500
          total_results: data.total_results || results.length
        });
      }
    } catch (err: any) {
      console.error("[Proxy Discover] TMDB discover failed, falling back:", err);
    }
  }

  // Fallback to Gemini if TMDB is offline or key missing
  if (ai) {
    try {
      console.log(`[Proxy Discover] Calling Gemini fallback discover page: ${page}, genre filters: ${genre || 'none'}`);
      const prompt = `Generate a realistic page of TMDB-style Asian drama discover results for type "${type}".
      Filters applied: genre IDs: "${genre || 'none'}", keyword IDs: "${keyword || 'none'}", page: ${page}.
      Return a list of 6-8 matching shows/movies. Be highly creative with titles, years, ratings, and plots.
      For poster_path and backdrop_path, use high-quality Unsplash image URLs.

      Provide output strictly matching this JSON schema:
      {
        "page": ${page},
        "total_pages": 10,
        "total_results": 80,
        "results": [
          {
            "id": "string",
            "title": "string",
            "type": "${type}",
            "poster_path": "https://images.unsplash.com/...",
            "backdrop_path": "https://images.unsplash.com/...",
            "release_date": "YYYY-MM-DD",
            "overview": "Detailed plot overview...",
            "vote_average": 8.2
          }
        ]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({
          success: true,
          page: parsed.page || page,
          results: parsed.results || [],
          total_pages: parsed.total_pages || 1,
          total_results: parsed.total_results || 0
        });
      }
    } catch (err: any) {
      console.error("[Proxy Discover] Gemini fallback discover failed:", err);
    }
  }

  // Double static fallback
  const results = STATIC_POPULAR_DRAMAS.map(item => ({
    ...item,
    id: String(item.id),
    type
  }));
  return res.json({
    success: true,
    page: 1,
    results,
    total_pages: 1,
    total_results: results.length
  });
});

// 4. Person Profile & Credits
app.get("/api/person/details", async (req, res) => {
  const id = req.query.id as string;
  if (!id || !id.trim()) {
    return res.status(400).json({ success: false, error: "Missing required parameter: id" });
  }

  const tmdbKey = process.env.TMDB_API_KEY;

  if (tmdbKey && tmdbKey !== "" && !isNaN(Number(id))) {
    try {
      console.log(`[Proxy Person] Querying TMDB for Person ID: ${id}`);
      const tmdbUrl = `https://api.themoviedb.org/3/person/${id}?api_key=${tmdbKey}&append_to_response=combined_credits&language=en-US`;
      const response = await fetch(tmdbUrl);
      if (response.ok) {
        const person = await response.json() as any;
        const creditsCast = person.combined_credits?.cast || [];
        
        const movieCredits = creditsCast
          .filter((c: any) => c.media_type === "movie")
          .slice(0, 10)
          .map((c: any) => ({
            id: String(c.id),
            title: c.title || "Untitled",
            type: "movie",
            character: c.character || "",
            poster_path: formatTmdbImage(c.poster_path, "poster") || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
            backdrop_path: formatTmdbImage(c.backdrop_path, "backdrop") || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
            release_date: c.release_date || "",
            overview: c.overview || "",
            vote_average: c.vote_average || 0.0
          }));

        const tvCredits = creditsCast
          .filter((c: any) => c.media_type === "tv")
          .slice(0, 10)
          .map((c: any) => ({
            id: String(c.id),
            title: c.name || "Untitled",
            type: "tv",
            character: c.character || "",
            poster_path: formatTmdbImage(c.poster_path, "poster") || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600",
            backdrop_path: formatTmdbImage(c.backdrop_path, "backdrop") || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200",
            release_date: c.first_air_date || "",
            overview: c.overview || "",
            vote_average: c.vote_average || 0.0
          }));

        return res.json({
          success: true,
          id: String(person.id),
          name: person.name,
          biography: person.biography || "",
          profile_path: formatTmdbImage(person.profile_path, "poster") || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400",
          birthday: person.birthday || null,
          place_of_birth: person.place_of_birth || null,
          movie_credits: movieCredits,
          tv_credits: tvCredits
        });
      }
    } catch (err: any) {
      console.error(`[Proxy Person] TMDB person details query failed:`, err);
    }
  }

  // Fallback to Gemini if TMDB is offline or key missing
  if (ai) {
    try {
      console.log(`[Proxy Person] Calling Gemini fallback for Person ID: "${id}"`);
      const prompt = `Synthesize biography, birthday, place of birth, and movie/TV credits for a famous Asian actor or production staff member with TMDB ID: "${id}".
      Generate a realistic, high-quality, professional response. Create a detailed biography and realistic, beautiful credits.

      Provide output strictly matching this JSON schema:
      {
        "id": "${id}",
        "name": "Actor/Person Name",
        "biography": "Professional biographical profile of 3-4 sentences detailing awards and background.",
        "profile_path": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400",
        "birthday": "1994-02-22",
        "place_of_birth": "Seoul, South Korea",
        "movie_credits": [
          {
            "id": "m_1",
            "title": "Famous Movie Title",
            "type": "movie",
            "character": "Main Role",
            "poster_path": "https://images.unsplash.com/...",
            "backdrop_path": "https://images.unsplash.com/...",
            "release_date": "YYYY-MM-DD",
            "overview": "Brief description...",
            "vote_average": 8.0
          }
        ],
        "tv_credits": [
          {
            "id": "tv_1",
            "title": "Famous TV Series",
            "type": "tv",
            "character": "Leading Role",
            "poster_path": "https://images.unsplash.com/...",
            "backdrop_path": "https://images.unsplash.com/...",
            "release_date": "YYYY-MM-DD",
            "overview": "Brief description...",
            "vote_average": 8.6
          }
        ]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      if (response.text) {
        const result = JSON.parse(response.text);
        return res.json({ success: true, ...result });
      }
    } catch (err: any) {
      console.error("[Proxy Person] Gemini fallback person query failed:", err);
    }
  }

  // Default hard fallback
  return res.json({
    success: true,
    id,
    name: "HanZone Star",
    biography: "Full biography could not be loaded. Set a TMDB API Key for live credits and bios.",
    profile_path: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400",
    birthday: "1994-01-01",
    place_of_birth: "Seoul, South Korea",
    movie_credits: [],
    tv_credits: []
  });
});

// --- Administration / Custom Links Config Endpoints ---

// Public endpoint to get all custom drama media links (no auth required for app clients)
app.get("/api/get-drama-links", async (req, res) => {
  const links = await loadDramaLinks();
  res.json({ success: true, links });
});

// Get all drama media links (VerifyAdmin)
app.get("/api/admin/drama-links", verifyAdmin, async (req, res) => {
  const links = await loadDramaLinks();
  res.json({ success: true, links });
});

// Update or add a drama media link (VerifyAdmin, commits to GitHub if enabled, or saves locally)
app.post("/api/admin/drama-links", verifyAdmin, async (req, res) => {
  const { id, stream_url, download_url, title, seasons, action, media_type } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, error: "Missing required parameter: id" });
  }

  const links = await loadDramaLinks();
  
  if (action === "delete" || (stream_url === null && download_url === null && !seasons)) {
    // Delete item if everything is cleared or action is delete
    delete links[id];
  } else {
    links[id] = {
      stream_url: stream_url ? String(stream_url).trim() : null,
      download_url: download_url ? String(download_url).trim() : null,
      title: title ? String(title).trim() : links[id]?.title || `Drama (ID: ${id})`,
      media_type: media_type ? String(media_type).trim() : (seasons ? "tv" : "movie"),
      seasons: seasons || (links[id] as any)?.seasons || undefined
    };
  }

  // Save locally and sync with GitHub via the robust helper
  const isSavedToGitHub = await saveDramaLinks(links);

  return res.json({
    success: true,
    message: isSavedToGitHub
      ? "Successfully updated and synced custom media links with GitHub!"
      : "Updated custom media links locally, but GitHub sync failed.",
    isLocalOnly: !isSavedToGitHub,
    links
  });
});

// 1. GitHub: Fetch file content from custom repo
app.post("/api/github/fetch", verifyAdmin, async (req, res) => {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const filePath = process.env.GITHUB_FILE_PATH || "genres.json";
  const branch = process.env.GITHUB_BRANCH || "main";
  const githubToken = process.env.GITHUB_TOKEN;

  const missing = [];
  if (!owner) missing.push("GITHUB_OWNER");
  if (!repo) missing.push("GITHUB_REPO");
  if (!githubToken) missing.push("GITHUB_TOKEN");

  if (missing.length > 0) {
    try {
      const localPath = path.join(process.cwd(), "genres.json");
      let parsedJson;
      if (fs.existsSync(localPath)) {
        console.log("GitHub credentials missing. Falling back to local genres.json file.");
        const fileContent = fs.readFileSync(localPath, "utf-8");
        parsedJson = JSON.parse(fileContent);
      } else {
        console.log("GitHub credentials missing & local file deleted. Recreating genres.json with default genres.");
        fs.writeFileSync(localPath, JSON.stringify(DEFAULT_GENRES, null, 4), "utf-8");
        parsedJson = DEFAULT_GENRES;
      }
      return res.json({
        success: true,
        sha: "",
        isLocalFallback: true,
        data: parsedJson,
        message: "Loaded from local workspace file (GitHub secrets not fully configured)."
      });
    } catch (localErr: any) {
      console.error("Local fallback reading/writing failed:", localErr);
    }

    return res.status(500).json({
      success: false,
      error: `Server is missing GitHub configuration variables: ${missing.join(", ")}. Please define them in Vercel/environment setup.`
    });
  }

  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "Genres-Admin-Dashboard",
    "Authorization": `token ${githubToken}`
  };

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

  try {
    console.log(`Fetching from GitHub Contents API: ${url}`);
    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("File not found on GitHub. Returning DEFAULT_GENRES.");
        return res.json({
          success: true,
          sha: "",
          isNewFile: true,
          data: DEFAULT_GENRES,
          message: "No remote 'genres.json' file found in the repository yet. Initialized with default genres list."
        });
      }
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `GitHub API error (${response.status}): ${errorText}`
      });
    }

    const fileData = await response.json() as any;
    if (fileData.type !== "file") {
      return res.status(400).json({ success: false, error: "The specified path is not a file." });
    }

    // Decode Base64 Content
    const base64Content = fileData.content.replace(/\n/g, "");
    const decodedString = Buffer.from(base64Content, "base64").toString("utf-8");
    
    let parsedJson;
    try {
      parsedJson = JSON.parse(decodedString);
    } catch (err) {
      return res.status(400).json({ 
        success: false, 
        error: "Fetched file content is not valid JSON.",
        rawContent: decodedString 
      });
    }

    res.json({
      success: true,
      sha: fileData.sha,
      data: parsedJson
    });
  } catch (err: any) {
    console.error("Error in GitHub Fetch:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error fetching from GitHub." });
  }
});

// 3. GitHub: Commit update to custom repo (GET SHA -> Decode -> Update -> Encode -> PUT)
app.post("/api/github/update", verifyAdmin, async (req, res) => {
  const { genre: genreName, backdrop, genres: updatedGenresArray, commitMessage } = req.body;

  if (!updatedGenresArray && (!genreName || !backdrop)) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing parameters. Need either 'genres' array or 'genre' and 'backdrop'." 
    });
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const filePath = process.env.GITHUB_FILE_PATH || "genres.json";
  const branch = process.env.GITHUB_BRANCH || "main";
  const githubToken = process.env.GITHUB_TOKEN;

  const missing = [];
  if (!owner) missing.push("GITHUB_OWNER");
  if (!repo) missing.push("GITHUB_REPO");
  if (!githubToken) missing.push("GITHUB_TOKEN");

  if (missing.length > 0) {
    try {
      const localPath = path.join(process.cwd(), "genres.json");
      let existingGenres: any[] = [];
      
      if (updatedGenresArray && Array.isArray(updatedGenresArray)) {
        existingGenres = updatedGenresArray;
      } else {
        if (fs.existsSync(localPath)) {
          console.log("GitHub credentials missing. Attempting to write locally...");
          const fileContent = fs.readFileSync(localPath, "utf-8");
          existingGenres = JSON.parse(fileContent);
        } else {
          console.log("GitHub credentials missing & local file deleted. Recreating genres.json with default genres.");
          existingGenres = JSON.parse(JSON.stringify(DEFAULT_GENRES));
        }

        if (!Array.isArray(existingGenres)) {
          existingGenres = JSON.parse(JSON.stringify(DEFAULT_GENRES));
        }

        const index = existingGenres.findIndex((g: any) => g.name === genreName);
        if (index === -1) {
          existingGenres.push({ name: genreName, bg_url: backdrop, type: "Genre", mv_id: null, tv_id: null });
        } else {
          existingGenres[index].bg_url = backdrop;
        }
      }
      fs.writeFileSync(localPath, JSON.stringify(existingGenres, null, 4), "utf-8");

      return res.json({
        success: true,
        message: "Successfully updated local genres.json file (Development Mode).",
        isLocalFallback: true,
        data: existingGenres
      });
    } catch (localErr: any) {
      console.error("Local fallback writing failed:", localErr);
    }

    return res.status(500).json({
      success: false,
      error: `Server is missing GitHub configuration variables: ${missing.join(", ")}. Please define them in Vercel/environment setup.`
    });
  }

  const headers = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": `token ${githubToken}`,
    "User-Agent": "Genres-Admin-Dashboard",
    "Content-Type": "application/json"
  };

  const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

  try {
    // Step A: Fetch current state of file to resolve SHA
    console.log(`GitHub Update: Fetching current state of file to resolve SHA...`);
    const getResponse = await fetch(getUrl, { headers: { ...headers, "Content-Type": undefined } as any });

    let currentSha = "";
    let existingGenres: any[] = [];

    if (getResponse.ok) {
      const fileData = await getResponse.json() as any;
      currentSha = fileData.sha;
      const base64Content = fileData.content.replace(/\n/g, "");
      const decodedString = Buffer.from(base64Content, "base64").toString("utf-8");
      existingGenres = JSON.parse(decodedString);
    } else if (getResponse.status === 404) {
      // File doesn't exist yet, we will initialize with our DEFAULT_GENRES list!
      console.log("File does not exist on GitHub. Initializing with default starter genres.");
      existingGenres = JSON.parse(JSON.stringify(DEFAULT_GENRES)); 
    } else {
      const errText = await getResponse.text();
      return res.status(getResponse.status).json({
        success: false,
        error: `Failed to fetch file SHA before update (${getResponse.status}): ${errText}`
      });
    }

    // Step B: Apply the update (either complete overwrite or single update)
    if (updatedGenresArray && Array.isArray(updatedGenresArray)) {
      existingGenres = updatedGenresArray;
    } else {
      if (!Array.isArray(existingGenres)) {
        existingGenres = JSON.parse(JSON.stringify(DEFAULT_GENRES));
      }

      const index = existingGenres.findIndex((g: any) => g.name === genreName);
      if (index === -1) {
        existingGenres.push({ name: genreName, bg_url: backdrop, type: "Genre", mv_id: null, tv_id: null });
      } else {
        existingGenres[index].bg_url = backdrop;
      }
    }

    // Step C: Convert back to pretty base64
    const updatedJsonString = JSON.stringify(existingGenres, null, 2);
    const updatedBase64 = Buffer.from(updatedJsonString, "utf-8").toString("base64");

    // Step D: PUT update commit
    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const payload: any = {
      message: commitMessage || `Admin UI: Update backdrop URL for ${genreName} genre`,
      content: updatedBase64,
      branch: branch
    };

    if (currentSha) {
      payload.sha = currentSha;
    }

    console.log(`GitHub Update: Sending PUT commit request to: ${putUrl}`);
    const putResponse = await fetch(putUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload)
    });

    if (!putResponse.ok) {
      const errText = await putResponse.text();
      let customError = `GitHub PUT commit failed (${putResponse.status}): ${errText}`;
      if (putResponse.status === 403 || errText.toLowerCase().includes("permission") || errText.toLowerCase().includes("accessible by personal access token")) {
        customError = `GitHub Access Forbidden (403): Your Personal Access Token (PAT) lacks permissions to write to this repository. INSTRUCTIONS: Please go to your GitHub Settings -> Developer settings -> Personal access tokens -> click your token. Under "Repository permissions", find "Contents" and set it to "Read and write".`;
      } else if (putResponse.status === 401) {
        customError = `GitHub Unauthorized (401): The Personal Access Token (PAT) is invalid, incorrect, or expired.`;
      }
      return res.status(putResponse.status).json({
        success: false,
        error: customError
      });
    }

    const putResult = await putResponse.json() as any;
    res.json({
      success: true,
      message: "Successfully committed changes to GitHub repository!",
      commitSha: putResult.commit.sha,
      htmlUrl: putResult.content.html_url,
      data: existingGenres
    });
  } catch (err: any) {
    console.error("Error committing to GitHub:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error during GitHub commit." });
  }
});

// 4. Gemini AI: Dynamic High-Thinking integration guidance assistant
app.post("/api/gemini/assist", verifyAdmin, async (req, res) => {
  const { prompt, chatHistory } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, error: "Prompt is required." });
  }

  const systemInstruction = `You are a world-class Android developer and Kotlin Native expert. Your specialty is high-performance dynamic networking, image rendering with Coil, list/grid caching, and architectural clean code with Retrofit, Ktor, and Coroutines.
  You will help the user understand how to build their Kotlin Native app to pull data from a Git-based Vercel Static CDN.
  Use professional developer terms, provide perfect code snippets, and maintain an informative and helpful tone.
  Explain options like Ktor vs Retrofit, image scales, offline handling, and localized fallbacks clearly.
  If the user asks questions about setup or debugging, give detailed steps.`;

  // Educational mode if API key is not present
  if (!ai) {
    console.log("Falling back to AI simulation mode (no API key configured)");
    const simulatedResponse = `[Educational Fallback Mode - Set your GEMINI_API_KEY in the Secrets panel for fully active AI reasoning]

Here is professional developer guidance for your query: "${prompt}"

### Recommended Android Integration Approach
For a Kotlin Native / Jetpack Compose Android app reading your dynamic genres from Vercel:

1. **Retrofit Configuration:**
\`\`\`kotlin
interface GenresApiService {
    @GET("simplified_dramas.json")
    suspend fun getGenres(): List<Genre>
}
\`\`\`

2. **Coil Image Caching:**
Coil handles caching out-of-the-box by combining an in-memory bitmap cache and disk cache. Configure your \`AsyncImage\` in Jetpack Compose:
\`\`\`kotlin
AsyncImage(
    model = ImageRequest.Builder(LocalContext.current)
        .data(genre.backdropUrl)
        .crossfade(true)
        .placeholder(R.drawable.genre_placeholder)
        .error(R.drawable.genre_error)
        .build(),
    contentDescription = genre.name,
    contentScale = ContentScale.Crop,
    modifier = Modifier.fillMaxSize()
)
\`\`\`

Feel free to paste your actual Kotlin questions or ask how to setup offline retry policies using Ktor!`;

    return res.json({ success: true, text: simulatedResponse });
  }

  try {
    console.log("Calling Gemini API with thinkingLevel: HIGH...");
    
    // Map history if provided
    const contents: any[] = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: contents,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH
        }
      }
    });

    res.json({
      success: true,
      text: response.text
    });
  } catch (err: any) {
    console.error("Gemini API error:", err);
    res.status(500).json({ 
      success: false, 
      error: `Gemini reasoning failed: ${err.message || err}. Ensure your API key is correctly configured in Settings > Secrets.` 
    });
  }
});

// --- Vite Middleware / Static Asset Configuration ---
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  import("vite").then(({ createServer }) => {
    createServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
    });
  }).catch((err) => {
    console.error("Failed to load Vite server dynamically:", err);
  });
} else if (!process.env.VERCEL) {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export default app;
