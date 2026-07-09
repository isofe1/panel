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
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
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
  X,
  LayoutDashboard,
  Terminal,
  Users,
  Bell,
  LogOut,
  Activity,
  Server,
  Cpu,
  Shield,
  Clock,
  HardDrive,
  TrendingUp,
  Sliders,
  Pin,
  Tv,
  GripVertical,
  Video,
  Link,
  PlusCircle,
  Play
} from "lucide-react";
import { Genre, GitHubConfig, ChatMessage, LocalSnapshot, SystemStats, HeroConfig, PinnedItem } from "./types";
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

const DEFAULT_HOME_LAYOUT = [
  {
    "section_id": "hero_banner",
    "layout_type": "HERO",
    "title": "Featured Spotlight",
    "visible": true
  },
  {
    "section_id": "top_10_global",
    "layout_type": "TOP_10",
    "title": "Top 10 Hits",
    "visible": true
  },
  {
    "section_id": "kr_jp_mixed",
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
    "section_id": "trending_actors",
    "layout_type": "ACTORS",
    "title": "Trending Stars",
    "visible": true
  }
];

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem("admin_theme") === "dark";
  });

  // Navigation active tab/section
  const [activeTab, setActiveTab] = useState<string>("genres"); // "overview" | "genres" | "cdn" | "users" | "logs"

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
  const [quickImageError, setQuickImageError] = useState<boolean>(false);

  // Android preview simulator states
  const [selectedPreviewGenreId, setSelectedPreviewGenreId] = useState<string>("");
  
  // Hero Config states
  const [heroConfig, setHeroConfig] = useState<HeroConfig>({
    mode: "HYBRID",
    max_items: 6,
    auto_source: "popular",
    pinned_items: [
      { drama_id: "drama_123_id", position: 1 },
      { drama_id: "drama_456_id", position: 3 }
    ]
  });

  // Slide edit modal state
  const [editingSlidePos, setEditingSlidePos] = useState<number | null>(null);
  const [slideTitleInput, setSlideTitleInput] = useState<string>("");
  const [slideIdInput, setSlideIdInput] = useState<string>("");
  const [slideYearInput, setSlideYearInput] = useState<number>(2024);
  const [slideRatingInput, setSlideRatingInput] = useState<number>(8.0);
  const [slideTypeInput, setSlideTypeInput] = useState<"tv" | "movie">("tv");
  const [slideBackdropInput, setSlideBackdropInput] = useState<string>("");
  const [slideOverviewInput, setSlideOverviewInput] = useState<string>("");
  const [slideCountryInput, setSlideCountryInput] = useState<string>("KR");
  
  // Slide search state
  const [slideSearchQuery, setSlideSearchQuery] = useState<string>("");
  const [slideSearchResults, setSlideSearchResults] = useState<any[]>([]);
  const [slideSearchLoading, setSlideSearchLoading] = useState<boolean>(false);
  const [initialHeroConfig, setInitialHeroConfig] = useState<HeroConfig>({
    mode: "HYBRID",
    max_items: 6,
    auto_source: "popular",
    pinned_items: [
      { drama_id: "drama_123_id", position: 1 },
      { drama_id: "drama_456_id", position: 3 }
    ]
  });
  const [pendingUnpin, setPendingUnpin] = useState<{ drama_id: string; position: number; title: string } | null>(null);
  const [heroLoading, setHeroLoading] = useState<boolean>(false);
  const [heroSaving, setHeroSaving] = useState<boolean>(false);
  const [heroSyncing, setHeroSyncing] = useState<boolean>(false);
  const [newPinnedDramaId, setNewPinnedDramaId] = useState<string>("");
  const [newPinnedPosition, setNewPinnedPosition] = useState<number>(1);

  // Media Stream Injector States
  const [dramaLinks, setDramaLinks] = useState<Record<string, { stream_url: string | null; download_url: string | null; title?: string }>>({});
  const [linksLoading, setLinksLoading] = useState<boolean>(false);
  const [linksSaving, setLinksSaving] = useState<boolean>(false);
  const [linksMessage, setLinksMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form Inputs for Adding/Editing a Link
  const [linkDramaId, setLinkDramaId] = useState<string>("");
  const [linkTitle, setLinkTitle] = useState<string>("");
  const [linkStreamUrl, setLinkStreamUrl] = useState<string>("");
  const [linkDownloadUrl, setLinkDownloadUrl] = useState<string>("");
  const [linkEditingId, setLinkEditingId] = useState<string | null>(null);

  // Dynamic Home Layout States
  const [homeLayout, setHomeLayout] = useState<any[]>([]);
  const [layoutLoading, setLayoutLoading] = useState<boolean>(false);
  const [layoutSaving, setLayoutSaving] = useState<boolean>(false);
  const [layoutMessage, setLayoutMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form Inputs for Home Layout Section
  const [layoutEditingId, setLayoutEditingId] = useState<string | null>(null);
  const [layoutSectionId, setLayoutSectionId] = useState<string>("");
  const [layoutTitleInput, setLayoutTitleInput] = useState<string>("");
  const [layoutTypeInput, setLayoutTypeInput] = useState<string>("DRAMA_RAIL");
  const [layoutVisibleInput, setLayoutVisibleInput] = useState<boolean>(true);
  const [layoutMediaTypeInput, setLayoutMediaTypeInput] = useState<string>("all");
  const [layoutCountriesInput, setLayoutCountriesInput] = useState<string>("KR, JP");
  const [layoutSortByInput, setLayoutSortByInput] = useState<string>("popularity");

  // Drag and Drop states and handlers
  const [draggedPosition, setDraggedPosition] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, position: number) => {
    setDraggedPosition(position);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", position.toString());
  };

  const handleDragOver = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    if (draggedPosition !== position) {
      setDragOverPosition(position);
    }
  };

  const handleDragLeave = () => {
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent, targetPosition: number) => {
    e.preventDefault();
    if (draggedPosition !== null && draggedPosition !== targetPosition) {
      handleDragAndDropSwap(draggedPosition, targetPosition);
    }
    setDraggedPosition(null);
    setDragOverPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedPosition(null);
    setDragOverPosition(null);
  };

  const handleDragAndDropSwap = (fromPos: number, toPos: number) => {
    if (fromPos === toPos) return;

    const itemAtFrom = heroConfig.pinned_items.find(p => p.position === fromPos);
    const itemAtTo = heroConfig.pinned_items.find(p => p.position === toPos);

    let updatedPins = [...heroConfig.pinned_items];

    // Remove old references
    updatedPins = updatedPins.filter(p => p.position !== fromPos && p.position !== toPos);

    if (itemAtFrom) {
      updatedPins.push({
        ...itemAtFrom,
        position: toPos
      });
    }

    if (itemAtTo) {
      updatedPins.push({
        ...itemAtTo,
        position: fromPos
      });
    }

    updatedPins.sort((a, b) => a.position - b.position);

    setHeroConfig(prev => ({
      ...prev,
      pinned_items: updatedPins
    }));

    addLog(`Reordered: swapped Slide #${fromPos} and Slide #${toPos} visually.`, "info");
  };

  // TMDB Proxy & Details client states
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState<string>("");
  const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
  const [tmdbSearchLoading, setTmdbSearchLoading] = useState<boolean>(false);
  const [tmdbPinMode, setTmdbPinMode] = useState<"search" | "direct">("search");
  const [lookupDramaResult, setLookupDramaResult] = useState<any | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [resolvedDramas, setResolvedDramas] = useState<Record<string, any>>({});

  const handleTmdbSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tmdbSearchQuery.trim()) return;
    setTmdbSearchLoading(true);
    addLog(`Searching shows matching "${tmdbSearchQuery}"...`, "info");
    try {
      const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(tmdbSearchQuery)}`);
      const json = await response.json();
      if (json.success && json.results) {
        setTmdbSearchResults(json.results);
        addLog(`Found ${json.results.length} results matching "${tmdbSearchQuery}". (Source: ${json.source})`, "success");
      } else {
        addLog(`No results found or search failed.`, "error");
      }
    } catch (err: any) {
      addLog(`Search request failed: ${err.message}`, "error");
    } finally {
      setTmdbSearchLoading(false);
    }
  };

  const handleTmdbLookup = async (idToLookup: string) => {
    if (!idToLookup.trim()) return;
    setLookupLoading(true);
    setLookupDramaResult(null);
    addLog(`Resolving details for TMDB ID: ${idToLookup}...`, "info");
    try {
      const response = await fetch(`/api/tmdb/details?id=${encodeURIComponent(idToLookup)}`);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON response but received: ${contentType}`);
      }
      const json = await response.json();
      if (json.success && json.data) {
        setLookupDramaResult(json.data);
        addLog(`Successfully resolved: "${json.data.title}"`, "success");
      } else {
        addLog(`Could not resolve TMDB ID "${idToLookup}". Check the ID or try again.`, "error");
      }
    } catch (err: any) {
      addLog(`Lookup request failed: ${err.message}`, "error");
    } finally {
      setLookupLoading(false);
    }
  };

  const resolveDramaDetails = async (dramaId: string) => {
    if (!dramaId) return;
    if (resolvedDramas[dramaId]) return;
    try {
      const response = await fetch(`/api/tmdb/details?id=${encodeURIComponent(dramaId)}`);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON response but received: ${contentType}`);
      }
      const json = await response.json();
      if (json.success && json.data) {
        setResolvedDramas(prev => ({
          ...prev,
          [dramaId]: json.data
        }));
      }
    } catch (err: any) {
      console.error(`Failed to resolve details for ID: ${dramaId}`, err);
    }
  };
  
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

  // Full Admin Panel Feature States
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [sandboxQueryType, setSandboxQueryType] = useState<string>("all");
  const [sandboxSearch, setSandboxSearch] = useState<string>("");
  const [sandboxResponse, setSandboxResponse] = useState<string>("");
  const [sandboxLoading, setSandboxLoading] = useState<boolean>(false);
  const [sandboxTime, setSandboxTime] = useState<number>(0);
  const [snapshots, setSnapshots] = useState<LocalSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem("hanzone_snapshots");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newSnapshotName, setNewSnapshotName] = useState<string>("");
  const [trafficClientFilter, setTrafficClientFilter] = useState<string>("all");

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

  // Load Hero Banner Configuration
  const loadHeroConfig = async () => {
    setHeroLoading(true);
    addLog("Fetching dynamic Hero Banner configuration from server...", "info");
    try {
      const response = await fetch("/api/get-hero-config");
      const json = await response.json();
      if (json && json.hero_config) {
        // Pre-populate resolvedDramas using existing nested drama objects!
        const preResolved: Record<string, any> = {};
        if (json.hero_config.pinned_items) {
          json.hero_config.pinned_items.forEach((item: any) => {
            if (item.drama) {
              const dramaId = item.drama_id || (item.drama.slug && item.drama.slug.split("-")[1]) || item.drama.slug;
              if (dramaId) {
                preResolved[dramaId] = {
                  id: dramaId,
                  title: item.drama.title,
                  type: item.drama.type || "tv",
                  poster_path: item.drama.backdrop_url,
                  backdrop_path: item.drama.backdrop_url,
                  vote_average: item.drama.rating || 0.0,
                  release_date: item.drama.year ? `${item.drama.year}-01-01` : "",
                  overview: item.drama.synopsis || item.drama.overview || ""
                };
              }
            }
          });
        }
        setResolvedDramas(prev => ({ ...preResolved, ...prev }));
        setHeroConfig(json.hero_config);
        setInitialHeroConfig(JSON.parse(JSON.stringify(json.hero_config)));
        addLog("Dynamic Hero Banner configuration successfully synchronized.", "success");
      } else {
        addLog("Failed to decode Hero Banner config from server response.", "error");
      }
    } catch (err: any) {
      addLog(`Failed to load Hero Banner config: ${err.message}`, "error");
    } finally {
      setHeroLoading(false);
    }
  };

  // Fetch Custom Media Stream Links from backend
  const fetchDramaLinks = async () => {
    setLinksLoading(true);
    try {
      const response = await fetch("/api/admin/drama-links", {
        headers: {
          "x-admin-password": adminPassword
        }
      });
      const data = await response.json();
      if (data.success) {
        setDramaLinks(data.links || {});
      } else {
        setLinksMessage({ text: data.error || "Failed to load media links.", type: "error" });
      }
    } catch (err: any) {
      setLinksMessage({ text: err.message || "Error connecting to backend.", type: "error" });
    } finally {
      setLinksLoading(false);
    }
  };

  // Save or Update custom streaming link
  const handleSaveDramaLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkDramaId.trim()) {
      setLinksMessage({ text: "Drama ID is required.", type: "error" });
      return;
    }
    setLinksSaving(true);
    setLinksMessage(null);
    try {
      const response = await fetch("/api/admin/drama-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({
          id: linkDramaId.trim(),
          title: linkTitle.trim() || undefined,
          stream_url: linkStreamUrl.trim() || null,
          download_url: linkDownloadUrl.trim() || null
        })
      });
      const data = await response.json();
      if (data.success) {
        setDramaLinks(data.links);
        setLinksMessage({ text: data.message || "Successfully saved link configuration!", type: "success" });
        // Reset fields
        setLinkDramaId("");
        setLinkTitle("");
        setLinkStreamUrl("");
        setLinkDownloadUrl("");
        setLinkEditingId(null);
      } else {
        setLinksMessage({ text: data.error || "Failed to save link configuration.", type: "error" });
      }
    } catch (err: any) {
      setLinksMessage({ text: err.message || "Error saving link configuration.", type: "error" });
    } finally {
      setLinksSaving(false);
    }
  };

  // Delete a customized link
  const handleDeleteDramaLink = async (id: string) => {
    if (!window.confirm(`Are you sure you want to remove all custom links for Drama ID: ${id}?`)) {
      return;
    }
    setLinksSaving(true);
    try {
      const response = await fetch("/api/admin/drama-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({
          id: id,
          stream_url: null,
          download_url: null
        })
      });
      const data = await response.json();
      if (data.success) {
        setDramaLinks(data.links);
        setLinksMessage({ text: "Custom link deleted successfully.", type: "success" });
      } else {
        setLinksMessage({ text: data.error || "Failed to delete link configuration.", type: "error" });
      }
    } catch (err: any) {
      setLinksMessage({ text: err.message || "Error deleting link configuration.", type: "error" });
    } finally {
      setLinksSaving(false);
    }
  };

  // --- Dynamic Home Screen Layout Configuration Helpers ---

  // Fetch current layout from server
  const fetchHomeLayout = async () => {
    setLayoutLoading(true);
    setLayoutMessage(null);
    try {
      const response = await fetch("/api/admin/home-layout", {
        headers: {
          "x-admin-password": adminPassword
        }
      });
      const data = await response.json();
      if (data.success) {
        setHomeLayout(data.layout || []);
      } else {
        setLayoutMessage({ text: data.error || "Failed to load Home Layout.", type: "error" });
      }
    } catch (err: any) {
      setLayoutMessage({ text: err.message || "Error loading Home Layout.", type: "error" });
    } finally {
      setLayoutLoading(false);
    }
  };

  // Persist updated layout to backend
  const saveLayoutConfig = async (layoutToSave: any[]) => {
    setLayoutSaving(true);
    setLayoutMessage(null);
    try {
      const response = await fetch("/api/admin/home-layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({ layout: layoutToSave })
      });
      const data = await response.json();
      if (data.success) {
        setHomeLayout(data.layout);
        setLayoutMessage({ text: data.message || "Home Screen layout saved successfully!", type: "success" });
        return true;
      } else {
        setLayoutMessage({ text: data.error || "Failed to save Home Screen layout.", type: "error" });
        return false;
      }
    } catch (err: any) {
      setLayoutMessage({ text: err.message || "Error saving Home Screen layout.", type: "error" });
      return false;
    } finally {
      setLayoutSaving(false);
    }
  };

  // Move section position up or down
  const handleSectionOrderChange = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === homeLayout.length - 1) return;

    const updated = [...homeLayout];
    const swapTarget = direction === "up" ? index - 1 : index + 1;
    
    // Swap elements
    const temp = updated[index];
    updated[index] = updated[swapTarget];
    updated[swapTarget] = temp;

    setHomeLayout(updated);
    await saveLayoutConfig(updated);
  };

  // Toggle visibility of a section
  const handleToggleSectionVisibility = async (sectionId: string) => {
    const updated = homeLayout.map((sec) => {
      if (sec.section_id === sectionId) {
        return { ...sec, visible: !sec.visible };
      }
      return sec;
    });

    setHomeLayout(updated);
    await saveLayoutConfig(updated);
  };

  // Delete section from configuration
  const handleDeleteSection = async (sectionId: string) => {
    if (!window.confirm(`Are you sure you want to remove the section: "${sectionId}"?`)) {
      return;
    }

    const updated = homeLayout.filter((sec) => sec.section_id !== sectionId);
    setHomeLayout(updated);
    await saveLayoutConfig(updated);
  };

  // Save layout section from form (Add / Edit)
  const handleSaveSectionForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!layoutSectionId.trim()) {
      setLayoutMessage({ text: "Section ID is required and must be unique.", type: "error" });
      return;
    }

    // Check uniqueness if adding new section
    if (!layoutEditingId && homeLayout.some((sec) => sec.section_id.toLowerCase() === layoutSectionId.trim().toLowerCase())) {
      setLayoutMessage({ text: "Section ID must be unique. A section with this ID already exists.", type: "error" });
      return;
    }

    const cleanedSectionId = layoutSectionId.trim();
    const cleanedTitle = layoutTitleInput.trim() || "New Section";

    const newSection: any = {
      section_id: cleanedSectionId,
      layout_type: layoutTypeInput,
      title: cleanedTitle,
      visible: layoutVisibleInput
    };

    // If it's a DRAMA_RAIL, build data_source parameters
    if (layoutTypeInput === "DRAMA_RAIL") {
      // Clean and split countries
      const countriesList = layoutCountriesInput
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length > 0);

      newSection.data_source = {
        media_type: layoutMediaTypeInput,
        countries: countriesList,
        sort_by: layoutSortByInput
      };
    }

    let updatedLayout = [];
    if (layoutEditingId) {
      // Overwrite existing section
      updatedLayout = homeLayout.map((sec) => {
        if (sec.section_id === layoutEditingId) {
          return newSection;
        }
        return sec;
      });
    } else {
      // Append new section to the layout
      updatedLayout = [...homeLayout, newSection];
    }

    const success = await saveLayoutConfig(updatedLayout);
    if (success) {
      // Reset inputs
      setLayoutSectionId("");
      setLayoutTitleInput("");
      setLayoutTypeInput("DRAMA_RAIL");
      setLayoutVisibleInput(true);
      setLayoutMediaTypeInput("all");
      setLayoutCountriesInput("KR, JP");
      setLayoutSortByInput("popularity");
      setLayoutEditingId(null);
    }
  };

  // Save/Commit Hero Banner Configuration
  const saveHeroConfig = async (configToSave: HeroConfig = heroConfig) => {
    setHeroSaving(true);
    addLog("Committing dynamic Hero Banner configuration securely...", "info");
    try {
      const response = await fetch("/api/github/update-hero-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({
          hero_config: configToSave,
          commitMessage: "Admin UI: Synchronized Hero Banner dynamic options"
        })
      });
      const json = await response.json();
      if (json.success) {
        // Pre-populate resolvedDramas using newly returned nested drama objects!
        const preResolved: Record<string, any> = {};
        if (json.data && json.data.hero_config && json.data.hero_config.pinned_items) {
          json.data.hero_config.pinned_items.forEach((item: any) => {
            if (item.drama) {
              const dramaId = item.drama_id || (item.drama.slug && item.drama.slug.split("-")[1]) || item.drama.slug;
              if (dramaId) {
                preResolved[dramaId] = {
                  id: dramaId,
                  title: item.drama.title,
                  type: item.drama.type || "tv",
                  poster_path: item.drama.backdrop_url,
                  backdrop_path: item.drama.backdrop_url,
                  vote_average: item.drama.rating || 0.0,
                  release_date: item.drama.year ? `${item.drama.year}-01-01` : "",
                  overview: item.drama.synopsis || item.drama.overview || ""
                };
              }
            }
          });
        }
        setResolvedDramas(prev => ({ ...preResolved, ...prev }));
        setHeroConfig(json.data.hero_config);
        setInitialHeroConfig(JSON.parse(JSON.stringify(json.data.hero_config)));
        addLog("Successfully committed and deployed Hero Banner config!", "success");
        return true;
      } else {
        addLog(`Failed to commit Hero Config: ${json.error}`, "error");
        return false;
      }
    } catch (err: any) {
      addLog(`Hero Config sync failed: ${err.message}`, "error");
      return false;
    } finally {
      setHeroSaving(false);
    }
  };

  // Start Slide Editing
  const handleStartEditSlide = (position: number) => {
    const pinnedItem = heroConfig.pinned_items.find(p => p.position === position);
    const details = pinnedItem ? resolvedDramas[pinnedItem.drama_id] : null;
    const itemDrama = pinnedItem?.drama;

    if (details) {
      setSlideTitleInput(details.title || "");
      setSlideIdInput(pinnedItem?.drama_id || "");
      setSlideYearInput(details.release_date ? parseInt(details.release_date.split("-")[0], 10) || 2024 : 2024);
      setSlideRatingInput(details.vote_average || 8.0);
      setSlideTypeInput(details.type || "tv");
      setSlideBackdropInput(details.backdrop_path || "");
      setSlideOverviewInput(details.overview || "");
      setSlideCountryInput(details.country || "KR");
    } else if (itemDrama) {
      setSlideTitleInput(itemDrama.title || "");
      setSlideIdInput(pinnedItem?.drama_id || "");
      setSlideYearInput(itemDrama.year || 2024);
      setSlideRatingInput(itemDrama.rating || 8.0);
      setSlideTypeInput(itemDrama.type || "tv");
      setSlideBackdropInput(itemDrama.backdrop_url || "");
      setSlideOverviewInput(itemDrama.synopsis || "");
      setSlideCountryInput(itemDrama.country || "KR");
    } else {
      setSlideTitleInput("");
      setSlideIdInput("");
      setSlideYearInput(2024);
      setSlideRatingInput(8.0);
      setSlideTypeInput("tv");
      setSlideBackdropInput("");
      setSlideOverviewInput("");
      setSlideCountryInput("KR");
    }

    setEditingSlidePos(position);
    setSlideSearchQuery("");
    setSlideSearchResults([]);
    setSlideSearchLoading(false);
  };

  // Search inside slide edit modal
  const handleSlideSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!slideSearchQuery.trim()) return;
    setSlideSearchLoading(true);
    try {
      const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(slideSearchQuery)}`);
      const json = await response.json();
      if (json.success && json.results) {
        setSlideSearchResults(json.results);
      }
    } catch (err) {
      console.error("Search failed in slide modal:", err);
    } finally {
      setSlideSearchLoading(false);
    }
  };

  // Auto-fill from search results in slide edit modal
  const handleAutoFillSlide = (show: any) => {
    setSlideTitleInput(show.title || "");
    setSlideIdInput(show.id || "");
    setSlideYearInput(show.release_date ? parseInt(show.release_date.split("-")[0], 10) || 2024 : 2024);
    setSlideRatingInput(8.0);
    setSlideTypeInput(show.type === "movie" ? "movie" : "tv");
    
    let backdrop = show.backdrop_path || show.poster_path || "";
    if (backdrop && backdrop.includes("/t/p/w1280/")) {
      backdrop = backdrop.replace("/t/p/w1280/", "/t/p/w500/");
    }
    setSlideBackdropInput(backdrop);
    setSlideOverviewInput(show.overview || "");
    setSlideCountryInput("KR");
  };

  // Apply edits to slide slot
  const handleApplySlideEdit = () => {
    if (editingSlidePos === null) return;
    if (!slideTitleInput.trim()) {
      addLog("Slide title cannot be empty.", "error");
      return;
    }

    const dId = slideIdInput.trim() || `mock_${Date.now()}`;
    const cleanBackdrop = slideBackdropInput.trim();
    const cleanPoster = cleanBackdrop;

    const updatedDrama = {
      slug: `${slideTypeInput}-${dId}`,
      title: slideTitleInput.trim(),
      backdrop_url: cleanBackdrop,
      rating: Number(slideRatingInput) || 8.0,
      year: Number(slideYearInput) || 2024,
      type: slideTypeInput,
      country: slideCountryInput.trim() || "KR",
      synopsis: slideOverviewInput.trim()
    };

    const updatedPins = heroConfig.pinned_items.filter(p => p.position !== editingSlidePos);
    updatedPins.push({
      drama_id: dId,
      position: editingSlidePos,
      drama: updatedDrama
    });

    updatedPins.sort((a, b) => a.position - b.position);

    const newConfig = {
      ...heroConfig,
      pinned_items: updatedPins
    };

    setHeroConfig(newConfig);

    // Cache details immediately to keep UI in sync
    setResolvedDramas(prev => ({
      ...prev,
      [dId]: {
        id: dId,
        title: updatedDrama.title,
        type: updatedDrama.type,
        poster_path: cleanPoster,
        backdrop_path: updatedDrama.backdrop_url,
        vote_average: updatedDrama.rating,
        release_date: `${updatedDrama.year}-01-01`,
        overview: updatedDrama.synopsis,
        country: updatedDrama.country
      }
    }));

    addLog(`Applied modifications to Slide #${editingSlidePos} locally. Click 'Save & Publish' to write to repository.`, "info");
    setEditingSlidePos(null);
  };

  // Move slide up or down
  const handleMoveSlide = (position: number, direction: "up" | "down") => {
    const targetPos = direction === "up" ? position - 1 : position + 1;
    if (targetPos < 1 || targetPos > heroConfig.max_items) return;

    const itemAtCurrent = heroConfig.pinned_items.find(p => p.position === position);
    const itemAtTarget = heroConfig.pinned_items.find(p => p.position === targetPos);

    let updatedPins = heroConfig.pinned_items.filter(p => p.position !== position && p.position !== targetPos);

    if (itemAtCurrent) {
      updatedPins.push({
        ...itemAtCurrent,
        position: targetPos
      });
    }

    if (itemAtTarget) {
      updatedPins.push({
        ...itemAtTarget,
        position: position
      });
    }

    updatedPins.sort((a, b) => a.position - b.position);

    setHeroConfig(prev => ({
      ...prev,
      pinned_items: updatedPins
    }));

    addLog(`Swapped positions of Slide #${position} and Slide #${targetPos}.`, "info");
  };

  // Clear a slide position
  const handleClearSlide = (position: number) => {
    const item = heroConfig.pinned_items.find(p => p.position === position);
    if (!item) return;

    const title = resolvedDramas[item.drama_id]?.title || item.drama?.title || item.drama_id;
    if (window.confirm(`Are you sure you want to clear the pinned drama "${title}" from Slide #${position}?`)) {
      const updatedPins = heroConfig.pinned_items.filter(p => p.position !== position);
      setHeroConfig(prev => ({
        ...prev,
        pinned_items: updatedPins
      }));
      addLog(`Cleared Slide #${position}.`, "info");
    }
  };

  // Sync Pinned Metadata from backend (forces fetch of latest ratings/posters from TMDB)
  const syncHeroMetadata = async () => {
    setHeroSyncing(true);
    addLog("Initiating TMDB metadata synchronization for pinned hero items...", "info");
    try {
      const response = await fetch("/api/github/sync-hero-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        }
      });
      const json = await response.json();
      if (json.success) {
        const preResolved: Record<string, any> = {};
        if (json.data && json.data.hero_config && json.data.hero_config.pinned_items) {
          json.data.hero_config.pinned_items.forEach((item: any) => {
            if (item.drama) {
              const dramaId = item.drama_id || (item.drama.slug && item.drama.slug.split("-")[1]) || item.drama.slug;
              if (dramaId) {
                preResolved[dramaId] = {
                  id: dramaId,
                  title: item.drama.title,
                  type: item.drama.type || "tv",
                  poster_path: item.drama.backdrop_url,
                  backdrop_path: item.drama.backdrop_url,
                  vote_average: item.drama.rating || 0.0,
                  release_date: item.drama.year ? `${item.drama.year}-01-01` : "",
                  overview: item.drama.synopsis || item.drama.overview || ""
                };
              }
            }
          });
        }
        setResolvedDramas(prev => ({ ...preResolved, ...prev }));
        setHeroConfig(json.data.hero_config);
        setInitialHeroConfig(JSON.parse(JSON.stringify(json.data.hero_config)));
        addLog(json.message || "Successfully synchronized and updated pinned item metadata!", "success");
      } else {
        addLog(`Failed to sync hero metadata: ${json.error}`, "error");
      }
    } catch (err: any) {
      addLog(`Sync request failed: ${err.message}`, "error");
    } finally {
      setHeroSyncing(false);
    }
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

  // Full Admin Panel Helper Functions
  const fetchSystemStats = async () => {
    try {
      const response = await fetch("/api/system/stats");
      const data = await response.json();
      if (data.success) {
        setSystemStats(data);
      }
    } catch (err: any) {
      console.error("Failed to fetch system stats:", err);
    }
  };

  const runApiSandboxTest = async () => {
    setSandboxLoading(true);
    const startTime = performance.now();
    addLog(`Sandbox Test: Initiating GET request to /api/get-genres...`, "info");
    try {
      const response = await fetch("/api/get-genres");
      const allGenres: Genre[] = await response.json();
      
      // Filter response based on sandbox criteria to simulate query params perfectly!
      let filtered = [...allGenres];
      if (sandboxQueryType === "genres") {
        filtered = filtered.filter(g => g.type?.toLowerCase() === "genre");
      } else if (sandboxQueryType === "keywords") {
        filtered = filtered.filter(g => g.type?.toLowerCase() === "keyword");
      }
      if (sandboxSearch.trim()) {
        filtered = filtered.filter(g => g.name.toLowerCase().includes(sandboxSearch.toLowerCase()));
      }
      
      const duration = Math.round(performance.now() - startTime);
      setSandboxTime(duration);
      setSandboxResponse(JSON.stringify(filtered, null, 2));
      addLog(`Sandbox Test Completed: 200 OK. Returned ${filtered.length} items in ${duration}ms`, "success");
    } catch (err: any) {
      setSandboxResponse(JSON.stringify({ error: err.message }, null, 2));
      addLog(`Sandbox Test Failed: ${err.message}`, "error");
    } finally {
      setSandboxLoading(false);
    }
  };

  const saveLocalSnapshot = () => {
    if (!newSnapshotName.trim()) {
      addLog("Snapshot name cannot be empty.", "error");
      return;
    }
    const newSnap: LocalSnapshot = {
      id: Math.random().toString(),
      name: newSnapshotName.trim(),
      timestamp: new Date().toLocaleString(),
      genresCount: genres.length,
      data: [...genres]
    };
    const updated = [newSnap, ...snapshots];
    setSnapshots(updated);
    localStorage.setItem("hanzone_snapshots", JSON.stringify(updated));
    setNewSnapshotName("");
    addLog(`Created local database snapshot '${newSnap.name}' with ${newSnap.genresCount} categories.`, "success");
  };

  const restoreLocalSnapshot = (snap: LocalSnapshot) => {
    if (window.confirm(`Are you sure you want to restore snapshot '${snap.name}'? This will override your active dashboard state.`)) {
      setGenres(snap.data);
      if (snap.data.length > 0) {
        selectGenreForEditing(snap.data[0]);
      } else {
        startAddMode();
      }
      addLog(`Restored dashboard state to snapshot '${snap.name}'. Click 'Go to Production CDN' or select category to commit back to Git repository.`, "info");
    }
  };

  const deleteLocalSnapshot = (id: string, name: string) => {
    const updated = snapshots.filter(s => s.id !== id);
    setSnapshots(updated);
    localStorage.setItem("hanzone_snapshots", JSON.stringify(updated));
    addLog(`Deleted local snapshot '${name}'.`, "info");
  };

  // Automatically select the first available slot for new pins
  useEffect(() => {
    const occupiedPositions = heroConfig.pinned_items.map(p => p.position);
    let firstAvailableSlot = 1;
    for (let s = 1; s <= heroConfig.max_items; s++) {
      if (!occupiedPositions.includes(s)) {
        firstAvailableSlot = s;
        break;
      }
    }
    setNewPinnedPosition(firstAvailableSlot);
  }, [heroConfig.pinned_items, heroConfig.max_items]);

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

  // Load system stats on tab change or auth
  useEffect(() => {
    if (isAuthenticated) {
      fetchSystemStats();
    }
    if (isAuthenticated && activeTab === "streams") {
      fetchDramaLinks();
    }
    if (isAuthenticated && activeTab === "layout") {
      fetchHomeLayout();
    }
  }, [isAuthenticated, activeTab]);

  // Initialize/Reload data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      loadHeroConfig();
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

  useEffect(() => {
    setQuickImageError(false);
  }, [quickBgUrl]);

  // Resolve TMDB details for all pinned items whenever the list of pinned items changes
  useEffect(() => {
    if (heroConfig && heroConfig.pinned_items) {
      heroConfig.pinned_items.forEach((item) => {
        if (item.drama_id) {
          resolveDramaDetails(item.drama_id);
        }
      });
    }
  }, [heroConfig.pinned_items]);

  // Reset pending unpin modal on tab change or logout
  useEffect(() => {
    setPendingUnpin(null);
  }, [activeTab, isAuthenticated]);

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

  // Find the first available slot to use as the default for new pins
  const occupiedPositions = heroConfig.pinned_items.map(p => p.position);
  let firstAvailableSlot = 1;
  for (let s = 1; s <= heroConfig.max_items; s++) {
    if (!occupiedPositions.includes(s)) {
      firstAvailableSlot = s;
      break;
    }
  }

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
        <aside id="sidebar" className={`w-72 transition-colors duration-300 border-r p-5 flex flex-col gap-6 overflow-y-auto shrink-0 ${
          isDark ? "bg-[#0d1326] border-[#1e2942]" : "bg-white border-slate-200"
        }`}>
          {/* Section: Navigation Menu */}
          <div className="flex-1 flex flex-col gap-5">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 px-2">Navigation Menu</p>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    activeTab === "overview"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : isDark
                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard Overview</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("genres")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    activeTab === "genres"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : isDark
                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4" />
                    <span>Genres & Keywords</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === "genres"
                      ? "bg-indigo-700 text-white"
                      : isDark
                        ? "bg-[#16203a] text-indigo-400"
                        : "bg-indigo-50 text-indigo-600"
                  }`}>
                    {genres.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("hero")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    activeTab === "hero"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : isDark
                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Tv className="w-4 h-4" />
                    <span>Hero Banner Pager</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === "hero"
                      ? "bg-indigo-700 text-white"
                      : isDark
                        ? "bg-[#16203a] text-indigo-400"
                        : "bg-indigo-50 text-indigo-600"
                  }`}>
                    {heroConfig.mode}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("cdn")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    activeTab === "cdn"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : isDark
                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GitBranch className="w-4 h-4" />
                    <span>Production CDN</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("streams")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    activeTab === "streams"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : isDark
                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Video className="w-4 h-4" />
                    <span>Media Stream Injector</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === "streams"
                      ? "bg-indigo-700 text-white"
                      : isDark
                        ? "bg-emerald-950/40 text-emerald-400"
                        : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {Object.keys(dramaLinks).length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("layout")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    activeTab === "layout"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : isDark
                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4" />
                    <span>Home Screen Engine</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === "layout"
                      ? "bg-indigo-700 text-white"
                      : isDark
                        ? "bg-indigo-950/40 text-indigo-400"
                        : "bg-indigo-50 text-indigo-600"
                  }`}>
                    {homeLayout.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("users")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    activeTab === "users"
                      ? "bg-indigo-600 text-white shadow-md"
                      : isDark
                        ? "text-slate-500 hover:text-slate-400"
                        : "text-slate-400 hover:text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" />
                    <span>Users & Accounts</span>
                  </div>
                  <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400">Soon</span>
                </button>

                <button
                  onClick={() => setActiveTab("logs")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    activeTab === "logs"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : isDark
                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Terminal className="w-4 h-4" />
                    <span>System Live Logs</span>
                  </div>
                  <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                </button>
              </div>
            </div>

            {/* Quick API status status indicator inside sidebar */}
            <div className={`p-4 border rounded-xl flex flex-col gap-2.5 transition-all duration-300 ${
              isDark ? "bg-[#121b33] border-[#1e2942]" : "bg-slate-50 border-slate-100"
            }`}>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                Live Hub Status
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Backend API</span>
                  <span className="font-bold text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">GitHub CDN</span>
                  <span className="font-bold text-emerald-500">Connected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Footer with user info & logout */}
          <div className={`pt-4 border-t flex flex-col gap-3 transition-colors duration-300 ${
            isDark ? "border-[#1e2942]" : "border-slate-100"
          }`}>
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-7.5 h-7.5 bg-rose-600 rounded-lg flex items-center justify-center text-white font-extrabold text-xs shrink-0">
                U
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>cjtggg10@gmail.com</p>
                <p className="text-[9px] font-medium text-slate-400 uppercase">Administrator</p>
              </div>
            </div>

            <button
              onClick={() => {
                sessionStorage.removeItem("admin_authenticated");
                window.location.reload();
              }}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border active:scale-[0.98] ${
                isDark
                  ? "bg-transparent border-slate-700 text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
                  : "bg-white border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200"
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out Securely
            </button>
          </div>
        </aside>

        {/* Dashboard Panels */}
        <main id="main-content" className="flex-1 flex flex-col p-6 overflow-hidden gap-6">
          
          {/* OVERVIEW SECTION */}
          {activeTab === "overview" && (
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 pb-6">
              {/* Elegant Welcome Banner */}
              <div className={`relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 ${
                isDark 
                  ? "bg-gradient-to-r from-[#0d152c] to-[#070b16] border-[#1e2d4d]" 
                  : "bg-gradient-to-r from-indigo-50/60 to-white border-indigo-100 shadow-sm"
              }`}>
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Sparkles className="w-40 h-40 text-indigo-400 animate-pulse" />
                </div>
                <div className="relative z-10 flex flex-col gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full w-max ${
                    isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-700"
                  }`}>
                    HanZone Server Workspace
                  </span>
                  <h1 className={`text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    System Control Tower
                  </h1>
                  <p className={`text-xs max-w-xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Monitor real-time server diagnostics, verify GitHub repository synchronizations, and access application integration routes to serve discovery assets to your client devices.
                  </p>
                </div>
              </div>

              {/* Two Column Layout for Real Admin Panel Controls & Integration */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Column 1: System Health & Diagnostics */}
                <div className={`rounded-2xl p-6 border transition-all duration-300 flex flex-col gap-5 ${
                  isDark ? "bg-[#0c1224] border-[#1e2942]" : "bg-white border-slate-200 shadow-sm"
                }`}>
                  <div className="border-b pb-3.5 border-slate-700/15">
                    <h3 className={`font-black uppercase tracking-wider text-[11px] flex items-center gap-2 ${
                      isDark ? "text-slate-200" : "text-slate-800"
                    }`}>
                      <Server className="w-4 h-4 text-indigo-500 animate-pulse" />
                      Server Runtime & Diagnostics
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">Live configuration secrets, repository status, and server state.</p>
                  </div>

                  <div className="space-y-4 flex-1">
                    {/* Status item: Host Process */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-400 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-slate-400" />
                        Host API Status
                      </span>
                      <span className="font-bold text-emerald-500 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Active & Healthy
                      </span>
                    </div>

                    {/* Status item: Secret keys */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-400 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        Security Credentials
                      </span>
                      <span className="font-bold text-emerald-500 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verified Loaded
                      </span>
                    </div>

                    {/* Status item: CDN link */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-400 flex items-center gap-2">
                        <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                        GitHub Sync Link
                      </span>
                      {systemStats?.githubConfigured ? (
                        <span className="font-bold text-emerald-500 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                          <CheckCircle className="w-3.5 h-3.5" /> Bound Repository
                        </span>
                      ) : (
                        <span className="font-bold text-amber-500 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Local Fallback Mode
                        </span>
                      )}
                    </div>

                    {/* Diagnostic details card if offline */}
                    {systemStats && !systemStats.githubConfigured && (
                      <div className={`p-4 rounded-xl border text-[11px] leading-relaxed mt-2 ${
                        isDark ? "bg-[#11192e] border-amber-950/40 text-amber-300/90" : "bg-amber-50/50 border-amber-200 text-amber-800"
                      }`}>
                        <p className="font-extrabold mb-1">💡 Offline-Local Storage Active</p>
                        <p>We are reading/writing from local <code className="font-mono bg-amber-500/10 px-1 rounded">genres.json</code> files. To activate live GitHub commits, add <code className="font-mono">GITHUB_TOKEN</code> to your Secrets tab in AI Studio settings.</p>
                      </div>
                    )}

                    {/* Bound configs display if online */}
                    {systemStats && systemStats.githubConfigured && (
                      <div className={`p-4 rounded-xl border text-[11px] space-y-2 mt-2 ${
                        isDark ? "bg-[#060a15] border-[#131d33] text-indigo-300" : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}>
                        <div className="flex justify-between"><span className="text-slate-500">Target Repository:</span> <span className="font-bold truncate max-w-[180px]">{systemStats.owner}/{systemStats.repo}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Target Branch:</span> <span className="font-bold font-mono">{systemStats.branch}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Asset File Path:</span> <span className="font-bold font-mono truncate max-w-[180px]">{systemStats.filePath}</span></div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3.5 border-t border-slate-700/15">
                    <button 
                      onClick={() => setShowSetupGuide(true)}
                      className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-400 font-bold rounded-xl transition-all text-xs border border-indigo-500/10"
                    >
                      Open Developer Integration Guide
                    </button>
                  </div>
                </div>

                {/* Column 2: App Integration Hub */}
                <div className="flex flex-col gap-6">
                  
                  {/* Clean App Integration Route Card */}
                  <div className={`rounded-2xl p-6 border shadow-sm transition-all duration-300 ${
                    isDark ? "bg-[#0c1224] border-[#1e2942]" : "bg-white border-slate-200"
                  }`}>
                    <div className="border-b pb-3.5 mb-4 border-slate-700/15 flex items-center justify-between">
                      <h3 className={`font-black uppercase tracking-wider text-[11px] flex items-center gap-2 ${
                        isDark ? "text-slate-200" : "text-slate-700"
                      }`}>
                        <Globe className="w-4 h-4 text-indigo-500" />
                        App Integration Route
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        GET Method
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Provide this secure, live cache-busting JSON feed to your application developers to instantly populate the mobile application or client discovery views.
                    </p>

                    <div className="space-y-3.5">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dynamic Feed URL</span>
                        <div className={`p-3.5 rounded-xl border font-mono text-xs flex items-center justify-between transition-all overflow-hidden ${
                          isDark ? "bg-[#060a15] border-[#131d33] text-indigo-300" : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}>
                          <span className="truncate mr-3 select-all">{window.location.origin}/api/get-genres</span>
                          <button
                            onClick={() => copyToClipboard(window.location.origin + "/api/get-genres", "get-genres")}
                            className={`p-1.5 rounded-lg hover:bg-indigo-500/10 transition-all shrink-0 text-slate-400 hover:text-indigo-500`}
                            title="Copy Feed URL"
                          >
                            {copiedKey === "get-genres" ? (
                              <span className="text-[10px] font-bold text-emerald-500 font-sans">Copied!</span>
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Clean cURL Block */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verify via Terminal (cURL)</span>
                        <div className={`p-3.5 rounded-xl border font-mono text-xs flex items-center justify-between ${
                          isDark ? "bg-[#03060f] border-[#131d33] text-slate-300" : "bg-slate-900 border-slate-950 text-slate-300"
                        }`}>
                          <span className="truncate select-all mr-3">curl -s "{window.location.origin}/api/get-genres"</span>
                          <button
                            onClick={() => copyToClipboard(`curl -s "${window.location.origin}/api/get-genres"`, "curl")}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0"
                            title="Copy cURL Command"
                          >
                            {copiedKey === "curl" ? (
                              <span className="text-[10px] font-bold text-emerald-400 font-sans">Copied!</span>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>


                </div>

              </div>
            </div>
          )}

          {/* GENRES SECTION */}
          {activeTab === "genres" && (
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
              <div className={`p-4 border rounded-2xl transition-all duration-300 flex flex-col md:flex-row gap-5 shrink-0 shadow-sm ${
                isDark ? "bg-[#0d1326] border-[#1e2942]" : "bg-white border-slate-200"
              }`}>
                {/* Left Side: Three Lines of Controls */}
                <div className="flex-1 md:flex-[7] flex flex-col gap-3 w-full">
                  <div className="flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-wider shrink-0 mb-1">
                    <ImageIcon className="w-4.5 h-4.5 text-indigo-400" />
                    Quick Backdrop Editor
                  </div>

                  {/* First line: category menu (only dropdown menu) */}
                  <div className="w-full">
                    <select
                      value={quickSelectName}
                      onChange={(e) => setQuickSelectName(e.target.value)}
                      className={`w-full h-9 px-3 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 border ${
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

                  {/* Second line: bg url input (only input) */}
                  <div className="w-full">
                    <input
                      type="text"
                      value={quickBgUrl}
                      onChange={(e) => setQuickBgUrl(e.target.value)}
                      placeholder="Paste image backdrop URL..."
                      className={`w-full h-9 px-3 rounded-xl text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 border ${
                        isDark 
                          ? "bg-[#0a0f1d] border-[#1e2942] text-slate-300 placeholder-slate-600" 
                          : "bg-slate-50 border-slate-200 text-slate-600 placeholder-slate-400"
                      }`}
                    />
                  </div>

                  {/* Third line: save button, reset button and clear button */}
                  <div className="flex items-center gap-2.5 w-full">
                    <button
                      type="button"
                      onClick={handleQuickSave}
                      disabled={loading}
                      className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black tracking-wide rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save URL
                    </button>

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
                      onClick={() => {
                        setQuickBgUrl("");
                        addLog("Cleared backdrop URL input text", "info");
                      }}
                      className={`h-9 px-4 rounded-xl text-xs font-black tracking-wide transition-all border active:scale-[0.98] ${
                        isDark
                          ? "bg-transparent border-slate-700 text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
                          : "bg-white border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200"
                      }`}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Right Side: Image Preview */}
                <div className="flex-1 md:flex-[5] flex flex-col justify-center w-full">
                  <div className={`relative h-36 md:h-44 w-full rounded-xl overflow-hidden border flex items-center justify-center group transition-colors duration-300 p-1.5 ${
                    isDark ? "border-[#1e2942] bg-[#0c1224]" : "border-slate-200 bg-slate-50"
                  }`}>
                    {quickBgUrl ? (
                      !quickImageError ? (
                        <img
                          src={quickBgUrl}
                          alt="Quick backdrop preview"
                          className="w-full h-full object-contain rounded-lg shadow-sm"
                          referrerPolicy="no-referrer"
                          onError={() => setQuickImageError(true)}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-red-400">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          <span className="text-[10px] font-bold">Invalid URL</span>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400">
                        <ImageIcon className="w-5 h-5 text-indigo-400 opacity-60" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">No Image URL</span>
                      </div>
                    )}
                  </div>
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
                                className="w-full h-full object-contain rounded-lg shadow-md"
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
        )}

        {/* HERO BANNER SECTION */}
        {activeTab === "hero" && (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
            <header className="flex flex-col gap-2 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <Tv className="w-6 h-6 text-indigo-500 animate-pulse" />
                    Hero Banner Dashboard
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Easily arrange and modify dramas and films displayed in the app's main hero banner.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadHeroConfig()}
                    disabled={heroLoading}
                    className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 border ${
                      isDark 
                        ? "bg-[#11192e] border-[#1e2942] hover:bg-[#1c294a] text-slate-200" 
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm"
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${heroLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => saveHeroConfig()}
                    disabled={heroSaving}
                    className="h-9 px-4 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/10"
                  >
                    <Save className="w-4 h-4" />
                    {heroSaving ? "Saving..." : "Save & Publish"}
                  </button>
                </div>
              </div>
            </header>

            {/* Dashboard Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                
                {/* Mode & Limits Card */}
                <div className={`rounded-2xl p-5 border shadow-sm flex flex-col gap-5 text-left transition-colors duration-300 ${
                  isDark ? "bg-[#0c1224] border-[#1e2942]" : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center gap-2 pb-3 border-b transition-colors duration-300 border-[#1e2942]/10 dark:border-slate-700/20">
                    <Sliders className="w-4.5 h-4.5 text-indigo-400" />
                    <h2 className="text-sm font-bold tracking-tight">Banner Strategy</h2>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Banner Selection Mode
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["AUTO", "MANUAL", "HYBRID"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setHeroConfig(prev => ({ ...prev, mode: m }))}
                          className={`py-2 rounded-lg text-[11px] font-bold border transition-all ${
                            heroConfig.mode === m
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : isDark
                                ? "bg-[#11192e] border-[#1e2942] text-slate-400 hover:bg-[#1a2544] hover:text-slate-200"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      {heroConfig.mode === "AUTO" && "AUTO Mode: The app automatically pulls top-rated, popular, or trending dramas dynamically."}
                      {heroConfig.mode === "MANUAL" && "MANUAL Mode: The hero banner slider is fully curated using your pinned items."}
                      {heroConfig.mode === "HYBRID" && "HYBRID Mode: Mix of pinned items at set slots (e.g. pin to slide 1) and dynamic fill for the rest."}
                    </p>
                  </div>

                  {/* Max Items Field */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Max Slide Items
                      </label>
                      <span className="text-[11px] font-mono font-bold text-indigo-400">
                        {heroConfig.max_items} Dramas
                      </span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={12}
                      step={1}
                      value={heroConfig.max_items}
                      onChange={(e) => setHeroConfig(prev => ({ ...prev, max_items: parseInt(e.target.value, 10) }))}
                      className="w-full accent-indigo-600 h-1.5 rounded-lg bg-slate-700 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold font-mono">
                      <span>Min: 3</span>
                      <span>Max: 12</span>
                    </div>
                  </div>

                  {/* Auto-Fill Source Fallback Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Auto-Fill Content Source
                    </label>
                    <select
                      value={heroConfig.auto_source}
                      onChange={(e) => setHeroConfig(prev => ({ ...prev, auto_source: e.target.value as any }))}
                      className={`w-full h-9 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors duration-300 border ${
                        isDark 
                          ? "bg-[#11192e] border-[#1e2942] text-slate-100" 
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <option value="popular">Popular / Top-Rated (Dramas)</option>
                      <option value="trending">Trending Today</option>
                      <option value="latest">Latest Released</option>
                    </select>
                    <p className="text-[9px] text-slate-500 leading-relaxed">
                      This fallback query runs when auto-populating unpinned slots in hybrid/auto modes.
                    </p>
                  </div>
                </div>

                {/* Add Pinning Form Card */}
                {heroConfig.mode !== "AUTO" && (
                  <div className={`rounded-2xl p-5 border shadow-sm flex flex-col gap-4 text-left transition-colors duration-300 ${
                    isDark ? "bg-[#0c1224] border-[#1e2942]" : "bg-white border-slate-200"
                  }`}>
                    <div className="flex items-center justify-between pb-3 border-b transition-colors duration-300 border-[#1e2942]/10 dark:border-slate-700/20">
                      <div className="flex items-center gap-2">
                        <Pin className="w-4.5 h-4.5 text-indigo-400 rotate-45" />
                        <h2 className="text-sm font-bold tracking-tight">Pin Drama Pager</h2>
                      </div>
                      
                      {/* Inner Tabs */}
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/30">
                        <button
                          onClick={() => setTmdbPinMode("search")}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                            tmdbPinMode === "search"
                              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-slate-100 shadow-sm"
                              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          }`}
                        >
                          Search
                        </button>
                        <button
                          onClick={() => setTmdbPinMode("direct")}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                            tmdbPinMode === "direct"
                              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-slate-100 shadow-sm"
                              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          }`}
                        >
                          ID Lookup
                        </button>
                      </div>
                    </div>

                    {tmdbPinMode === "search" ? (
                      <div className="flex flex-col gap-3">
                        {/* Search Input Form */}
                        <form onSubmit={handleTmdbSearch} className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={tmdbSearchQuery}
                              onChange={(e) => setTmdbSearchQuery(e.target.value)}
                              placeholder="Search drama by name (e.g. Vincenzo)..."
                              className={`w-full h-9 pl-9 pr-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors duration-300 border ${
                                isDark 
                                  ? "bg-[#11192e] border-[#1e2942] text-slate-100 placeholder-slate-500" 
                                  : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                              }`}
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={tmdbSearchLoading}
                            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            {tmdbSearchLoading ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              "Search"
                            )}
                          </button>
                        </form>

                        {/* Search Results Display */}
                        {tmdbSearchResults.length > 0 ? (
                          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                            {tmdbSearchResults.map((show) => {
                              return (
                                <div 
                                  key={show.id}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left gap-3 transition-colors ${
                                    isDark ? "bg-[#10172a] border-[#1e2942] hover:border-indigo-500/30" : "bg-slate-50 border-slate-150 hover:border-indigo-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <img 
                                      src={show.poster_path} 
                                      alt={show.title}
                                      referrerPolicy="no-referrer"
                                      className="w-8 h-11 rounded object-cover bg-slate-800 shrink-0 border border-slate-700/20 shadow-sm"
                                    />
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                        {show.title}
                                      </h4>
                                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                        {show.release_date ? show.release_date.split("-")[0] : "N/A"} • ID: {show.id}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Slot Selection & Pin Button */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <select
                                      id={`slot-select-${show.id}`}
                                      defaultValue={firstAvailableSlot}
                                      className={`h-7 px-2 py-0 rounded-lg text-[10px] font-bold focus:outline-none transition-colors border ${
                                        isDark 
                                          ? "bg-[#161f38] border-[#223054] text-slate-100" 
                                          : "bg-white border-slate-250 text-slate-700"
                                      }`}
                                    >
                                      {Array.from({ length: heroConfig.max_items }).map((_, i) => {
                                        const slotNum = i + 1;
                                        const pinnedItem = heroConfig.pinned_items.find(p => p.position === slotNum);
                                        const details = pinnedItem ? resolvedDramas[pinnedItem.drama_id] : null;
                                        const slotTitle = details?.title || pinnedItem?.drama?.title || pinnedItem?.drama_id;
                                        return (
                                          <option key={slotNum} value={slotNum}>
                                            Slot #{slotNum} {pinnedItem ? `(Occupied: ${slotTitle})` : "(Available)"}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    
                                    <button
                                      onClick={() => {
                                        const selectElem = document.getElementById(`slot-select-${show.id}`) as HTMLSelectElement;
                                        const chosenPos = selectElem ? parseInt(selectElem.value, 10) : 1;
                                        
                                        const updatedPins = heroConfig.pinned_items.filter(item => item.position !== chosenPos);
                                        updatedPins.push({
                                          drama_id: show.id,
                                          position: chosenPos
                                        });
                                        updatedPins.sort((a, b) => a.position - b.position);

                                        setHeroConfig(prev => ({
                                          ...prev,
                                          pinned_items: updatedPins
                                        }));

                                        setResolvedDramas(prev => ({
                                          ...prev,
                                          [show.id]: show
                                        }));

                                        addLog(`Successfully pinned "${show.title}" to Slide Slot #${chosenPos}!`, "success");
                                      }}
                                      className="h-7 w-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                                      title="Pin this drama"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6 px-4 border border-dashed border-slate-700/10 dark:border-slate-800/60 rounded-xl">
                            <Search className="w-6 h-6 text-slate-500 mx-auto opacity-55 mb-2" />
                            <p className="text-[11px] text-slate-400 font-medium">Search for TV series or movie titles to find TMDB details & backdrop images instantly.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <div className="flex-1 flex flex-col gap-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                              Lookup TMDB Drama ID
                            </label>
                            <input
                              type="text"
                              value={newPinnedDramaId}
                              onChange={(e) => setNewPinnedDramaId(e.target.value)}
                              placeholder="e.g. 111837, 94605, 96648"
                              className={`w-full h-9 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs transition-colors duration-300 border ${
                                isDark 
                                  ? "bg-[#11192e] border-[#1e2942] text-slate-100 placeholder-slate-600" 
                                  : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                              }`}
                            />
                          </div>
                          <button
                            onClick={() => handleTmdbLookup(newPinnedDramaId)}
                            disabled={lookupLoading || !newPinnedDramaId.trim()}
                            className="h-9 px-4 mt-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                          >
                            {lookupLoading ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              "Lookup ID"
                            )}
                          </button>
                        </div>

                        {/* Resolved Drama Card Preview */}
                        {lookupDramaResult ? (
                          <div className={`p-3.5 rounded-xl border text-left flex flex-col gap-3 transition-all ${
                            isDark ? "bg-[#0b1021] border-indigo-500/20" : "bg-slate-50 border-indigo-100"
                          }`}>
                            <div className="flex gap-3">
                              {lookupDramaResult.poster_path && (
                                <img 
                                  src={lookupDramaResult.poster_path} 
                                  alt={lookupDramaResult.title}
                                  referrerPolicy="no-referrer"
                                  className="w-12 h-16 rounded object-cover bg-slate-800 border border-slate-700/20 shrink-0 shadow-sm"
                                />
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black text-indigo-400 font-mono tracking-wider uppercase">Resolved Show Metadata</span>
                                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5 truncate">{lookupDramaResult.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  {lookupDramaResult.vote_average > 0 && (
                                    <span className="text-[10px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">
                                      ★ {Number(lookupDramaResult.vote_average).toFixed(1)}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {lookupDramaResult.release_date ? lookupDramaResult.release_date.split("-")[0] : ""}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono bg-slate-500/10 px-1 py-0.5 rounded uppercase">
                                    {lookupDramaResult.type}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                              {lookupDramaResult.overview}
                            </p>

                            <div className="flex gap-2 items-center border-t border-slate-700/10 dark:border-slate-800/60 pt-3 mt-1">
                              <div className="flex-1 flex flex-col gap-1">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Slot / Slide Index</span>
                                <select
                                  value={newPinnedPosition}
                                  onChange={(e) => setNewPinnedPosition(parseInt(e.target.value, 10))}
                                  className={`w-full h-8 px-2 rounded-lg text-xs transition-colors border ${
                                    isDark 
                                      ? "bg-[#11192e] border-[#1e2942] text-slate-100" 
                                      : "bg-white border-slate-200 text-slate-700"
                                  }`}
                                >
                                  {Array.from({ length: heroConfig.max_items }).map((_, i) => {
                                    const slotNum = i + 1;
                                    const pinnedItem = heroConfig.pinned_items.find(p => p.position === slotNum);
                                    const details = pinnedItem ? resolvedDramas[pinnedItem.drama_id] : null;
                                    const slotTitle = details?.title || pinnedItem?.drama?.title || pinnedItem?.drama_id;
                                    return (
                                      <option key={slotNum} value={slotNum}>
                                        Slot #{slotNum} {pinnedItem ? `(Occupied: ${slotTitle})` : "(Available)"}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              <button
                                onClick={() => {
                                  const updatedPins = heroConfig.pinned_items.filter(item => item.position !== newPinnedPosition);
                                  updatedPins.push({
                                    drama_id: lookupDramaResult.id,
                                    position: newPinnedPosition
                                  });
                                  updatedPins.sort((a, b) => a.position - b.position);

                                  setHeroConfig(prev => ({
                                    ...prev,
                                    pinned_items: updatedPins
                                  }));

                                  setResolvedDramas(prev => ({
                                    ...prev,
                                    [lookupDramaResult.id]: lookupDramaResult
                                  }));

                                  addLog(`Successfully pinned "${lookupDramaResult.title}" (ID: ${lookupDramaResult.id}) to Position Slot #${newPinnedPosition}!`, "success");
                                  setLookupDramaResult(null);
                                  setNewPinnedDramaId("");
                                }}
                                className="h-8 flex-1 mt-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Pin Resolved Drama
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                Direct Pin (Fast Mode)
                              </label>
                              <div className="flex gap-2 items-center">
                                <select
                                  value={newPinnedPosition}
                                  onChange={(e) => setNewPinnedPosition(parseInt(e.target.value, 10))}
                                  className={`h-9 px-3 rounded-xl text-xs transition-colors border ${
                                    isDark 
                                      ? "bg-[#11192e] border-[#1e2942] text-slate-100" 
                                      : "bg-slate-50 border-slate-200 text-slate-700"
                                  }`}
                                >
                                  {Array.from({ length: heroConfig.max_items }).map((_, i) => {
                                    const slotNum = i + 1;
                                    const pinnedItem = heroConfig.pinned_items.find(p => p.position === slotNum);
                                    const details = pinnedItem ? resolvedDramas[pinnedItem.drama_id] : null;
                                    const slotTitle = details?.title || pinnedItem?.drama?.title || pinnedItem?.drama_id;
                                    return (
                                      <option key={slotNum} value={slotNum}>
                                        Slot #{slotNum} {pinnedItem ? `(Occupied: ${slotTitle})` : "(Available)"}
                                      </option>
                                    );
                                  })}
                                </select>
                                <button
                                  onClick={() => {
                                    if (!newPinnedDramaId.trim()) {
                                      addLog("Drama ID is required to pin.", "error");
                                      return;
                                    }
                                    
                                    const updatedPins = heroConfig.pinned_items.filter(item => item.position !== newPinnedPosition);
                                    updatedPins.push({
                                      drama_id: newPinnedDramaId.trim(),
                                      position: newPinnedPosition
                                    });
                                    updatedPins.sort((a, b) => a.position - b.position);

                                    setHeroConfig(prev => ({
                                      ...prev,
                                      pinned_items: updatedPins
                                    }));
                                    
                                    addLog(`Pinned ID '${newPinnedDramaId.trim()}' to position #${newPinnedPosition} locally.`, "success");
                                    setNewPinnedDramaId("");
                                  }}
                                  disabled={!newPinnedDramaId.trim()}
                                  className="h-9 flex-1 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 font-bold text-xs transition-all flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Pin ID Direct
                                </button>
                              </div>
                            </div>
                            
                            <div className="text-center py-4 px-4 border border-dashed border-slate-700/10 dark:border-slate-800/60 rounded-xl">
                              <Info className="w-4.5 h-4.5 text-slate-500 mx-auto opacity-55 mb-2" />
                              <p className="text-[10px] text-slate-400 font-medium">Tip: Type a numeric TMDB ID and press "Lookup ID" to pull its beautiful visual posters and storyline. Or click "Pin ID Direct" to save the ID immediately.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Immediate save button after pinning any drama */}
                    {initialHeroConfig && JSON.stringify(heroConfig.pinned_items) !== JSON.stringify(initialHeroConfig.pinned_items) && (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-left animate-fade-in">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-[11px] font-bold text-emerald-400">Pinned changes pending save</span>
                        </div>
                        <button
                          onClick={() => saveHeroConfig()}
                          disabled={heroSaving}
                          className="h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all flex items-center gap-1 cursor-pointer shadow"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {heroSaving ? "Saving..." : "Save Pinned Drama"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Center/Right: Slide Track Visualizer & Integration */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Slide Track Visualizer Card */}
                <div className={`rounded-2xl p-5 border shadow-sm flex flex-col gap-5 text-left transition-colors duration-300 ${
                  isDark ? "bg-[#0c1224] border-[#1e2942]" : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b transition-colors duration-300 border-[#1e2942]/10 dark:border-slate-700/20">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4.5 h-4.5 text-indigo-400" />
                      <h2 className="text-sm font-bold tracking-tight">Slide Deck Layout Preview</h2>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      Total Track Length: {heroConfig.max_items} Slides
                    </span>
                  </div>

                  {/* Pending save banner for layout changes */}
                  {initialHeroConfig && JSON.stringify(heroConfig.pinned_items) !== JSON.stringify(initialHeroConfig.pinned_items) && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-left animate-fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-emerald-400">Layout changes pending save</p>
                          <p className="text-[10px] text-slate-400">Drag items to reorder slide positions visually.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => saveHeroConfig()}
                        disabled={heroSaving}
                        className="w-full sm:w-auto h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {heroSaving ? "Saving..." : "Save Layout Changes"}
                      </button>
                    </div>
                  )}

                  {/* Track Deck */}
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: heroConfig.max_items }).map((_, index) => {
                      const pos = index + 1;
                      const pinnedItem = heroConfig.pinned_items.find(p => p.position === pos);
                      const isPinned = !!pinnedItem && heroConfig.mode !== "AUTO";
                      const isDragged = draggedPosition === pos;
                      const isDragOver = dragOverPosition === pos;

                      return (
                        <div
                          key={pos}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, pos)}
                          onDragOver={(e) => handleDragOver(e, pos)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, pos)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                            isDragged
                              ? "opacity-30 border-dashed border-indigo-500 bg-indigo-500/5 scale-[0.98]"
                              : isDragOver
                                ? "border-indigo-500 bg-indigo-500/10 scale-[1.01] shadow-lg ring-2 ring-indigo-500/20"
                                : isPinned
                                  ? isDark
                                    ? "bg-[#101931] border-indigo-500/40 hover:border-indigo-500/60 shadow-inner cursor-grab active:cursor-grabbing"
                                    : "bg-indigo-50/50 border-indigo-200 hover:border-indigo-300 shadow-sm cursor-grab active:cursor-grabbing"
                                  : isDark
                                    ? "bg-[#0f172a] border-slate-800 hover:border-slate-700 cursor-grab active:cursor-grabbing"
                                    : "bg-slate-50 border-slate-100 hover:border-slate-200 cursor-grab active:cursor-grabbing"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Grip handle and slide number indicator */}
                            <div className="flex items-center gap-1.5 shrink-0 select-none">
                              <GripVertical className="w-4 h-4 text-slate-500/40 hover:text-indigo-400 transition-colors shrink-0 cursor-grab active:cursor-grabbing" />
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black font-mono shadow ${
                                isPinned
                                  ? "bg-indigo-600 text-white"
                                  : isDark
                                    ? "bg-slate-800 text-slate-300"
                                    : "bg-white text-slate-500 border border-slate-200"
                              }`}>
                                #{pos}
                              </div>
                            </div>
                            
                            {isPinned ? (
                              (() => {
                                const details = resolvedDramas[pinnedItem.drama_id];
                                return details ? (
                                  <div 
                                    onClick={() => {
                                      setSlideTitleInput(details.title || "");
                                      setSlideIdInput(pinnedItem.drama_id || "");
                                      setSlideYearInput(details.release_date ? parseInt(details.release_date.split("-")[0], 10) || 2024 : 2024);
                                      setSlideRatingInput(details.vote_average || 8.0);
                                      setSlideTypeInput(details.type === "movie" || details.type === "Movie" ? "movie" : "tv");
                                      setSlideBackdropInput(details.backdrop_path || details.poster_path || "");
                                      setSlideOverviewInput(details.overview || "");
                                      setSlideCountryInput(details.country || "KR");
                                      setEditingSlidePos(pos);
                                    }}
                                    className="flex items-center gap-3 text-left cursor-pointer hover:opacity-80 transition-opacity active:scale-[0.99] origin-left group/title select-none"
                                    title="Click to Edit Slide"
                                  >
                                    {details.poster_path && (
                                      <img
                                        src={details.poster_path}
                                        alt={details.title}
                                        referrerPolicy="no-referrer"
                                        className="w-10 h-14 rounded object-cover border border-[#1e2942]/10 dark:border-slate-800/50 shadow-sm shrink-0"
                                      />
                                    )}
                                    <div className="flex flex-col">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                          {details.title}
                                          <Pencil className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
                                        </span>
                                        {details.vote_average > 0 && (
                                          <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/10">
                                            ★ {Number(details.vote_average).toFixed(1)}
                                          </span>
                                        )}
                                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 dark:bg-indigo-500/20 dark:text-indigo-300">
                                          Pinned
                                        </span>
                                        {details.country && (
                                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 dark:bg-emerald-500/20 dark:text-emerald-300">
                                            {details.country === "KR" ? "🇰🇷 KR" : `🌐 ${details.country}`}
                                          </span>
                                        )}
                                        <span className="text-[9px] text-slate-400 font-mono">
                                          ID: {pinnedItem.drama_id}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                        {details.release_date ? `${details.release_date.split("-")[0]}` : ""} {details.genres && details.genres.length > 0 ? `• ${details.genres.slice(0, 2).join(", ")}` : ""}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 max-w-sm sm:max-w-md md:max-w-lg">
                                        {details.overview}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div 
                                    onClick={() => {
                                      setSlideTitleInput("");
                                      setSlideIdInput(pinnedItem.drama_id || "");
                                      setSlideYearInput(2024);
                                      setSlideRatingInput(8.0);
                                      setSlideTypeInput("tv");
                                      setSlideBackdropInput("");
                                      setSlideOverviewInput("");
                                      setSlideCountryInput("KR");
                                      setEditingSlidePos(pos);
                                    }}
                                    className="text-left cursor-pointer hover:opacity-80 transition-opacity select-none"
                                    title="Click to Edit Slide"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black font-mono tracking-wide text-indigo-400 dark:text-indigo-300">
                                        {pinnedItem.drama_id}
                                      </span>
                                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 animate-pulse">
                                        Resolving...
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      Resolving TMDB/Gemini show metadata & backdrop assets...
                                    </p>
                                  </div>
                                );
                              })()
                            ) : (
                              <div 
                                onClick={() => {
                                  setSlideTitleInput("");
                                  setSlideIdInput("");
                                  setSlideYearInput(2024);
                                  setSlideRatingInput(8.0);
                                  setSlideTypeInput("tv");
                                  setSlideBackdropInput("");
                                  setSlideOverviewInput("");
                                  setSlideCountryInput("KR");
                                  setEditingSlidePos(pos);
                                }}
                                className="text-left cursor-pointer hover:opacity-80 transition-opacity select-none"
                                title="Click to Program Slot Manually"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-500 italic">
                                    {heroConfig.mode === "MANUAL" 
                                      ? "Slot empty / Unassigned (In MANUAL mode this slot will skip)" 
                                      : `Dynamically populated using active Fallback queries [${heroConfig.auto_source}]`}
                                  </span>
                                  {heroConfig.mode === "HYBRID" && (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                      Auto Fill
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  System will fetch top dramas and dynamically map results here. Click to manually fill this slot.
                                </p>
                              </div>
                            )}
                          </div>
 
                          {/* Slide Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isPinned ? (
                              <>
                                <button
                                  onClick={() => {
                                    const details = resolvedDramas[pinnedItem.drama_id];
                                    if (details) {
                                      setSlideTitleInput(details.title || "");
                                      setSlideIdInput(pinnedItem.drama_id || "");
                                      setSlideYearInput(details.release_date ? parseInt(details.release_date.split("-")[0], 10) || 2024 : 2024);
                                      setSlideRatingInput(details.vote_average || 8.0);
                                      setSlideTypeInput(details.type === "movie" || details.type === "Movie" ? "movie" : "tv");
                                      setSlideBackdropInput(details.backdrop_path || details.poster_path || "");
                                      setSlideOverviewInput(details.overview || "");
                                      setSlideCountryInput(details.country || "KR");
                                    } else {
                                      setSlideTitleInput("");
                                      setSlideIdInput(pinnedItem.drama_id || "");
                                      setSlideYearInput(2024);
                                      setSlideRatingInput(8.0);
                                      setSlideTypeInput("tv");
                                      setSlideBackdropInput("");
                                      setSlideOverviewInput("");
                                      setSlideCountryInput("KR");
                                    }
                                    setEditingSlidePos(pos);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                  title="Edit Slide"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => {
                                    const details = resolvedDramas[pinnedItem.drama_id];
                                    const title = details?.title || pinnedItem.drama_id;
                                    setPendingUnpin({
                                      drama_id: pinnedItem.drama_id,
                                      position: pos,
                                      title: title
                                    });
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                                  title="Unpin Drama"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setSlideTitleInput("");
                                  setSlideIdInput("");
                                  setSlideYearInput(2024);
                                  setSlideRatingInput(8.0);
                                  setSlideTypeInput("tv");
                                  setSlideBackdropInput("");
                                  setSlideOverviewInput("");
                                  setSlideCountryInput("KR");
                                  setEditingSlidePos(pos);
                                }}
                                className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-400 transition-colors cursor-pointer"
                                title="Manually Program Slot"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>



              </div>

            </div>

            {/* SLIDE EDIT OVERLAY MODAL */}
            {editingSlidePos !== null && (
              <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div 
                  className={`w-full max-w-xl rounded-2xl border shadow-2xl p-6 relative flex flex-col gap-4 text-left transition-all my-8 ${
                    isDark 
                      ? "bg-[#0b1224]/95 border-[#1e2d4d] text-slate-100 shadow-indigo-950/20" 
                      : "bg-white border-slate-200 text-slate-800 shadow-slate-300"
                  }`}
                >
                  {/* Modal Close button */}
                  <button
                    onClick={() => setEditingSlidePos(null)}
                    className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-500/10 transition-colors text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Header */}
                  <div className="border-b pb-3 transition-colors duration-300 border-slate-700/30">
                    <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                      <Pencil className="w-5 h-5 text-indigo-500 animate-pulse" />
                      Edit Slide #{editingSlidePos} Details
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure details for this banner slide slot. Local changes will be applied instantly.
                    </p>
                  </div>

                  {/* Form Layout */}
                  <div className="flex flex-col gap-4">
                    
                    {/* Title and ID Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* ID Input */}
                      <div className="flex flex-col gap-1.5 font-mono">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">TMDB / Drama ID</label>
                        <input 
                          type="text" 
                          value={slideIdInput}
                          onChange={(e) => setSlideIdInput(e.target.value)}
                          placeholder="e.g. 111837..."
                          className={`w-full h-10 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors duration-300 border ${
                            isDark 
                              ? "bg-[#11192e] border-[#1e2942] text-slate-100 placeholder-slate-600" 
                              : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                          }`}
                        />
                      </div>

                      {/* Title Input */}
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Title Name</label>
                        <input 
                          type="text" 
                          value={slideTitleInput}
                          onChange={(e) => setSlideTitleInput(e.target.value)}
                          placeholder="e.g. Vincenzo..."
                          className={`w-full h-10 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-xs transition-colors duration-300 border ${
                            isDark 
                              ? "bg-[#11192e] border-[#1e2942] text-slate-100 placeholder-slate-600" 
                              : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Metadata elements: Year, Rating, Type, Country */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Type Selector */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Type</label>
                        <select
                          value={slideTypeInput}
                          onChange={(e) => setSlideTypeInput(e.target.value as "tv" | "movie")}
                          className={`w-full h-10 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors duration-300 border ${
                            isDark 
                              ? "bg-[#11192e] border-[#1e2942] text-slate-100" 
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <option value="tv">TV Show</option>
                          <option value="movie">Movie</option>
                        </select>
                      </div>

                      {/* Year Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Release Year</label>
                        <input 
                          type="number" 
                          value={slideYearInput}
                          onChange={(e) => setSlideYearInput(parseInt(e.target.value, 10) || 2024)}
                          placeholder="2024"
                          className={`w-full h-10 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors duration-300 border ${
                            isDark 
                              ? "bg-[#11192e] border-[#1e2942] text-slate-100" 
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        />
                      </div>

                      {/* Rating Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Rating (vote_avg)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          min="0"
                          max="10"
                          value={slideRatingInput}
                          onChange={(e) => setSlideRatingInput(parseFloat(e.target.value) || 8.0)}
                          placeholder="8.0"
                          className={`w-full h-10 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors duration-300 border ${
                            isDark 
                              ? "bg-[#11192e] border-[#1e2942] text-slate-100" 
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        />
                      </div>

                      {/* Country Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Country ISO</label>
                        <input 
                          type="text" 
                          value={slideCountryInput}
                          onChange={(e) => setSlideCountryInput(e.target.value.toUpperCase())}
                          placeholder="KR"
                          maxLength={2}
                          className={`w-full h-10 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors duration-300 border ${
                            isDark 
                              ? "bg-[#11192e] border-[#1e2942] text-slate-100 placeholder-slate-600" 
                              : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Image Links fields */}
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Backdrop URL / Image Link</label>
                        <input 
                          type="text" 
                          value={slideBackdropInput}
                          onChange={(e) => setSlideBackdropInput(e.target.value)}
                          placeholder="e.g. https://image.tmdb.org/t/p/w1280/..."
                          className={`w-full h-10 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors duration-300 border ${
                            isDark 
                              ? "bg-[#11192e] border-[#1e2942] text-slate-100 placeholder-slate-600" 
                              : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Storyline Synopsis */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Synopsis / Storyline</label>
                      <textarea
                        rows={3}
                        value={slideOverviewInput}
                        onChange={(e) => setSlideOverviewInput(e.target.value)}
                        placeholder="Write a brief description or synopsis of the series/movie..."
                        className={`w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors duration-300 border ${
                          isDark 
                            ? "bg-[#11192e] border-[#1e2942] text-slate-100 placeholder-slate-600" 
                            : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                        }`}
                      />
                    </div>

                    {/* Previews */}
                    {slideBackdropInput && (
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Backdrop Preview</span>
                        <div className="h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/20">
                          <img 
                            src={slideBackdropInput} 
                            alt="Backdrop Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-700/30 mt-2">
                    <button 
                      onClick={handleApplySlideEdit}
                      className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Apply Modifications
                    </button>
                    
                    <button 
                      onClick={() => setEditingSlidePos(null)}
                      className={`px-4 h-10 font-bold rounded-xl transition-colors text-xs cursor-pointer ${
                        isDark 
                          ? "bg-[#11192e] text-slate-300 hover:bg-[#1a2544] border border-[#1e2d4d]" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Cancel
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* CDN SECTION */}
        {activeTab === "cdn" && (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
            <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
              isDark ? "bg-[#0c1224] border-[#1e2942]" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center gap-2 text-rose-600 font-black tracking-tight text-lg mb-2">
                <Github className="w-6 h-6" />
                Production CDN & Git Secrets Configuration
              </div>
              <p className={`text-xs leading-relaxed max-w-2xl text-left ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                HanZone Admin implements fully secure backend credentials handling. 
                Instead of leaking sensitive GitHub personal access tokens or repository variables to the client browser, 
                all file write, merge, and tree compilation transactions are handled server-side.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-700/20">
                {/* Active Parameters List */}
                <div className="flex flex-col gap-4">
                  <h3 className={`text-xs font-black uppercase tracking-wider text-left ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Active Environment Context
                  </h3>
                  
                  <div className="space-y-3 font-mono text-xs">
                    <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors duration-300 ${
                      isDark ? "bg-[#11192e] border-[#1e2942]" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest text-left">Git Repository Owner</span>
                        <span className={`font-bold text-left ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                          {systemStats?.owner && systemStats.owner !== "Not Set" ? systemStats.owner : "HanZone Studio"}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        systemStats?.owner && systemStats.owner !== "Not Set" 
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10" 
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/10"
                      }`}>
                        {systemStats?.owner && systemStats.owner !== "Not Set" ? "Configured" : "Placeholder"}
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors duration-300 ${
                      isDark ? "bg-[#11192e] border-[#1e2942]" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest text-left">Repository Name</span>
                        <span className={`font-bold text-left ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                          {systemStats?.repo && systemStats.repo !== "Not Set" ? systemStats.repo : "hanzone-app-data"}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        systemStats?.repo && systemStats.repo !== "Not Set" 
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10" 
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/10"
                      }`}>
                        {systemStats?.repo && systemStats.repo !== "Not Set" ? "Configured" : "Placeholder"}
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors duration-300 ${
                      isDark ? "bg-[#11192e] border-[#1e2942]" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest text-left">Active Branch</span>
                        <span className={`font-bold text-left ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                          {systemStats?.branch || "main (production)"}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 uppercase">
                        {systemStats?.branch ? "Active" : "Default"}
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors duration-300 ${
                      isDark ? "bg-[#11192e] border-[#1e2942]" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest text-left">Raw File path Target</span>
                        <span className={`font-bold text-left ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                          /{systemStats?.filePath || "genres.json"}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 uppercase">Parsed</span>
                    </div>
                  </div>
                </div>

                {/* CDN Sync Control Panel */}
                <div className={`rounded-xl p-5 border transition-colors duration-300 ${
                  isDark ? "bg-[#11192e] border-[#1e2942]" : "bg-slate-50 border-slate-100"
                }`}>
                  <h3 className={`text-xs font-black uppercase tracking-wider mb-3 text-left ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Manually Reload & Flush CDN Cache
                  </h3>
                  <p className={`text-xs leading-relaxed mb-4 text-left ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    To optimize delivery to mobile clients, files served via raw GitHub URLs may experience up to 5 minutes of cache lifetime. 
                    If you modified the `genres.json` file manually on Github, use this action to force-invalidate the local backend memory buffer and fetch the newest contents.
                  </p>

                  <button 
                    onClick={() => loadData()}
                    disabled={loading}
                    className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Reload Production Data From Source
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MEDIA STREAMS SECTION */}
        {activeTab === "streams" && (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 text-left animate-fade-in">
            <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
              isDark ? "bg-[#0c1224] border-[#1e2942]" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center gap-2 text-indigo-500 font-black tracking-tight text-lg mb-2">
                <Video className="w-6 h-6 animate-pulse text-indigo-500" />
                Custom Media Streams & Download Injector
              </div>
              <p className={`text-xs leading-relaxed max-w-2xl mb-6 transition-colors duration-300 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Inject custom `.mp4`, `.m3u8`, or other streaming links directly into details queries. 
                When a user opens details for a specific TMDB ID in the Android application, these URLs are dynamically injected into the response payload.
              </p>

              {linksMessage && (
                <div className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  linksMessage.type === "success" 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {linksMessage.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{linksMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form column */}
                <form onSubmit={handleSaveDramaLink} className="lg:col-span-5 flex flex-col gap-4">
                  <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {linkEditingId ? "Edit Custom Links" : "Inject New Drama Links"}
                  </h3>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-400">TMDB ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 123456"
                      disabled={!!linkEditingId}
                      value={linkDramaId}
                      onChange={(e) => setLinkDramaId(e.target.value)}
                      className={`h-10 px-3 rounded-xl text-xs font-medium border focus:outline-none transition-colors ${
                        isDark 
                          ? "bg-[#11192e] border-slate-700/50 text-slate-100 focus:border-indigo-500" 
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5">The exact TMDB movie or TV series ID.</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-400">Drama Title / Friendly Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Queen of Tears"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      className={`h-10 px-3 rounded-xl text-xs font-medium border focus:outline-none transition-colors ${
                        isDark 
                          ? "bg-[#11192e] border-slate-700/50 text-slate-100 focus:border-indigo-500" 
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5">Helps identify the drama in this list.</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-400">Direct Stream URL (stream_url)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/stream.m3u8"
                      value={linkStreamUrl}
                      onChange={(e) => setLinkStreamUrl(e.target.value)}
                      className={`h-10 px-3 rounded-xl text-xs font-medium border focus:outline-none transition-colors ${
                        isDark 
                          ? "bg-[#11192e] border-slate-700/50 text-slate-100 focus:border-indigo-500" 
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5">Direct stream link (HLS/m3u8, MP4, etc.) for video player.</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-400">Direct Download URL (download_url)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/download.mp4"
                      value={linkDownloadUrl}
                      onChange={(e) => setLinkDownloadUrl(e.target.value)}
                      className={`h-10 px-3 rounded-xl text-xs font-medium border focus:outline-none transition-colors ${
                        isDark 
                          ? "bg-[#11192e] border-slate-700/50 text-slate-100 focus:border-indigo-500" 
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5">Allows direct download options inside the mobile player.</span>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="submit"
                      disabled={linksSaving}
                      className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Save className="w-4 h-4" />
                      {linksSaving ? "Saving..." : linkEditingId ? "Update Injected URLs" : "Inject Media URLs"}
                    </button>

                    {linkEditingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setLinkDramaId("");
                          setLinkTitle("");
                          setLinkStreamUrl("");
                          setLinkDownloadUrl("");
                          setLinkEditingId(null);
                        }}
                        className={`px-4 h-11 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                {/* Table list column */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Active Injections ({Object.keys(dramaLinks).length})
                  </h3>

                  <div className={`border rounded-xl overflow-hidden ${
                    isDark ? "border-[#1e2942]/60 bg-[#070b14]" : "border-slate-200 bg-slate-50/50"
                  }`}>
                    {linksLoading ? (
                      <div className="p-12 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                        <span className="text-xs text-slate-400 font-medium">Loading injection points...</span>
                      </div>
                    ) : Object.keys(dramaLinks).length === 0 ? (
                      <div className="p-12 flex flex-col items-center justify-center gap-2 text-center">
                        <Video className="w-8 h-8 text-slate-500 opacity-60" />
                        <span className="text-xs font-bold text-slate-400">No custom stream links injected yet.</span>
                        <p className="text-[10px] text-slate-500 max-w-xs mt-1">
                          Configure a drama's TMDB ID and input stream or download links to persist them to the backend cloud store.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-[460px]">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${
                              isDark ? "border-[#1e2942] bg-[#0c1224] text-slate-400" : "border-slate-200 bg-slate-100/80 text-slate-500"
                            }`}>
                              <th className="py-3 px-4">TMDB ID</th>
                              <th className="py-3 px-4">Title / Name</th>
                              <th className="py-3 px-4">Stream</th>
                              <th className="py-3 px-4">Download</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/10">
                            {Object.entries(dramaLinks).map(([id, rawItem]) => {
                              const item = rawItem as { stream_url: string | null; download_url: string | null; title?: string };
                              return (
                                <tr key={id} className={`hover:bg-slate-500/5 transition-colors ${
                                  isDark ? "text-slate-200" : "text-slate-700"
                                }`}>
                                  <td className="py-3 px-4 font-mono font-bold text-indigo-400 text-[11px]">{id}</td>
                                  <td className="py-3 px-4 font-bold">{item.title || "Drama"}</td>
                                  <td className="py-3 px-4 max-w-[120px] truncate" title={item.stream_url || "None"}>
                                    {item.stream_url ? (
                                      <span className="text-emerald-500 font-mono text-[10px] flex items-center gap-1">
                                        <Play className="w-3 h-3 fill-emerald-500/20" /> Active Link
                                      </span>
                                    ) : <span className="text-slate-500 text-[10px]">None</span>}
                                  </td>
                                  <td className="py-3 px-4 max-w-[120px] truncate" title={item.download_url || "None"}>
                                    {item.download_url ? (
                                      <span className="text-indigo-400 font-mono text-[10px] flex items-center gap-1">
                                        <Link className="w-3 h-3" /> Active Download
                                      </span>
                                    ) : <span className="text-slate-500 text-[10px]">None</span>}
                                  </td>
                                  <td className="py-3 px-4 text-right flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLinkDramaId(id);
                                        setLinkTitle(item.title || "");
                                        setLinkStreamUrl(item.stream_url || "");
                                        setLinkDownloadUrl(item.download_url || "");
                                        setLinkEditingId(id);
                                      }}
                                      className={`p-1.5 rounded-lg hover:text-indigo-500 transition-colors cursor-pointer ${
                                        isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-400" : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                                      }`}
                                      title="Edit Injections"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDramaLink(id)}
                                    className={`p-1.5 rounded-lg hover:text-rose-500 transition-colors cursor-pointer ${
                                      isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-400" : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                                    }`}
                                    title="Delete Injections"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );})}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* HOME LAYOUT CONFIG SECTION */}
        {activeTab === "layout" && (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 text-left animate-fade-in">
            <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
              isDark ? "bg-[#0c1224] border-[#1e2942]" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center gap-2 text-indigo-500 font-black tracking-tight text-lg mb-2">
                <Layers className="w-6 h-6 animate-pulse text-indigo-500" />
                HanZone Home Layout Config Engine
              </div>
              <p className={`text-xs leading-relaxed max-w-2xl mb-6 transition-colors duration-300 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Design and manage the Android application home screen structure dynamically. Change section order, toggle visibility, and build custom mixed-country rails (e.g. merge KR & JP dramas) without redeploying the app.
              </p>

              {layoutMessage && (
                <div className={`mb-6 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  layoutMessage.type === "success" 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {layoutMessage.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{layoutMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Editor Form Column */}
                <div className="xl:col-span-4 flex flex-col gap-4">
                  <form onSubmit={handleSaveSectionForm} className={`p-5 rounded-xl border flex flex-col gap-4 ${
                    isDark ? "bg-[#070b14] border-[#1e2942]/60" : "bg-slate-50/50 border-slate-200"
                  }`}>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {layoutEditingId ? "✏️ Edit Layout Section" : "➕ Add Custom Section"}
                    </h3>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-400">Section Unique ID *</label>
                      <input
                        type="text"
                        required
                        disabled={!!layoutEditingId}
                        placeholder="e.g. kr_dramas"
                        value={layoutSectionId}
                        onChange={(e) => setLayoutSectionId(e.target.value)}
                        className={`h-10 px-3 rounded-xl text-xs font-medium border focus:outline-none focus:border-indigo-500 transition-colors ${
                          isDark ? "bg-[#11192e] border-slate-700/50 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                      <span className="text-[9px] text-slate-500">Must be unique, with no spaces. e.g. `trending_actors`</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-400">Display Title (Human Readable) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Romantic Korean Hits"
                        value={layoutTitleInput}
                        onChange={(e) => setLayoutTitleInput(e.target.value)}
                        className={`h-10 px-3 rounded-xl text-xs font-medium border focus:outline-none focus:border-indigo-500 transition-colors ${
                          isDark ? "bg-[#11192e] border-slate-700/50 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-400">Layout Style Type *</label>
                      <select
                        value={layoutTypeInput}
                        onChange={(e) => setLayoutTypeInput(e.target.value)}
                        className={`h-10 px-3 rounded-xl text-xs font-medium border focus:outline-none focus:border-indigo-500 transition-colors ${
                          isDark ? "bg-[#11192e] border-slate-700/50 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="HERO">HERO (Spotlight Banner)</option>
                        <option value="TOP_10">TOP_10 (Ranked List)</option>
                        <option value="DRAMA_RAIL">DRAMA_RAIL (Title Carousel)</option>
                        <option value="ACTORS">ACTORS (Celebrity Profile Cards)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="visible_check"
                        checked={layoutVisibleInput}
                        onChange={(e) => setLayoutVisibleInput(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="visible_check" className="text-xs font-bold text-slate-400 cursor-pointer select-none">
                        Visible on Android Client Home Screen
                      </label>
                    </div>

                    {/* Data Source Details for DRAMA_RAIL */}
                    {layoutTypeInput === "DRAMA_RAIL" && (
                      <div className={`p-4 rounded-xl border flex flex-col gap-3 mt-1 ${
                        isDark ? "bg-[#0c1224] border-slate-800/80" : "bg-white border-slate-100"
                      }`}>
                        <div className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                          🎯 Data Source Query Options
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-400">Media Type</label>
                          <select
                            value={layoutMediaTypeInput}
                            onChange={(e) => setLayoutMediaTypeInput(e.target.value)}
                            className={`h-8 px-2.5 rounded-lg text-xs font-medium border focus:outline-none focus:border-indigo-500 transition-colors ${
                              isDark ? "bg-[#11192e] border-slate-700/50 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          >
                            <option value="all">All (Movies & TV Series)</option>
                            <option value="tv">TV Series Only</option>
                            <option value="movie">Movies Only</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-400">Allowed Countries (Comma separated)</label>
                          <input
                            type="text"
                            placeholder="KR, JP, CN"
                            value={layoutCountriesInput}
                            onChange={(e) => setLayoutCountriesInput(e.target.value)}
                            className={`h-8 px-2.5 rounded-lg text-xs font-medium border focus:outline-none focus:border-indigo-500 transition-colors ${
                              isDark ? "bg-[#11192e] border-slate-700/50 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          />
                          <span className="text-[9px] text-slate-500">ISO Country codes, e.g. `KR`, `JP`, `CN`, `TW`</span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-400">Sort Field</label>
                          <select
                            value={layoutSortByInput}
                            onChange={(e) => setLayoutSortByInput(e.target.value)}
                            className={`h-8 px-2.5 rounded-lg text-xs font-medium border focus:outline-none focus:border-indigo-500 transition-colors ${
                              isDark ? "bg-[#11192e] border-slate-700/50 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          >
                            <option value="popularity">Popularity (Recommended)</option>
                            <option value="rating">Viewer Rating</option>
                            <option value="newest">Release Year / Newest</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="submit"
                        disabled={layoutSaving}
                        className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Save className="w-4 h-4" />
                        {layoutSaving ? "Saving..." : layoutEditingId ? "Update Section" : "Add Section"}
                      </button>

                      {layoutEditingId && (
                        <button
                          type="button"
                          onClick={() => {
                            setLayoutSectionId("");
                            setLayoutTitleInput("");
                            setLayoutTypeInput("DRAMA_RAIL");
                            setLayoutVisibleInput(true);
                            setLayoutMediaTypeInput("all");
                            setLayoutCountriesInput("KR, JP");
                            setLayoutSortByInput("popularity");
                            setLayoutEditingId(null);
                          }}
                          className={`px-4 h-11 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Preset Quick Actions */}
                  <div className={`p-4 rounded-xl border flex flex-col gap-2.5 ${
                    isDark ? "bg-[#070b14] border-[#1e2942]/60" : "bg-slate-50/50 border-slate-200"
                  }`}>
                    <h4 className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      ⚡ Configuration Presets
                    </h4>
                    <p className="text-[10px] text-slate-500">Apply a pre-configured template instantly. (Warning: Overwrites current settings)</p>
                    
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Restore to default global hybrid layout?")) {
                            saveLayoutConfig(DEFAULT_HOME_LAYOUT);
                          }
                        }}
                        className={`py-2 px-2.5 rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer border ${
                          isDark 
                            ? "bg-indigo-950/20 border-indigo-500/20 text-indigo-400 hover:bg-indigo-950/40" 
                            : "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100/80"
                        }`}
                      >
                        Global Default
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Initialize a Korean Drama focused layout preset?")) {
                            const krPreset = [
                              { "section_id": "hero_banner", "layout_type": "HERO", "title": "Korean Spotlights", "visible": true },
                              { "section_id": "top_10_kr", "layout_type": "TOP_10", "title": "Top 10 K-Dramas", "visible": true },
                              { "section_id": "kr_romance", "layout_type": "DRAMA_RAIL", "title": "Romantic Comedies", "visible": true, "data_source": { "media_type": "tv", "countries": ["KR"], "sort_by": "popularity" } },
                              { "section_id": "jp_cn_gems", "layout_type": "DRAMA_RAIL", "title": "Anime & Chinese Gems", "visible": true, "data_source": { "media_type": "all", "countries": ["JP", "CN"], "sort_by": "popularity" } },
                              { "section_id": "trending_actors", "layout_type": "ACTORS", "title": "Hallyu Stars", "visible": true }
                            ];
                            saveLayoutConfig(krPreset);
                          }
                        }}
                        className={`py-2 px-2.5 rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer border ${
                          isDark 
                            ? "bg-rose-950/20 border-rose-500/20 text-rose-400 hover:bg-rose-950/40" 
                            : "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100/80"
                        }`}
                      >
                        K-Drama Focus
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section Cards List Column */}
                <div className="xl:col-span-8 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Home Screen Rails & Ordering ({homeLayout.length})
                    </h3>
                    <span className="text-[10px] text-slate-500">Android app loads these rails in top-to-bottom sequence</span>
                  </div>

                  {layoutLoading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-2 border rounded-xl">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span className="text-xs text-slate-400 font-medium">Loading layout config...</span>
                    </div>
                  ) : homeLayout.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-2 text-center border rounded-xl">
                      <Layers className="w-8 h-8 text-slate-500 opacity-60" />
                      <span className="text-xs font-bold text-slate-400">No layout sections found.</span>
                      <button
                        onClick={() => saveLayoutConfig(DEFAULT_HOME_LAYOUT)}
                        className="mt-3 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                      >
                        Initialize Default Layout
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {homeLayout.map((section, idx) => {
                        const isEdited = layoutEditingId === section.section_id;
                        return (
                          <div
                            key={section.section_id}
                            className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                              isEdited
                                ? "ring-2 ring-indigo-500 border-indigo-500"
                                : !section.visible
                                  ? isDark ? "bg-[#080d1a]/50 border-slate-800/40 opacity-60" : "bg-slate-100/50 border-slate-200 opacity-60"
                                  : isDark ? "bg-[#070b14] border-[#1e2942]" : "bg-slate-50/50 border-slate-200"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-xl text-xs font-black shrink-0 ${
                                section.layout_type === "HERO"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : section.layout_type === "TOP_10"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : section.layout_type === "ACTORS"
                                      ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                      : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              }`}>
                                {section.layout_type}
                              </div>

                              <div className="flex flex-col text-left">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-xs font-extrabold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                                    {section.title}
                                  </span>
                                  {!section.visible && (
                                    <span className="text-[8px] font-black uppercase px-1.5 bg-rose-500/10 text-rose-400 rounded">
                                      Hidden
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-slate-500 font-mono">
                                  <span>ID: <strong className="text-slate-400">{section.section_id}</strong></span>
                                  {section.layout_type === "DRAMA_RAIL" && section.data_source && (
                                    <>
                                      <span className="text-slate-700">•</span>
                                      <span>Type: <strong className="text-slate-400">{section.data_source.media_type}</strong></span>
                                      <span className="text-slate-700">•</span>
                                      <span>Countries: <strong className="text-slate-400">[{section.data_source.countries?.join(", ") || "All"}]</strong></span>
                                      <span className="text-slate-700">•</span>
                                      <span>Sort: <strong className="text-slate-400">{section.data_source.sort_by}</strong></span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Position Ordering & Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0 md:self-center">
                              {/* Move Controls */}
                              <div className="flex items-center border rounded-lg overflow-hidden border-slate-700/20">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleSectionOrderChange(idx, "up")}
                                  className={`p-1.5 disabled:opacity-30 hover:text-indigo-500 transition-colors cursor-pointer ${
                                    isDark ? "bg-slate-900 text-slate-400 hover:bg-slate-800" : "bg-white text-slate-500 hover:bg-slate-100"
                                  }`}
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === homeLayout.length - 1}
                                  onClick={() => handleSectionOrderChange(idx, "down")}
                                  className={`p-1.5 disabled:opacity-30 border-l border-slate-700/20 hover:text-indigo-500 transition-colors cursor-pointer ${
                                    isDark ? "bg-slate-900 text-slate-400 hover:bg-slate-800" : "bg-white text-slate-500 hover:bg-slate-100"
                                  }`}
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Visibility Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleSectionVisibility(section.section_id)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  !section.visible
                                    ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                                    : isDark
                                      ? "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-indigo-400"
                                      : "bg-white text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                                }`}
                                title={section.visible ? "Hide on Client App" : "Show on Client App"}
                              >
                                <Eye className={`w-3.5 h-3.5 ${!section.visible ? "opacity-60" : ""}`} />
                              </button>

                              {/* Edit Section */}
                              <button
                                type="button"
                                onClick={() => {
                                  setLayoutSectionId(section.section_id);
                                  setLayoutTitleInput(section.title || "");
                                  setLayoutTypeInput(section.layout_type || "DRAMA_RAIL");
                                  setLayoutVisibleInput(section.visible !== false);
                                  if (section.data_source) {
                                    setLayoutMediaTypeInput(section.data_source.media_type || "all");
                                    setLayoutCountriesInput(section.data_source.countries?.join(", ") || "KR, JP");
                                    setLayoutSortByInput(section.data_source.sort_by || "popularity");
                                  } else {
                                    setLayoutMediaTypeInput("all");
                                    setLayoutCountriesInput("KR, JP");
                                    setLayoutSortByInput("popularity");
                                  }
                                  setLayoutEditingId(section.section_id);
                                }}
                                className={`p-1.5 rounded-lg hover:text-indigo-500 transition-colors cursor-pointer ${
                                  isDark ? "bg-slate-900 text-slate-400 hover:bg-slate-800" : "bg-white text-slate-500 hover:bg-slate-100"
                                }`}
                                title="Edit Configuration"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Section */}
                              <button
                                type="button"
                                onClick={() => handleDeleteSection(section.section_id)}
                                className={`p-1.5 rounded-lg hover:text-rose-500 transition-colors cursor-pointer ${
                                  isDark ? "bg-slate-900 text-slate-400 hover:bg-slate-800" : "bg-white text-slate-500 hover:bg-slate-100"
                                }`}
                                title="Delete Section"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Dynamic JSON API Live Preview */}
                  <div className={`mt-4 p-4 rounded-xl border flex flex-col gap-2.5 ${
                    isDark ? "bg-[#070b14] border-[#1e2942]/60" : "bg-slate-50/50 border-slate-200"
                  }`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        isDark ? "text-indigo-400" : "text-indigo-600"
                      }`}>
                        <Code className="w-3.5 h-3.5" />
                        Live API JSON Response Payload Preview
                      </h4>
                      <span className="font-mono text-[9px] text-slate-500">GET /api/get-home-layout</span>
                    </div>
                    <pre className={`p-3 rounded-lg text-[10px] font-mono overflow-x-auto text-left leading-relaxed max-h-[180px] ${
                      isDark ? "bg-[#05070e] text-indigo-300 border border-indigo-950/40" : "bg-white text-indigo-900 border border-slate-200"
                    }`}>
                      {JSON.stringify(homeLayout, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* USERS SECTION */}
        {activeTab === "users" && (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
            <div className={`rounded-2xl p-6 border text-left transition-colors duration-300 ${
              isDark ? "bg-[#0c1224] border-[#1e2942]" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center gap-2 text-indigo-500 font-black tracking-tight text-lg mb-2">
                <Users className="w-6 h-6" />
                Collaborator & Access Management
              </div>
              <p className={`text-xs leading-relaxed max-w-2xl mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Establish multiple administrative accounts, restrict access tokens, and view precise audit trails. 
                This section is currently under planning for Phase 2 implementation.
              </p>

              {/* Administrative Users Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-750/10">
                <table className="w-full text-left text-xs font-medium">
                  <thead className={`text-[10px] uppercase tracking-wider ${
                    isDark ? "bg-[#11192e] text-slate-400" : "bg-slate-50 text-slate-500"
                  }`}>
                    <tr>
                      <th className="p-4">Email Address</th>
                      <th className="p-4">Assigned Role</th>
                      <th className="p-4">Last Active</th>
                      <th className="p-4">Security Level</th>
                      <th className="p-4">Action Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-slate-750/10 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                    <tr>
                      <td className="p-4 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        cjtggg10@gmail.com
                      </td>
                      <td className="p-4 font-mono">OWNER</td>
                      <td className="p-4">Just Now</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold text-[10px]">Level 3 (Max)</span>
                      </td>
                      <td className="p-4">
                        <span className="text-emerald-500 font-bold">Active Host</span>
                      </td>
                    </tr>
                    <tr className="opacity-40">
                      <td className="p-4 font-bold">developer@hanzone.com</td>
                      <td className="p-4 font-mono">DEVELOPER</td>
                      <td className="p-4">3 Days Ago</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold text-[10px]">Level 2</span>
                      </td>
                      <td className="p-4 italic">Pending Phase 2</td>
                    </tr>
                    <tr className="opacity-40">
                      <td className="p-4 font-bold">moderator@hanzone.com</td>
                      <td className="p-4 font-mono">MODERATOR</td>
                      <td className="p-4">Never</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold text-[10px]">Level 1</span>
                      </td>
                      <td className="p-4 italic">Pending Phase 2</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Multi-role disclaimer banner */}
              <div className={`mt-6 p-4 rounded-xl border flex items-center gap-3 ${
                isDark ? "bg-[#11192e] border-[#1e2942] text-indigo-200" : "bg-slate-50 border-slate-100 text-slate-700"
              }`}>
                <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  Additional users will be enabled automatically as soon as the active Database service configuration merges securely.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* LOGS SECTION */}
        {activeTab === "logs" && (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Header segment with filters */}
            <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 ${
              isDark ? "bg-[#0c1224] border-[#1e2942]" : "bg-white border-slate-200"
            }`}>
              <div className="text-left">
                <h2 className={`font-black tracking-tight text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
                  System Diagnostics & Transaction Feed
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Raw log lines generated by active client commits, git pull requests, and secure environment updates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setStatusLogs([])}
                  className={`h-9 px-4 font-bold text-xs rounded-xl transition-all border active:scale-[0.98] ${
                    isDark 
                      ? "bg-transparent border-slate-700 hover:bg-slate-800 text-slate-300" 
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  Clear Feed Log
                </button>
              </div>
            </div>

            {/* Immersive Terminal Output */}
            <div className={`flex-1 rounded-2xl p-5 font-mono text-xs flex flex-col border shadow-inner min-h-0 ${
              isDark 
                ? "bg-[#060a15] border-[#131d33] text-indigo-200" 
                : "bg-slate-950 border-slate-900 text-slate-300"
            }`}>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-extrabold uppercase tracking-widest border-b border-slate-800 pb-2 mb-3 shrink-0">
                <Terminal className="w-4 h-4 text-rose-500" />
                HanZone-Hub-Server-Console v1.0.4 - Live Connection Stream
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                <div className="text-slate-500 text-left">Initializing Terminal Log Capture...</div>
                <div className="text-emerald-500 font-bold text-left">[HOST_CONNECTED] HanZone live admin connected at {new Date().toLocaleDateString()}</div>
                {statusLogs.length === 0 ? (
                  <div className="text-slate-600 italic py-6 text-center">Console stream ready. No transactions logged in this session yet.</div>
                ) : (
                  statusLogs.map((log, index) => (
                    <div key={index} className="flex gap-3 items-start leading-relaxed text-left">
                      <span className="text-slate-600 shrink-0 font-bold">[{log.time}]</span>
                      <span className={
                        log.type === "success" ? "text-emerald-400 font-bold" :
                        log.type === "error" ? "text-rose-500 font-bold animate-pulse" : "text-indigo-300"
                      }>
                        {log.text}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </main>
      </div>

      {/* Center-bottom layout preview delete overlay */}
      {pendingUnpin && (
        <>
          {/* Backdrop layer to prevent click leakage to underlying dashboard components */}
          <div 
            onClick={() => setPendingUnpin(null)}
            className="fixed inset-0 z-40 bg-[#02050e]/50 dark:bg-black/70 backdrop-blur-[1px] animate-fade-in cursor-pointer transition-opacity"
          />
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className={`p-4 rounded-2xl shadow-2xl border flex flex-col sm:flex-row items-center gap-4 max-w-md w-[90vw] ${
              isDark ? "bg-[#0b1021] border-[#1e2942] text-slate-100 shadow-[#03060f]" : "bg-white border-slate-200 text-slate-800 shadow-slate-200"
            }`}>
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                  <Trash2 className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black tracking-tight uppercase text-rose-400">Unpin Drama?</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-bold truncate">
                    Slot #{pendingUnpin.position}: {pendingUnpin.title}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setPendingUnpin(null)}
                  className={`flex-1 sm:flex-none h-8 px-3 rounded-lg text-xs font-bold transition-all border ${
                    isDark 
                      ? "bg-[#161f38] border-[#223054] text-slate-300 hover:bg-[#1f2c4e] cursor-pointer" 
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const updatedPins = heroConfig.pinned_items.filter(p => p.position !== pendingUnpin.position);
                    const newConfig = { ...heroConfig, pinned_items: updatedPins };
                    setHeroConfig(newConfig);
                    setPendingUnpin(null);
                    addLog(`Unpinned "${pendingUnpin.title}" from slide #${pendingUnpin.position} locally.`, "info");
                    
                    // Automatically trigger the save call!
                    await saveHeroConfig(newConfig);
                  }}
                  disabled={heroSaving}
                  className="flex-1 sm:flex-none h-8 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  {heroSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
