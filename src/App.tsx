import React, { useState, useEffect, useRef } from "react";
import { 
  Database, 
  GitBranch, 
  Github, 
  Globe, 
  RefreshCw, 
  Save, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Image as ImageIcon, 
  ImageOff,
  Smartphone, 
  Code, 
  Sparkles, 
  Send, 
  Copy, 
  Info,
  Layers,
  User,
  ExternalLink,
  ChevronRight,
  Eye,
  Settings2,
  Home,
  Search,
  Grid,
  Sun,
  Moon,
  Trash2,
  Plus,
  Tag,
  Pencil,
  X
} from "lucide-react";
import { Genre, GitHubConfig, ChatMessage } from "./types";
import { kotlinTemplates } from "./codeTemplates";

const BACKDROP_PRESETS = [
  { name: "Sci-Fi / Cyberpunk", url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&q=80&w=1200" },
  { name: "Romance / Heartfelt", url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1200" },
  { name: "Action / Fast Lane", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=1200" },
  { name: "Thriller / Dark Fog", url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=1200" },
  { name: "Comedy / Fun", url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=1200" },
  { name: "K-Drama / Autumn", url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200" },
  { name: "Fantasy / Adventure", url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1200" },
  { name: "Horror / Dark Woods", url: "https://images.unsplash.com/photo-1505635552518-3448ff116af3?auto=format&fit=crop&q=80&w=1200" }
];

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem("admin_theme") === "dark";
  });

  // Security Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("admin_authenticated") === "true";
  });
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return sessionStorage.getItem("admin_password") || "";
  });
  const [loginError, setLoginError] = useState<string>("");

  // Genres list state
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<string>("");
  const [backdropInputUrl, setBackdropInputUrl] = useState<string>("");
  const [imageError, setImageError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(false);
  const [statusLogs, setStatusLogs] = useState<{ time: string; text: string; type: "info" | "success" | "error" }[]>([]);
  
  // Custom states for Add/Edit Genre Dashboard
  const [genreNameInput, setGenreNameInput] = useState<string>("");
  const [genreTypeInput, setGenreTypeInput] = useState<string>("Genre");
  const [mvIdInput, setMvIdInput] = useState<string>("");
  const [tvIdInput, setTvIdInput] = useState<string>("");
  const [genreBgUrlInput, setGenreBgUrlInput] = useState<string>("");
  const [editingOriginalName, setEditingOriginalName] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Quick background edit section states
  const [quickSelectName, setQuickSelectName] = useState<string>("");
  const [quickBgUrl, setQuickBgUrl] = useState<string>("");

  // Android preview simulator states
  const [selectedPreviewGenreId, setSelectedPreviewGenreId] = useState<string>("");
  
  // Code templates
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("compose");
  const [copiedKey, setCopiedKey] = useState<string>("");

  // Gemini assistant states
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am your Kotlin Native & Android integration assistant. Ask me anything about configuring Retrofit/Ktor, setting up Coil disk caching, or handling offline retry states in Jetpack Compose.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helper to add logs
  const addLog = (text: string, type: "info" | "success" | "error" = "info") => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setStatusLogs(prev => [{ time: now, text, type }, ...prev].slice(0, 50));
  };

  // Helper to select a genre for editing and populate form inputs
  const selectGenreForEditing = (g: Genre) => {
    setEditingOriginalName(g.name);
    setGenreNameInput(g.name);
    setGenreTypeInput(g.type || "Genre");
    setMvIdInput(g.mv_id !== null && g.mv_id !== undefined ? String(g.mv_id) : "");
    setTvIdInput(g.tv_id !== null && g.tv_id !== undefined ? String(g.tv_id) : "");
    setGenreBgUrlInput(g.bg_url);
    setSelectedGenreId(g.name);
    setSelectedPreviewGenreId(g.name);
    setBackdropInputUrl(g.bg_url);
  };

  const handleSelectGenreToEdit = (g: Genre) => {
    selectGenreForEditing(g);
    setIsEditModalOpen(true);
  };

  // Helper to enter "Add" mode and reset form inputs
  const startAddMode = () => {
    setEditingOriginalName(null);
    setGenreNameInput("");
    setGenreTypeInput("Genre");
    setMvIdInput("");
    setTvIdInput("");
    setGenreBgUrlInput("");
    setSelectedPreviewGenreId("");
    setSelectedGenreId("");
    setBackdropInputUrl("");
  };

  const handleStartAddMode = () => {
    startAddMode();
    setIsEditModalOpen(true);
  };

  // Load production data
  const loadData = async () => {
    setLoading(true);
    addLog("Connecting to secure GitHub Repository CDN on backend...", "info");
    try {
      const response = await fetch("/api/github/fetch", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        }
      });
      const json = await response.json();
      if (json.success) {
        setGenres(json.data);
        if (json.data.length > 0) {
          selectGenreForEditing(json.data[0]);
        } else {
          startAddMode();
        }
        addLog(`Authenticated successfully! Fetched production data securely (SHA: ${json.sha ? json.sha.substring(0, 7) : "N/A"})`, "success");
      } else {
        addLog(`Fetch Error: ${json.error}`, "error");
      }
    } catch (err: any) {
      addLog(`Connection failed: ${err.message}`, "error");
    }
    setLoading(false);
  };

  // Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword })
      });
      const json = await response.json();
      if (response.ok && json.success) {
        sessionStorage.setItem("admin_authenticated", "true");
        sessionStorage.setItem("admin_password", adminPassword);
        setIsAuthenticated(true);
        addLog("Administrator authenticated successfully.", "success");
      } else {
        setLoginError(json.error || "Authentication failed. Incorrect password.");
      }
    } catch (err: any) {
      setLoginError(err.message || "Could not connect to the API server.");
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("admin_password");
    setIsAuthenticated(false);
    setAdminPassword("");
    setGenres([]);
  };

  // Sync theme choices to body and local storage
  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark");
      document.body.style.backgroundColor = "#0a0f1d";
      document.body.style.color = "#f8fafc";
      localStorage.setItem("admin_theme", "dark");
    } else {
      document.body.classList.remove("dark");
      document.body.style.backgroundColor = "#f8fafc";
      document.body.style.color = "#1e293b";
      localStorage.setItem("admin_theme", "light");
    }
  }, [isDark]);

  // Initialize/Reload data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Sync quick edit bg URL with selection
  useEffect(() => {
    if (quickSelectName) {
      const g = genres.find(x => x.name === quickSelectName);
      if (g) {
        setQuickBgUrl(g.bg_url);
      }
    } else if (genres.length > 0) {
      setQuickSelectName(genres[0].name);
      setQuickBgUrl(genres[0].bg_url);
    }
  }, [quickSelectName, genres]);

  // Reset image error state whenever background input URL changes
  useEffect(() => {
    setImageError(false);
  }, [genreBgUrlInput]);

  // Sync scroll on chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle active genre selection
  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const genre = genres.find(g => g.name === id);
    if (genre) {
      selectGenreForEditing(genre);
    }
  };

  // Add or Update genre (commit full state to github)
  const handleSaveGenre = async () => {
    if (!genreNameInput.trim()) {
      addLog("Name cannot be empty.", "error");
      return;
    }
    if (!genreBgUrlInput.trim()) {
      addLog("Background backdrop URL is required.", "error");
      return;
    }

    setLoading(true);
    addLog(`Preparing transaction payload...`, "info");

    const parseNumber = (val: string): number | null => {
      const parsed = parseInt(val.trim(), 10);
      return isNaN(parsed) ? null : parsed;
    };

    const newGenreObj: Genre = {
      name: genreNameInput.trim(),
      type: genreTypeInput.trim() || "Genre",
      mv_id: parseNumber(mvIdInput),
      tv_id: parseNumber(tvIdInput),
      bg_url: genreBgUrlInput.trim()
    };

    let updatedGenresList: Genre[] = [];

    if (editingOriginalName) {
      // Edit mode: locate original item by key name and update
      const index = genres.findIndex(g => g.name === editingOriginalName);
      if (index !== -1) {
        updatedGenresList = [...genres];
        updatedGenresList[index] = newGenreObj;
        addLog(`Updated category '${editingOriginalName}' details locally.`, "info");
      } else {
        updatedGenresList = [...genres, newGenreObj];
        addLog(`Added category '${newGenreObj.name}' locally.`, "info");
      }
    } else {
      // Add mode: reject if a genre of the same name already exists
      const exists = genres.some(g => g.name.toLowerCase() === newGenreObj.name.toLowerCase());
      if (exists) {
        addLog(`Cannot create duplicate: A category with the name '${newGenreObj.name}' already exists.`, "error");
        setLoading(false);
        return;
      }
      updatedGenresList = [...genres, newGenreObj];
      addLog(`Added brand new category '${newGenreObj.name}' locally.`, "info");
    }

    try {
      const commitMsg = editingOriginalName 
        ? `Admin UI: Update category '${editingOriginalName}' details` 
        : `Admin UI: Add new category '${newGenreObj.name}'`;

      addLog("Initiating secure backend GitHub commit sequence...", "info");
      const response = await fetch("/api/github/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({
          genres: updatedGenresList,
          commitMessage: commitMsg
        })
      });
      const json = await response.json();
      if (json.success) {
        setGenres(json.data);
        // Select the saved item
        const savedItem = json.data.find((g: any) => g.name === newGenreObj.name) || json.data[0];
        if (savedItem) {
          selectGenreForEditing(savedItem);
        }
        setIsEditModalOpen(false);
        addLog(`Commit complete! SHA: ${json.commitSha ? json.commitSha.substring(0, 8) : "N/A"}`, "success");
        addLog("GitHub response: File successfully updated on CDN branch. Vercel webhook will redeploy.", "success");
      } else {
        addLog(`Save Failed: ${json.error}`, "error");
      }
    } catch (err: any) {
      addLog(`Failed to deliver save payload: ${err.message}`, "error");
    }
    setLoading(false);
  };

  // Remove genre (delete and commit full state to github)
  const handleRemoveGenre = async () => {
    if (!editingOriginalName) return;

    if (!window.confirm(`Are you sure you want to remove '${editingOriginalName}'? This action will update the repository.`)) {
      return;
    }

    setLoading(true);
    addLog(`Initiating delete transaction for '${editingOriginalName}'...`, "info");

    const updatedGenresList = genres.filter(g => g.name !== editingOriginalName);

    try {
      addLog("Committing deletion to secure backend...", "info");
      const response = await fetch("/api/github/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({
          genres: updatedGenresList,
          commitMessage: `Admin UI: Remove category '${editingOriginalName}'`
        })
      });
      const json = await response.json();
      if (json.success) {
        setGenres(json.data);
        if (json.data.length > 0) {
          selectGenreForEditing(json.data[0]);
        } else {
          startAddMode();
        }
        setIsEditModalOpen(false);
        addLog("Successfully removed category and committed changes to CDN.", "success");
      } else {
        addLog(`Removal Failed: ${json.error}`, "error");
      }
    } catch (err: any) {
      addLog(`Failed to deliver delete payload: ${err.message}`, "error");
    }
    setLoading(false);
  };

  // Quick background update handlers
  const handleQuickSave = async () => {
    if (!quickSelectName) return;
    const g = genres.find(x => x.name === quickSelectName);
    if (!g) return;

    setLoading(true);
    addLog(`Quick-updating bg_url for '${quickSelectName}'...`, "info");

    const updatedGenreObj: Genre = {
      ...g,
      bg_url: quickBgUrl.trim()
    };

    const updatedGenresList = genres.map(x => x.name === quickSelectName ? updatedGenreObj : x);

    try {
      addLog("Committing changes to secure backend...", "info");
      const response = await fetch("/api/github/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({
          genres: updatedGenresList,
          commitMessage: `Admin UI: Quick update bg_url for '${quickSelectName}'`
        })
      });
      const json = await response.json();
      if (json.success) {
        setGenres(json.data);
        addLog(`Successfully updated background URL for '${quickSelectName}'!`, "success");
      } else {
        addLog(`Quick Save Failed: ${json.error}`, "error");
      }
    } catch (err: any) {
      addLog(`Quick Save failed: ${err.message}`, "error");
    }
    setLoading(false);
  };

  const handleQuickReset = () => {
    if (!quickSelectName) return;
    const g = genres.find(x => x.name === quickSelectName);
    if (g) {
      setQuickBgUrl(g.bg_url);
      addLog(`Reset background URL field to original value for '${quickSelectName}'.`, "info");
    }
  };

  // Send message to Gemini AI Assistant
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || aiLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");

    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: userMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);
    setAiLoading(true);

    try {
      const chatHistory = chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch("/api/gemini/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg, chatHistory })
      });

      const json = await response.json();
      if (json.success) {
        setChatMessages(prev => [...prev, {
          id: Math.random().toString(),
          role: "assistant",
          content: json.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          id: Math.random().toString(),
          role: "assistant",
          content: `Failed to contact the assistant. ${json.error}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (error: any) {
      setChatMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: "assistant",
        content: `Error: ${error.message || "Failed to communicate with local development API server."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  // Active genre details helper
  const activeGenrePreview = genres.find(g => g.name === selectedPreviewGenreId) || genres[0];

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-sans p-6 transition-colors duration-300 relative ${
        isDark ? "bg-[#0a0f1d]" : "bg-[#f1f5f9]"
      }`}>
        {/* Floating Theme Toggle during Login */}
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all duration-300 shadow-sm ${
              isDark 
                ? "bg-[#0d1326] hover:bg-[#16203a] text-amber-400 border-[#1e2942]" 
                : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>

        <div className={`w-full max-w-md rounded-2xl border overflow-hidden shadow-xl transition-all duration-300 ${
          isDark ? "bg-[#0d1326] border-[#1e2942]" : "bg-white border-slate-200"
        }`}>
          {/* Top colored accent header */}
          <div className="bg-slate-900 px-8 py-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-950/20 to-indigo-950/20"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md mb-3">
                H
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">HanZone Admin</h2>
              <p className="text-slate-400 text-xs mt-1">
                Enter your security password to access the dynamic genre asset manager.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Administrator Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  className={`w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-sm transition-all ${
                    isDark 
                      ? "bg-[#0a0f1d] border-[#1e2942] text-slate-100 placeholder-slate-700" 
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                  }`}
                  required
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Unlock Console
                </>
              )}
            </button>
          </form>

          <div className={`px-8 py-4 border-t text-center text-[11px] font-medium transition-colors duration-300 ${
            isDark ? "bg-[#070b16] border-[#11182c] text-slate-400" : "bg-slate-50 border-slate-100 text-slate-400"
          }`}>
            Protected by <span className="font-mono text-rose-600">ADMIN_PASSWORD</span> env variable.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${
      isDark ? "bg-[#0a0f1d] text-slate-100" : "bg-[#f8fafc] text-slate-800"
    } font-sans overflow-hidden`}>
      {/* Header Navigation */}
      <nav id="navbar" className={`h-16 flex items-center justify-between px-8 transition-colors duration-300 border-b shrink-0 ${
        isDark ? "bg-[#0d1326] border-[#1e2942] shadow-md" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
            H
          </div>
          <div>
            <span className={`font-extrabold tracking-tight text-lg transition-colors duration-300 ${isDark ? "text-white" : "text-slate-900"}`}>HanZone Admin</span>
            <span className={`ml-3 px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase transition-colors duration-300 ${
              isDark 
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60" 
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              API Live
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-lg transition-all duration-300 border flex items-center justify-center gap-1.5 ${
              isDark 
                ? "bg-[#121b33] hover:bg-[#1b274a] text-amber-400 border-[#1e2942] shadow-inner" 
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 shadow-sm"
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>
      </nav>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <aside id="sidebar" className={`w-72 transition-colors duration-300 border-r p-6 flex flex-col gap-6 overflow-y-auto shrink-0 ${
          isDark ? "bg-[#0d1326] border-[#1e2942]" : "bg-white border-slate-200"
        }`}>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">API Data Connection</p>
            
            <div className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors duration-300 ${
              isDark 
                ? "bg-indigo-950/40 border-indigo-900/40 text-indigo-200" 
                : "bg-indigo-50 border-indigo-100 text-indigo-900"
            }`}>
              <Settings2 className={`w-4 h-4 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
              <span className="text-xs font-bold">GitHub Repository Integration</span>
            </div>
            
            <p className="text-[11px] text-slate-400 mt-2 italic">
              Commits JSON changes in real-time to your custom public GitHub repository.
            </p>
          </div>

          {/* GitHub configuration details */}
          <div className={`flex flex-col gap-3 p-4 border rounded-xl transition-all duration-300 ${
            isDark ? "bg-[#121b33] border-[#1e2942]" : "bg-slate-50 border-slate-100"
          }`}>
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase">
              <Github className="w-4 h-4" />
              Production CDN Config
            </div>
            
            <div className={`text-[11px] transition-colors duration-300 space-y-2 ${isDark ? "text-slate-300" : "text-slate-500"}`}>
              <p>
                GitHub parameters are now <span className="font-semibold text-emerald-500">securely stored on the backend</span> to protect secrets.
              </p>
              <div className={`border-t pt-2 space-y-1 font-mono text-[10px] transition-colors duration-300 ${isDark ? "border-[#1e2942]" : "border-slate-200/60"}`}>
                <div className="flex justify-between">
                  <span className="text-slate-400">Owner:</span>
                  <span className={`font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Repository:</span>
                  <span className={`font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">File Path:</span>
                  <span className={`font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Branch:</span>
                  <span className={`font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Configured</span>
                </div>
              </div>
            </div>

            <button 
              id="btn-fetch-github"
              onClick={() => loadData()}
              disabled={loading}
              className="w-full mt-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Reload Production Data
            </button>
          </div>

        </aside>

        {/* Dashboard Panels */}
        <main id="main-content" className="flex-1 flex flex-col p-6 overflow-hidden gap-6">
          
          {/* Top segment: Grid of Edit tools and Interactive Android Mockup */}
          <div className="flex-1 flex flex-col min-h-0">
            
            {/* Main Category Grid Workspace */}
            <section className="flex-1 flex flex-col gap-5 overflow-hidden pb-4">
              
              {/* Header and Visual Search Bar */}
              <div className="flex flex-col gap-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={`text-2xl font-black tracking-tight transition-colors duration-300 ${isDark ? "text-white" : "text-slate-900"}`}>
                      Genres & Keywords
                    </h1>
                    <p className={`text-xs mt-0.5 transition-colors duration-300 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Manage cinematic categories and discovery assets served directly to Android.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {genres.filter(g => g.type?.toLowerCase() === "genre").length} Genres
                    </span>
                    <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {genres.filter(g => g.type?.toLowerCase() === "keyword").length} Keywords
                    </span>
                  </div>
                </div>

                {/* Search & Actions Bar */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                    <input
                      id="search-genres-input"
                      type="text"
                      placeholder="Search categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full h-9 pl-9 pr-4 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        isDark 
                          ? "bg-[#11192e] border-[#1e2942] text-white placeholder-slate-500 border" 
                          : "bg-slate-100 border-transparent text-slate-800 placeholder-slate-400 border"
                      }`}
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-bold"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <button
                    id="btn-add-genre-grid"
                    onClick={handleStartAddMode}
                    className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Add Category
                  </button>
                </div>
              </div>

              {/* Quick Background URL Updater Section */}
              <div className={`p-4 border rounded-2xl transition-all duration-300 flex flex-col lg:flex-row items-center gap-4 shrink-0 shadow-sm ${
                isDark ? "bg-[#0d1326] border-[#1e2942]" : "bg-white border-slate-200"
              }`}>
                <div className="flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-wider shrink-0">
                  <ImageIcon className="w-4.5 h-4.5 text-indigo-400" />
                  Quick Backdrop Editor
                </div>

                <div className="flex-1 flex flex-col md:flex-row items-center gap-4 w-full">
                  {/* Select Category */}
                  <div className="flex-1 flex items-center gap-2.5 w-full">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">Category</label>
                    <select
                      value={quickSelectName}
                      onChange={(e) => setQuickSelectName(e.target.value)}
                      className={`flex-1 h-9 px-3 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 border ${
                        isDark 
                          ? "bg-[#0a0f1d] border-[#1e2942] text-slate-200" 
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      {genres.map((g) => (
                        <option key={g.name} value={g.name}>
                          {g.name} ({g.type || "Genre"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Backdrop URL Input */}
                  <div className="flex-[2] flex items-center gap-2.5 w-full">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">Backdrop URL</label>
                    <input
                      type="text"
                      value={quickBgUrl}
                      onChange={(e) => setQuickBgUrl(e.target.value)}
                      placeholder="Paste image backdrop URL..."
                      className={`flex-1 h-9 px-3 rounded-xl text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 border ${
                        isDark 
                          ? "bg-[#0a0f1d] border-[#1e2942] text-slate-300 placeholder-slate-600" 
                          : "bg-slate-50 border-slate-200 text-slate-600 placeholder-slate-400"
                      }`}
                    />
                  </div>
                </div>

                {/* Actions & Buttons */}
                <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleQuickReset}
                    className={`h-9 px-4 rounded-xl text-xs font-black tracking-wide transition-all border active:scale-[0.98] ${
                      isDark
                        ? "bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickSave}
                    disabled={loading}
                    className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black tracking-wide rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save URL
                  </button>
                </div>
              </div>

              {/* Main Workspace Scrollable Card Grid */}
              <div className="flex-1 overflow-y-auto pr-1">
                {genres.length === 0 ? (
                  <div className={`rounded-2xl border-2 border-dashed p-12 text-center flex flex-col items-center justify-center gap-3 ${
                    isDark ? "border-[#1e2942] bg-[#0c1224]" : "border-slate-200 bg-slate-50"
                  }`}>
                    <ImageIcon className="w-8 h-8 text-indigo-400 opacity-60" />
                    <div>
                      <p className={`text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>No categories found</p>
                      <p className="text-xs text-slate-500 mt-1">Start by loading production data or creating a category.</p>
                    </div>
                    <button
                      onClick={handleStartAddMode}
                      className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Create First Category
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
                    
                    {/* Add New Interactive Dotted Card */}
                    <div
                      id="card-add-new-trigger"
                      onClick={handleStartAddMode}
                      className={`group aspect-[14/10] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                        isDark 
                          ? "border-[#1e2942] hover:border-indigo-500 bg-[#0c1224]/50 hover:bg-indigo-500/5 text-slate-400 hover:text-indigo-400" 
                          : "border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-5/50 text-slate-500 hover:text-indigo-600"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-500/10 group-hover:bg-indigo-500/15 group-hover:scale-110 transition-all duration-300">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black tracking-wide">Create New Card</span>
                    </div>

                    {/* Filtered Category Cards */}
                    {genres
                      .filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((g) => {
                        const isSelected = selectedPreviewGenreId === g.name;
                        const isKeyword = g.type?.toLowerCase() === "keyword";
                        return (
                          <div
                            key={g.name}
                            onClick={() => handleSelectGenreToEdit(g)}
                            className={`group relative aspect-[14/10] rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 shadow-sm ${
                              isSelected 
                                ? isDark 
                                  ? "border-rose-500 shadow-rose-950/20 scale-[0.98] ring-2 ring-rose-500/40" 
                                  : "border-rose-500 shadow-rose-200/50 scale-[0.98] ring-2 ring-rose-500/40"
                                : isDark
                                  ? "border-[#1f2c4d] bg-[#0c1224] hover:border-[#354877]"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            {/* Card Background Image with Rich Scrim Overlay */}
                            <img
                              src={g.bg_url}
                              alt={g.name}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                              onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1574267431629-2e570b0643ba?q=80&w=400"; }}
                            />
                            
                            {/* High-Contrast Gradient Scrim */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10 transition-opacity group-hover:opacity-90"></div>
                            
                            {/* Floating Metadata & Badges */}
                            <div className="absolute inset-0 p-3 z-20 flex flex-col justify-between">
                              {/* Top Bar with Type Badge */}
                              <div className="flex items-start justify-between">
                                <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded tracking-wider shadow ${
                                  isKeyword 
                                    ? "bg-purple-600/90 text-white" 
                                    : "bg-indigo-600/90 text-white"
                                }`}>
                                  {isKeyword ? "Keyword" : "Genre"}
                                </span>
                              </div>

                              {/* Bottom Category Label */}
                              <div className="text-left leading-tight">
                                <h3 className="text-xs font-black text-white tracking-wide drop-shadow truncate">
                                  {g.name}
                                </h3>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Collapsible/Sleek Process Console at the Bottom */}
              <div className={`rounded-2xl p-4 flex flex-col font-mono text-[10px] min-h-[120px] max-h-[140px] border shadow-sm transition-all duration-300 shrink-0 ${
                isDark 
                  ? "bg-[#060a15] border-[#131d33] text-indigo-200" 
                  : "bg-slate-900 border-slate-950 text-slate-300"
              }`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5 font-bold shrink-0">
                  <span className="flex items-center gap-1 text-slate-300 uppercase tracking-wider text-[11px]">
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    Live Repository Console
                  </span>
                  <button 
                    onClick={() => setStatusLogs([])}
                    className="text-slate-500 hover:text-slate-300 text-[9px] hover:underline transition-colors"
                  >
                    Clear Feed
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {statusLogs.length === 0 ? (
                    <div className="text-slate-600 text-center py-4 italic">Feed is empty. Complete saves, deletions, or data reloads to log secure GitHub CDN branch operations.</div>
                  ) : (
                    statusLogs.map((log, index) => (
                      <div key={index} className="flex gap-2 items-start leading-relaxed text-left">
                        <span className="text-slate-600 shrink-0 font-bold">[{log.time}]</span>
                        <span className={
                          log.type === "success" ? "text-emerald-400 font-bold" :
                          log.type === "error" ? "text-red-400 font-bold" : "text-indigo-300"
                        }>
                          {log.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Premium Glassmorphism Edit Modal Drawer overlay */}
              {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                  <div 
                    className={`w-full max-w-xl rounded-2xl border shadow-2xl p-6 relative flex flex-col gap-4 text-left transition-all max-h-[90vh] overflow-y-auto ${
                      isDark 
                        ? "bg-[#0b1224]/95 border-[#1e2d4d] text-slate-100 shadow-indigo-950/20" 
                        : "bg-white border-slate-200 text-slate-800 shadow-slate-300"
                    }`}
                  >
                    {/* Modal Close button */}
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-500/10 transition-colors text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="border-b pb-3 transition-colors duration-300 border-slate-700/30">
                      <h2 className="text-lg font-black tracking-tight">
                        {editingOriginalName ? `Edit Category Details` : "Add New Category"}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {editingOriginalName 
                          ? `Modifying metadata for '${editingOriginalName}' category.` 
                          : "Create a new entry with custom visual resources and TMDB mapping."}
                      </p>
                    </div>

                    {/* Form Layout */}
                    <div className="flex flex-col gap-4">
                      
                      {/* Grid for Name and TMDB IDs */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Name Input */}
                        <div className="flex flex-col gap-1.5 sm:col-span-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Category Name</label>
                          <input 
                            id="modal-genre-name"
                            type="text" 
                            value={genreNameInput}
                            onChange={(e) => setGenreNameInput(e.target.value)}
                            placeholder="e.g. Romance..."
                            className={`w-full h-10 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-xs transition-colors duration-300 border ${
                              isDark 
                                ? "bg-[#11192e] border-[#1e2942] text-slate-100 placeholder-slate-600" 
                                : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                            }`}
                          />
                        </div>

                        {/* Movie ID */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Movie TMDB ID (mv_id)</label>
                          <input 
                            id="modal-genre-mv-id"
                            type="text" 
                            value={mvIdInput}
                            onChange={(e) => setMvIdInput(e.target.value)}
                            placeholder="e.g. 10749..."
                            className={`w-full h-10 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs transition-colors duration-300 border ${
                              isDark 
                                ? "bg-[#11192e] border-[#1e2942] text-slate-100 placeholder-slate-600" 
                                : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                            }`}
                          />
                        </div>

                        {/* TV ID */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">TV TMDB ID (tv_id)</label>
                          <input 
                            id="modal-genre-tv-id"
                            type="text" 
                            value={tvIdInput}
                            onChange={(e) => setTvIdInput(e.target.value)}
                            placeholder="e.g. 10766..."
                            className={`w-full h-10 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs transition-colors duration-300 border ${
                              isDark 
                                ? "bg-[#11192e] border-[#1e2942] text-slate-100 placeholder-slate-600" 
                                : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Type Tab Selector */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Category Classification</label>
                        <div className={`flex p-1 rounded-xl border transition-colors duration-300 ${
                          isDark ? "bg-[#11192e] border-[#1e2942]" : "bg-slate-100 border-slate-200"
                        }`}>
                          <button
                            type="button"
                            onClick={() => setGenreTypeInput("Genre")}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              genreTypeInput.toLowerCase() === "genre"
                                ? isDark 
                                  ? "bg-indigo-600 text-white shadow" 
                                  : "bg-white text-indigo-900 shadow-sm"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            Genre Category
                          </button>
                          <button
                            type="button"
                            onClick={() => setGenreTypeInput("Keyword")}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              genreTypeInput.toLowerCase() === "keyword"
                                ? isDark 
                                  ? "bg-indigo-600 text-white shadow" 
                                  : "bg-white text-indigo-900 shadow-sm"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            Keyword Tag
                          </button>
                        </div>
                      </div>

                      {/* Input Backdrop Image URL */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Backdrop Backdrop Image (URL)</label>
                        <input 
                          id="modal-backdrop-url"
                          type="text" 
                          value={genreBgUrlInput}
                          onChange={(e) => setGenreBgUrlInput(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className={`w-full h-10 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs transition-colors duration-300 border ${
                            isDark 
                              ? "bg-[#11192e] border-[#1e2942] text-slate-100 placeholder-slate-600" 
                              : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                          }`}
                        />
                      </div>



                      {/* Real-time Backdrop Preview Box */}
                      <div className="flex flex-col gap-1.5 mt-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Dynamic Preview</label>
                        {genreBgUrlInput ? (
                          <div className={`relative h-60 md:h-72 w-full rounded-xl overflow-hidden border flex items-center justify-center group transition-colors duration-300 p-2 ${
                            isDark ? "border-[#1e2942] bg-[#0c1224]" : "border-slate-200 bg-slate-50"
                          }`}>
                            {!imageError ? (
                              <img
                                src={genreBgUrlInput}
                                alt="Backdrop asset preview"
                                className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                                referrerPolicy="no-referrer"
                                onError={() => setImageError(true)}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1 text-rose-500 font-bold text-xs">
                                <ImageOff className="w-5 h-5 opacity-80" />
                                <span>Unable to load backdrop URL</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`h-40 w-full rounded-xl border border-dashed flex flex-col items-center justify-center gap-1.5 text-xs transition-colors duration-300 ${
                            isDark 
                              ? "border-[#1e2942] bg-[#0c1224] text-slate-500" 
                              : "border-slate-200 bg-slate-50 text-slate-400"
                          }`}>
                            <ImageIcon className="w-5 h-5 opacity-60" />
                            <span>Select a preset or input a background URL above</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-700/30 mt-2">
                      <button 
                        id="modal-btn-save"
                        onClick={handleSaveGenre}
                        disabled={loading}
                        className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        Save Categories & Push CDN
                      </button>
                      
                      {editingOriginalName && (
                        <button 
                          id="modal-btn-remove"
                          onClick={handleRemoveGenre}
                          disabled={loading}
                          className="px-4 h-10 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all active:scale-[0.98] text-xs flex items-center gap-1.5 shadow-sm"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}

                      <button 
                        id="modal-btn-close"
                        onClick={() => setIsEditModalOpen(false)}
                        className={`px-4 h-10 font-bold rounded-xl transition-colors text-xs ${
                          isDark 
                            ? "bg-[#11192e] text-slate-300 hover:bg-[#1a2544] border border-[#1e2d4d]" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Close
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </section>

          </div>

        </main>
      </div>
    </div>
  );
}
