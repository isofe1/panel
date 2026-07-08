import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
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

const app = express();
app.use(express.json({ limit: "5mb" }));

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
    const { genre: genreName, backdrop, commitMessage } = req.body;

    if (!genreName || !backdrop) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing parameters. Need genre and backdrop." 
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
      // Step A: Fetch current file to get active SHA and content
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
        // File doesn't exist yet, we will create a new one!
        console.log("File does not exist on GitHub. A new file will be created.");
        existingGenres = []; 
      } else {
        const errText = await getResponse.text();
        return res.status(getResponse.status).json({
          success: false,
          error: `Failed to fetch file SHA before update (${getResponse.status}): ${errText}`
        });
      }

      // Step B: Apply the backdrop image URL update
      if (!Array.isArray(existingGenres)) {
        return res.status(400).json({ 
          success: false, 
          error: "GitHub file content is not a valid JSON array of genres." 
        });
      }

      const index = existingGenres.findIndex((g: any) => g.genre === genreName);
      if (index === -1) {
        return res.status(404).json({ 
          success: false, 
          error: `Genre '${genreName}' not found in the GitHub file.` 
        });
      }

      existingGenres[index].backdrop = backdrop;

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
        return res.status(putResponse.status).json({
          success: false,
          error: `GitHub PUT commit failed (${putResponse.status}): ${errText}`
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
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
    }).catch((err) => {
      console.error("Failed to create Vite server:", err);
    });
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }

  export default app;
