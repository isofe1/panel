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
  Moon
} from "lucide-react";
import { Genre, GitHubConfig, ChatMessage } from "./types";
import { kotlinTemplates } from "./codeTemplates";

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
          const first = json.data[0];
          setSelectedGenreId(first.genre);
          setSelectedPreviewGenreId(first.genre);
          setBackdropInputUrl(first.backdrop);
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
      document.body.style.backgroundColor = "#0f172a";
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

  // Reset image error state whenever backdrop input changes
  useEffect(() => {
    setImageError(false);
  }, [backdropInputUrl]);

  // Sync scroll on chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle active genre dropdown change
  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedGenreId(id);
    setSelectedPreviewGenreId(id);
    const genre = genres.find(g => g.genre === id);
    if (genre) {
      setBackdropInputUrl(genre.backdrop);
    }
  };

  // Save changes (commit to github)
  const handleUpdate = async () => {
    if (!selectedGenreId || !backdropInputUrl) {
      addLog("Please select a genre and input a valid asset URL.", "error");
      return;
    }

    setLoading(true);
    addLog(`Initiating secure backend GitHub commit sequence...`, "info");
    try {
      const response = await fetch("/api/github/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({
          genre: selectedGenreId,
          backdrop: backdropInputUrl,
          commitMessage: `Admin UI: Dynamic backdrop asset update for '${selectedGenreId}' genre`
        })
      });
      const json = await response.json();
      if (json.success) {
        setGenres(json.data);
        addLog(`Commit complete! SHA: ${json.commitSha ? json.commitSha.substring(0, 8) : "N/A"}`, "success");
        addLog(`GitHub response: File successfully updated on CDN branch. Vercel webhook will redeploy.`, "success");
      } else {
        addLog(`GitHub Update Failed: ${json.error}`, "error");
      }
    } catch (err: any) {
      addLog(`Failed to deliver commit payload: ${err.message}`, "error");
    }
    setLoading(false);
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
  const activeGenrePreview = genres.find(g => g.genre === selectedPreviewGenreId) || genres[0];

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-sans p-6 transition-colors duration-300 relative ${
        isDark ? "bg-[#0f172a]" : "bg-[#f1f5f9]"
      }`}>
        {/* Floating Theme Toggle during Login */}
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all duration-300 shadow-sm ${
              isDark 
                ? "bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700" 
                : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>

        <div className={`w-full max-w-md rounded-2xl border overflow-hidden shadow-xl transition-all duration-300 ${
          isDark ? "bg-[#1e293b] border-slate-800" : "bg-white border-slate-200"
        }`}>
          {/* Top colored accent header */}
          <div className="bg-slate-900 px-8 py-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-950/20 to-indigo-950/20"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md mb-3">
                D
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">DramaCloud Admin</h2>
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
                      ? "bg-[#151f32] border-slate-800 text-slate-100 placeholder-slate-700" 
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
            isDark ? "bg-[#151f32] border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-400"
          }`}>
            Protected by <span className="font-mono text-rose-600">ADMIN_PASSWORD</span> env variable.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${
      isDark ? "bg-[#0f172a] text-slate-100" : "bg-[#f8fafc] text-slate-800"
    } font-sans overflow-hidden`}>
      {/* Header Navigation */}
      <nav id="navbar" className={`h-16 flex items-center justify-between px-8 transition-colors duration-300 border-b shrink-0 ${
        isDark ? "bg-[#1e293b] border-slate-800 shadow-md" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
            D
          </div>
          <div>
            <span className={`font-extrabold tracking-tight text-lg transition-colors duration-300 ${isDark ? "text-white" : "text-slate-900"}`}>DramaCloud Admin</span>
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
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className={`transition-colors duration-300 ${isDark ? "text-slate-300" : "text-slate-600"}`}>Connected to Vercel CDN</span>
          </div>
          <div className={`h-6 w-[1px] transition-colors duration-300 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}></div>
          
          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-lg transition-all duration-300 border flex items-center justify-center gap-1.5 ${
              isDark 
                ? "bg-slate-800 hover:bg-slate-750 text-amber-400 border-slate-700 shadow-inner" 
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
          isDark ? "bg-[#1e293b] border-slate-800" : "bg-white border-slate-200"
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
            isDark ? "bg-[#151f32] border-slate-800" : "bg-slate-50 border-slate-100"
          }`}>
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase">
              <Github className="w-4 h-4" />
              Production CDN Config
            </div>
            
            <div className={`text-[11px] transition-colors duration-300 space-y-2 ${isDark ? "text-slate-300" : "text-slate-500"}`}>
              <p>
                GitHub parameters are now <span className="font-semibold text-emerald-500">securely stored on the backend</span> to protect secrets.
              </p>
              <div className={`border-t pt-2 space-y-1 font-mono text-[10px] transition-colors duration-300 ${isDark ? "border-slate-800" : "border-slate-200/60"}`}>
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
          <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
            
            {/* Left Col: Configurations & Inputs */}
            <section className="col-span-7 flex flex-col gap-4 overflow-y-auto pr-2">
              <div className="shrink-0">
                <h1 className={`text-2xl font-extrabold tracking-tight transition-colors duration-300 ${isDark ? "text-white" : "text-slate-900"}`}>Update Genre Assets</h1>
                <p className={`text-xs mt-1 transition-colors duration-300 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Managing static API <span className="font-mono font-semibold text-indigo-500">genres.json</span> served dynamically via Vercel Edge.
                </p>
              </div>

              {/* Editing Card Form */}
              <div className={`rounded-xl border shadow-sm p-6 flex flex-col gap-4 transition-all duration-300 ${
                isDark ? "bg-[#1e293b] border-slate-800 shadow-lg" : "bg-white border-slate-200 shadow-sm"
              }`}>
                
                {/* Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Active Genre</label>
                  <div className="relative">
                    <select 
                      id="select-genre"
                      value={selectedGenreId}
                      onChange={handleGenreChange}
                      className={`w-full h-10 pl-3 pr-10 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm transition-colors duration-300 ${
                        isDark 
                          ? "bg-[#151f32] border-slate-800 text-slate-200" 
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      {genres.map((g) => (
                        <option key={g.genre} value={g.genre} className={isDark ? "bg-[#1e293b] text-slate-200" : "bg-white text-slate-700"}>{g.genre}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>

                {/* Input Image Url */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Backdrop Asset URL</label>
                  <input 
                    id="input-backdrop-url"
                    type="text" 
                    value={backdropInputUrl}
                    onChange={(e) => setBackdropInputUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className={`w-full h-10 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs transition-colors duration-300 ${
                      isDark 
                        ? "bg-[#151f32] border-slate-800 text-slate-100 placeholder-slate-600" 
                        : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                    }`}
                  />

                  {backdropInputUrl ? (
                    <div className={`mt-2 relative h-28 w-full rounded-lg overflow-hidden border flex items-center justify-center group transition-colors duration-300 ${
                      isDark ? "border-slate-800 bg-[#151f32]" : "border-slate-200 bg-slate-50"
                    }`}>
                      {!imageError ? (
                        <img
                          src={backdropInputUrl}
                          alt="Backdrop asset preview"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5 text-rose-500 font-medium text-xs">
                          <ImageOff className="w-5 h-5 opacity-80" />
                          <span>Failed to load image</span>
                        </div>
                      )}
                      <div className="absolute top-1.5 right-1.5 bg-black/60 px-2 py-0.5 rounded text-[9px] text-white font-mono tracking-wider">
                        PREVIEW
                      </div>
                    </div>
                  ) : (
                    <div className={`mt-2 h-28 w-full rounded-lg border border-dashed flex flex-col items-center justify-center gap-1 text-xs transition-colors duration-300 ${
                      isDark 
                        ? "border-slate-800 bg-[#151f32] text-slate-500" 
                        : "border-slate-200 bg-slate-50 text-slate-400"
                    }`}>
                      <ImageIcon className="w-5 h-5 opacity-60" />
                      <span>Enter URL to preview asset</span>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button 
                    id="btn-update-asset"
                    onClick={handleUpdate}
                    disabled={loading}
                    className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Github className="w-4 h-4" />
                    Commit to CDN repository
                  </button>
                  <button 
                    id="btn-reset-input"
                    onClick={() => {
                      const active = genres.find(g => g.genre === selectedGenreId);
                      if (active) setBackdropInputUrl(active.backdrop);
                    }}
                    className={`px-4 h-10 font-bold rounded-lg transition-colors text-xs ${
                      isDark 
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Status Log Panel */}
              <div className={`flex-1 rounded-xl p-4 flex flex-col font-mono text-[11px] min-h-[140px] shadow-inner border transition-colors duration-300 ${
                isDark 
                  ? "bg-[#0b1322] border-slate-900 text-slate-300" 
                  : "bg-slate-900 border-slate-950 text-slate-300"
              }`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400 text-xs font-bold shrink-0">
                  <span className="flex items-center gap-1 text-slate-200">
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    LIVE PROCESS CONSOLE
                  </span>
                  <button 
                    onClick={() => setStatusLogs([])}
                    className="hover:text-white hover:underline text-[10px]"
                  >
                    Clear Logs
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[160px]">
                  {statusLogs.length === 0 ? (
                    <div className="text-slate-500 text-center py-6 italic">Waiting for update requests or API calls...</div>
                  ) : (
                    statusLogs.map((log, index) => (
                      <div key={index} className="flex gap-2 items-start leading-relaxed">
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

            </section>

            {/* Right Col: Interactive Android Phone Simulator */}
            <section className="col-span-5 flex flex-col items-center justify-center shrink-0">
              <div className="flex items-center justify-between w-[290px] mb-2">
              </div>

              {/* Phone Container */}
              <div className={`relative w-[300px] h-[580px] bg-[#000000] rounded-[2.8rem] border-[6px] border-zinc-800 shadow-2xl overflow-hidden flex flex-col ring-4 transition-all duration-300 ${
                isDark ? "ring-indigo-950/40" : "ring-slate-200/50"
              }`}>
                {/* Top Camera Punch Hole - Modern design */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-black rounded-full z-20 ring-1 ring-zinc-800"></div>

                {/* Mobile Screen Content */}
                <div className="flex-1 bg-black relative flex flex-col overflow-hidden text-white pt-5">
                  
                    {/* Online UI showing the actual lists/grid dynamically populated from GitHub */}
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                      {/* Genres Header text strictly matching the image */}
                      <div className="px-4 pt-3 pb-2 shrink-0 flex items-center justify-between bg-black z-10">
                        <h2 className="text-xl font-black text-white tracking-tight">Genres</h2>
                      </div>

                      {/* Scrollable grid area */}
                      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-1 space-y-3 scrollbar-none">
                        {genres.length === 0 ? (
                          /* Skeleton fallback when empty */
                          <div className="grid grid-cols-2 gap-3">
                            {[...Array(6)].map((_, i) => (
                              <div key={i} className="aspect-[14/9] w-full rounded-xl bg-zinc-900 animate-pulse"></div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 pb-4">
                            {genres.map((g) => (
                              <div 
                                key={g.genre}
                                onClick={() => {
                                  setSelectedPreviewGenreId(g.genre);
                                  setSelectedGenreId(g.genre);
                                  setBackdropInputUrl(g.backdrop);
                                }}
                                className={`group relative aspect-[14/9] w-full rounded-xl overflow-hidden cursor-pointer border transition-all duration-300 ${
                                  selectedPreviewGenreId === g.genre 
                                    ? "border-rose-500 ring-2 ring-rose-500/50 scale-[0.98]" 
                                    : "border-zinc-900 hover:border-zinc-800"
                                }`}
                              >
                                {/* Background Backdrop Image */}
                                <img 
                                  src={g.backdrop} 
                                  alt={g.genre}
                                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1574267431629-2e570b0643ba?q=80&w=600";
                                  }}
                                />
                                {/* Bottom Scrim Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent z-10"></div>
                                
                                {/* Label Text at the Bottom Left */}
                                <div className="absolute bottom-3 left-3 right-3 z-20 leading-none">
                                  <p className="text-[11px] font-extrabold text-white tracking-tight text-left drop-shadow-md">
                                    {g.genre}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                </div>
              </div>
            </section>

          </div>

        </main>
      </div>
    </div>
  );
}
