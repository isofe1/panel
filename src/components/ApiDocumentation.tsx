import React, { useState } from "react";
import { 
  Code, 
  Database, 
  Globe, 
  Search, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Send, 
  Terminal, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Shield, 
  Clock, 
  Server,
  Lock,
  ExternalLink,
  RefreshCw
} from "lucide-react";

interface ApiDocumentationProps {
  isDark: boolean;
  adminPassword?: string;
}

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

interface Endpoint {
  id: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  category: "Public" | "Admin";
  queryParams?: Parameter[];
  bodyParams?: Parameter[];
  headers?: Parameter[];
  exampleResponse: string;
  defaultInputs?: Record<string, string>;
}

export const ApiDocumentation: React.FC<ApiDocumentationProps> = ({ isDark, adminPassword = "" }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "public" | "admin">("all");
  const [expandedId, setExpandedId] = useState<string | null>("get-genres");
  const [activeSubTab, setActiveSubTab] = useState<"reference" | "integration">("reference");

  // Interactive console state
  const [tryItOutLoading, setTryItOutLoading] = useState<Record<string, boolean>>({});
  const [tryItOutResponse, setTryItOutResponse] = useState<Record<string, string>>({});
  const [tryItOutInputs, setTryItOutInputs] = useState<Record<string, Record<string, string>>>({});
  const [copiedEndpointId, setCopiedEndpointId] = useState<string | null>(null);

  const endpoints: Endpoint[] = [
    {
      id: "get-genres",
      method: "GET",
      path: "/api/get-genres",
      description: "Public, cache-busted endpoint to retrieve the parsed list of genres and keywords. Serves as the primary navigation datasource for mobile categories.",
      category: "Public",
      exampleResponse: JSON.stringify([
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
        }
      ], null, 2)
    },
    {
      id: "get-hero-config",
      method: "GET",
      path: "/api/get-hero-config",
      description: "Public endpoint to retrieve the global dynamic hero banner layout configuration, pre-resolved and enriched with TMDB or Gemini metadata.",
      category: "Public",
      exampleResponse: JSON.stringify({
        "hero_config": {
          "mode": "HYBRID",
          "max_items": 6,
          "auto_source": "popular",
          "pinned_items": [
            {
              "drama_id": "111837",
              "position": 1,
              "drama": {
                "slug": "tv-111837",
                "title": "Queen of Tears",
                "backdrop_url": "https://image.tmdb.org/t/p/w500/lq0YqJuffMuZhoKTiC5xDqvtCSn.jpg",
                "rating": 8.5,
                "year": 2024,
                "type": "tv",
                "country": "KR",
                "synopsis": "The queen of department stores and her small-town husband weather a marital crisis..."
              }
            }
          ]
        }
      }, null, 2)
    },
    {
      id: "get-home-layout",
      method: "GET",
      path: "/api/get-home-layout",
      description: "Public endpoint for the client application to fetch the structural homepage layout rails including visibility flags and metadata criteria filters.",
      category: "Public",
      exampleResponse: JSON.stringify({
        "success": true,
        "layout": [
          {
            "section_id": "1",
            "layout_type": "HERO",
            "title": "Featured Spotlight",
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
          }
        ]
      }, null, 2)
    },
    {
      id: "get-drama-links",
      method: "GET",
      path: "/api/get-drama-links",
      description: "Public endpoint to retrieve a complete flat key-value list of all custom streaming playback and offline download link configurations.",
      category: "Public",
      exampleResponse: JSON.stringify({
        "success": true,
        "links": {
          "111837": {
            "stream_url": "https://example.com/stream/qot",
            "download_url": "https://example.com/download/qot",
            "title": "Queen of Tears",
            "media_type": "tv",
            "seasons": {
              "1": {
                "1": {
                  "stream_url": "https://example.com/stream/qot-s1e1",
                  "download_url": "https://example.com/download/qot-s1e1"
                }
              }
            }
          }
        }
      }, null, 2)
    },
    {
      id: "get-stream-links",
      method: "GET",
      path: "/api/get-stream-links",
      description: "Option A specific streaming links resolver. Dynamically returns stream and download URLs for a given TMDB show ID, supporting specific seasonal or episodic overrides.",
      category: "Public",
      queryParams: [
        { name: "id", type: "string", required: true, description: "The TMDB TV or Movie ID to query." },
        { name: "season", type: "string", required: false, description: "The season number (required for specific TV episodes)." },
        { name: "episode", type: "string", required: false, description: "The episode number (required for specific TV episodes)." }
      ],
      defaultInputs: { id: "111837" },
      exampleResponse: JSON.stringify({
        "success": true,
        "id": "111837",
        "season": "1",
        "episode": "1",
        "stream_url": "https://example.com/stream/qot-s1e1",
        "download_url": "https://example.com/download/qot-s1e1",
        "title": "Queen of Tears",
        "has_custom_episodes": true
      }, null, 2)
    },
    {
      id: "tmdb-details",
      method: "GET",
      path: "/api/tmdb/details",
      description: "Proxies raw TMDB metadata requests on the server, leveraging in-memory caches and fallback Gemini-3.5-Flash synthesis if TMDB is offline or rate-limited.",
      category: "Public",
      queryParams: [
        { name: "id", type: "string", required: true, description: "The TMDB numerical identifier." },
        { name: "type", type: "string", required: false, description: "Media content type hint, either 'tv' or 'movie'.", defaultValue: "tv" }
      ],
      defaultInputs: { id: "111837", type: "tv" },
      exampleResponse: JSON.stringify({
        "success": true,
        "source": "memory_cache",
        "data": {
          "id": "111837",
          "title": "Queen of Tears",
          "type": "tv",
          "poster_path": "https://image.tmdb.org/t/p/w500/posters.jpg",
          "backdrop_path": "https://image.tmdb.org/t/p/w1280/backdrops.jpg",
          "release_date": "2024-03-09",
          "overview": "The queen of department stores and her small-town husband weather a marital crisis...",
          "genres": ["Drama", "Comedy", "Romance"],
          "vote_average": 8.5,
          "country": "KR"
        }
      }, null, 2)
    },
    {
      id: "drama-details",
      method: "GET",
      path: "/api/drama/details",
      description: "A rich, unified public profile endpoint that fetches metadata, cast records, similar content, and overlays active custom stream/download play links and customized episodic data in a single payload.",
      category: "Public",
      queryParams: [
        { name: "id", type: "string", required: true, description: "The TMDB TV or Movie ID to query." },
        { name: "type", type: "string", required: false, description: "Media classification, 'tv' or 'movie'.", defaultValue: "tv" }
      ],
      defaultInputs: { id: "111837", type: "tv" },
      exampleResponse: JSON.stringify({
        "success": true,
        "source": "proxy",
        "data": {
          "id": "111837",
          "title": "Queen of Tears",
          "type": "tv",
          "overview": "The queen of department stores...",
          "stream_url": "https://example.com/stream/qot",
          "download_url": "https://example.com/download/qot",
          "credits": {
            "cast": [
              {
                "id": "124353",
                "name": "Kim Soo-hyun",
                "character": "Baek Hyun-woo",
                "profile_path": "https://image.tmdb.org/..."
              }
            ]
          },
          "custom_seasons": {
            "1": {
              "1": {
                "stream_url": "https://example.com/stream/qot-s1e1",
                "download_url": "https://example.com/download/qot-s1e1"
              }
            }
          }
        }
      }, null, 2)
    },
    {
      id: "search",
      method: "GET",
      path: "/api/search",
      description: "Unified search engine. Safely proxies TMDB multi-search with advanced AI Gemini Fallback text matching to serve people, movies, and TV shows in a single listing.",
      category: "Public",
      queryParams: [
        { name: "query", type: "string", required: true, description: "Search query string (e.g. name of show or actor)." }
      ],
      defaultInputs: { query: "Queen of Tears" },
      exampleResponse: JSON.stringify({
        "success": true,
        "results": [
          {
            "id": "111837",
            "title": "Queen of Tears",
            "type": "tv",
            "poster_path": "https://image.tmdb.org/t/p/w500/...",
            "backdrop_path": "https://image.tmdb.org/t/p/w1280/...",
            "release_date": "2024-03-09",
            "overview": "The queen of department stores...",
            "vote_average": 8.5
          }
        ],
        "source": "tmdb"
      }, null, 2)
    },
    {
      id: "discover",
      method: "GET",
      path: "/api/discover",
      description: "Paginated discovery endpoint supporting multi-category filtering, perfect for populating vertical lists, horizontal scrollbars, or deep category grids.",
      category: "Public",
      queryParams: [
        { name: "type", type: "string", required: false, description: "Media type to discover ('tv' or 'movie').", defaultValue: "tv" },
        { name: "genre", type: "string", required: false, description: "TMDB numeric genre ID comma-delimited filter." },
        { name: "keyword", type: "string", required: false, description: "TMDB numeric keyword ID comma-delimited filter." },
        { name: "page", type: "number", required: false, description: "The pagination page number.", defaultValue: "1" }
      ],
      defaultInputs: { type: "tv", page: "1" },
      exampleResponse: JSON.stringify({
        "success": true,
        "page": 1,
        "total_pages": 42,
        "total_results": 834,
        "results": [
          {
            "id": "111837",
            "title": "Queen of Tears",
            "type": "tv",
            "poster_path": "https://image.tmdb.org/...",
            "vote_average": 8.5
          }
        ]
      }, null, 2)
    },
    {
      id: "login",
      method: "POST",
      path: "/api/login",
      description: "Authenticates administrative credentials for secure panel dashboard actions and returns a secure token validation state.",
      category: "Public",
      bodyParams: [
        { name: "password", type: "string", required: true, description: "Secret admin access password." }
      ],
      defaultInputs: { password: "" },
      exampleResponse: JSON.stringify({
        "success": true,
        "message": "Authentication successful."
      }, null, 2)
    },
    {
      id: "admin-drama-links",
      method: "POST",
      path: "/api/admin/drama-links",
      description: "Secure administrative endpoint to insert, edit, or delete customized playback, offline download links, titles, or episodic seasons mapping structures. Auto-commits changes to GitHub.",
      category: "Admin",
      headers: [
        { name: "x-admin-password", type: "string", required: true, description: "The system's active secret password credential." }
      ],
      bodyParams: [
        { name: "id", type: "string", required: true, description: "The TMDB numeric ID for the movie or TV show overrides." },
        { name: "stream_url", type: "string", required: false, description: "The global streaming playback URL (usually for movies)." },
        { name: "download_url", type: "string", required: false, description: "The global offline download/export URL." },
        { name: "title", type: "string", required: false, description: "The display override title." },
        { name: "media_type", type: "string", required: false, description: "Media categorization override ('tv' | 'movie')." },
        { name: "seasons", type: "object", required: false, description: "Episode-by-episode nested season configuration map." },
        { name: "action", type: "string", required: false, description: "Specify 'delete' to clear all custom links for this ID." }
      ],
      defaultInputs: { id: "111837" },
      exampleResponse: JSON.stringify({
        "success": true,
        "message": "Successfully updated and synced custom media links with GitHub!",
        "isLocalOnly": false,
        "links": {}
      }, null, 2)
    },
    {
      id: "admin-home-layout",
      method: "POST",
      path: "/api/admin/home-layout",
      description: "Overwrites the structural homepage layouts grid rails array (categories, order, and configurations) and commits the file back to the repository.",
      category: "Admin",
      headers: [
        { name: "x-admin-password", type: "string", required: true, description: "Secure system admin password credential." }
      ],
      bodyParams: [
        { name: "layout", type: "array", required: true, description: "Unified JSON layout arrays with section descriptors." }
      ],
      exampleResponse: JSON.stringify({
        "success": true,
        "message": "Successfully saved Home Layout configuration!",
        "layout": []
      }, null, 2)
    }
  ];

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpointId(id);
    setTimeout(() => setCopiedEndpointId(null), 2000);
  };

  const handleInputChange = (endpointId: string, paramName: string, value: string) => {
    setTryItOutInputs(prev => ({
      ...prev,
      [endpointId]: {
        ...(prev[endpointId] || {}),
        [paramName]: value
      }
    }));
  };

  const handleTryItOut = async (endpoint: Endpoint) => {
    const id = endpoint.id;
    setTryItOutLoading(prev => ({ ...prev, [id]: true }));
    setTryItOutResponse(prev => ({ ...prev, [id]: "Executing request..." }));

    try {
      let finalUrl = endpoint.path;
      const inputs = {
        ...(endpoint.defaultInputs || {}),
        ...(tryItOutInputs[id] || {})
      };

      // Append query parameters
      if (endpoint.queryParams && endpoint.queryParams.length > 0) {
        const queryParts = endpoint.queryParams
          .map(p => {
            const val = inputs[p.name];
            if (val !== undefined && val.trim() !== "") {
              return `${p.name}=${encodeURIComponent(val)}`;
            }
            return null;
          })
          .filter(Boolean);

        if (queryParts.length > 0) {
          finalUrl += `?${queryParts.join("&")}`;
        }
      }

      const headers: Record<string, string> = {
        "Accept": "application/json"
      };

      // Add admin headers if required
      if (endpoint.category === "Admin" || endpoint.headers?.some(h => h.name === "x-admin-password")) {
        const pass = inputs["x-admin-password"] || adminPassword;
        if (pass) {
          headers["x-admin-password"] = pass;
        }
      }

      let fetchOptions: RequestInit = {
        method: endpoint.method,
        headers
      };

      // Build JSON body for POST
      if (endpoint.method === "POST" && endpoint.bodyParams) {
        headers["Content-Type"] = "application/json";
        const bodyObj: Record<string, any> = {};
        
        endpoint.bodyParams.forEach(p => {
          const val = inputs[p.name];
          if (val !== undefined && val.trim() !== "") {
            try {
              // Try to parse array/object/number automatically, fallback to string
              if ((val.startsWith("{") && val.endsWith("}")) || (val.startsWith("[") && val.endsWith("]"))) {
                bodyObj[p.name] = JSON.parse(val);
              } else if (!isNaN(Number(val)) && val.trim() !== "") {
                bodyObj[p.name] = Number(val);
              } else if (val === "true" || val === "false") {
                bodyObj[p.name] = val === "true";
              } else {
                bodyObj[p.name] = val;
              }
            } catch (_) {
              bodyObj[p.name] = val;
            }
          }
        });

        // Hard overrides for special endpoints
        if (id === "login" && !bodyObj.password) {
          bodyObj.password = inputs["password"] || adminPassword;
        }

        fetchOptions.body = JSON.stringify(bodyObj);
      }

      const res = await fetch(finalUrl, fetchOptions);
      const data = await res.json();
      
      setTryItOutResponse(prev => ({
        ...prev,
        [id]: JSON.stringify(data, null, 2)
      }));
    } catch (err: any) {
      setTryItOutResponse(prev => ({
        ...prev,
        [id]: `Error executing request:\n${err?.message || "Check connection status and server log panels."}`
      }));
    } finally {
      setTryItOutLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const filteredEndpoints = endpoints.filter(ep => {
    const matchesSearch = ep.path.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ep.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || 
                          ep.category.toLowerCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getKotlinTemplate = (endpoint: Endpoint) => {
    const isPost = endpoint.method === "POST";
    const functionName = endpoint.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const queryParamsSignature = endpoint.queryParams?.map(p => `${p.name}: String${p.required ? "" : "?"}`).join(", ") || "";
    
    return `// Retrofit Interface for Android Integration
interface HanZoneApiService {
    @${endpoint.method}("${endpoint.path}")
    suspend fun ${functionName}(
        ${endpoint.headers?.map(h => `@Header("${h.name}") ${h.name.replace(/-([a-z])/g, g => g[1].toUpperCase())}: String`).join(",\n        ") || ""}
        ${endpoint.queryParams?.map(p => `@Query("${p.name}") ${p.name}: String${p.required ? "" : "? = null"}`).join(",\n        ") || ""}
        ${isPost ? "@Body payload: Map<String, Any>" : ""}
    ): Response<${endpoint.id.includes("get-genres") ? "List<Genre>" : "UnifiedApiResponse"}>
}

// Client usage snippet
val apiService = retrofit.create(HanZoneApiService::class.java)
lifecycleScope.launch {
    try {
        val response = apiService.${functionName}(...)
        if (response.isSuccessful) {
            val data = response.body()
            // Update Android discovery screen layout dynamically
        }
    } catch (e: Exception) {
        Log.e("HanZone", "Network transaction failed: \${e.message}")
    }
}`;
  };

  const getCurlSnippet = (endpoint: Endpoint) => {
    let inputs = { ...(endpoint.defaultInputs || {}), ...(tryItOutInputs[endpoint.id] || {}) };
    let queryStr = "";
    if (endpoint.queryParams && endpoint.queryParams.length > 0) {
      const parts = endpoint.queryParams
        .map(p => inputs[p.name] ? `${p.name}=${encodeURIComponent(inputs[p.name])}` : null)
        .filter(Boolean);
      if (parts.length > 0) queryStr = `?${parts.join("&")}`;
    }

    let headersStr = "";
    if (endpoint.category === "Admin") {
      const pass = inputs["x-admin-password"] || adminPassword || "<YOUR_ADMIN_PASSWORD>";
      headersStr = ` -H "x-admin-password: ${pass}"`;
    }

    if (endpoint.method === "POST") {
      let bodyData = "{}";
      if (endpoint.bodyParams) {
        const bodyObj: Record<string, any> = {};
        endpoint.bodyParams.forEach(p => {
          bodyObj[p.name] = inputs[p.name] || (p.defaultValue || "");
        });
        if (endpoint.id === "login") {
          bodyObj.password = inputs["password"] || adminPassword || "<YOUR_ADMIN_PASSWORD>";
        }
        bodyData = JSON.stringify(bodyObj);
      }
      return `curl -X POST "${window.location.origin}${endpoint.path}${queryStr}"\\
  -H "Content-Type: application/json"\\
  ${headersStr}\\
  -d '${bodyData}'`;
    }

    return `curl -s "${window.location.origin}${endpoint.path}${queryStr}"${headersStr}`;
  };

  return (
    <div id="api-documentation-workspace" className={`rounded-2xl border transition-all duration-300 flex flex-col gap-5 p-6 ${
      isDark ? "bg-[#0c1224] border-[#1e2942]" : "bg-white border-slate-200 shadow-sm"
    }`}>
      {/* Heading section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 border-slate-700/15 gap-4">
        <div>
          <h2 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${
            isDark ? "text-slate-200" : "text-slate-800"
          }`}>
            <Code className="w-4 h-4 text-indigo-500 animate-pulse" />
            Backend API Reference & Interactive Playground
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">
            Browse endpoints, construct cURL statements, read Android integration code, and execute active system calls live in the browser.
          </p>
        </div>

        {/* Tab Selection Switch */}
        <div className={`p-1 rounded-xl flex items-center shrink-0 border ${
          isDark ? "bg-[#060a15] border-[#18233c]" : "bg-slate-100 border-slate-200/60"
        }`}>
          <button
            onClick={() => setActiveSubTab("reference")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "reference"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Reference & Console
          </button>
          <button
            onClick={() => setActiveSubTab("integration")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "integration"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Android Client Snippets
          </button>
        </div>
      </div>

      {activeSubTab === "reference" ? (
        <>
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
              <input
                type="text"
                placeholder="Search endpoints (e.g. /api/get-genres)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-9 pl-9 pr-4 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  isDark 
                    ? "bg-[#11192e] border-[#1e2942] text-white placeholder-slate-500 border" 
                    : "bg-slate-100 border-transparent text-slate-800 placeholder-slate-400 border"
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            <div className={`p-1 rounded-xl flex items-center border self-start ${
              isDark ? "bg-[#060a15] border-[#18233c]" : "bg-slate-100 border-slate-200/60"
            }`}>
              {(["all", "public", "admin"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    selectedFilter === filter
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Endpoints List */}
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-1">
            {filteredEndpoints.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                No API endpoints match your search criteria.
              </div>
            ) : (
              filteredEndpoints.map((endpoint) => {
                const isExpanded = expandedId === endpoint.id;
                const methodColor = endpoint.method === "GET" 
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                  : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";

                const categoryColor = endpoint.category === "Admin"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20";

                const responseText = tryItOutResponse[endpoint.id];
                const isLoading = tryItOutLoading[endpoint.id];
                const inputs = { ...(endpoint.defaultInputs || {}), ...(tryItOutInputs[endpoint.id] || {}) };

                return (
                  <div 
                    key={endpoint.id}
                    className={`border rounded-xl transition-all duration-300 overflow-hidden ${
                      isExpanded 
                        ? isDark ? "bg-[#0f172a]/60 border-[#1e2d4d]" : "bg-indigo-50/20 border-indigo-100"
                        : isDark ? "bg-[#0a0f1d] border-[#162137] hover:border-[#1e2d4d]" : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* Header bar */}
                    <div 
                      onClick={() => handleToggleExpand(endpoint.id)}
                      className="p-4 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 min-w-0">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0 text-center ${methodColor}`}>
                          {endpoint.method}
                        </span>
                        <code className={`font-mono text-xs font-bold truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                          {endpoint.path}
                        </code>
                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border shrink-0 max-w-max ${categoryColor}`}>
                          {endpoint.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {/* Collapsible content */}
                    {isExpanded && (
                      <div className={`p-4 border-t flex flex-col gap-4 ${
                        isDark ? "border-[#1e2d4d]" : "border-slate-200"
                      }`}>
                        {/* Description */}
                        <div>
                          <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                            {endpoint.description}
                          </p>
                        </div>

                        {/* Endpoint Auth Notice if Admin */}
                        {endpoint.category === "Admin" && (
                          <div className={`p-3 rounded-xl border flex items-center gap-2 text-[10px] ${
                            isDark ? "bg-rose-950/20 border-rose-900/30 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-800"
                          }`}>
                            <Shield className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>This endpoint is secure and requires passing the <code className="font-mono bg-rose-500/10 px-1 rounded">x-admin-password</code> in headers.</span>
                          </div>
                        )}

                        {/* Parameters Tab */}
                        {((endpoint.queryParams && endpoint.queryParams.length > 0) || 
                          (endpoint.bodyParams && endpoint.bodyParams.length > 0) || 
                          endpoint.category === "Admin") && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Request Parameters</span>
                            <div className="border rounded-xl overflow-hidden divide-y divide-slate-700/15">
                              {/* Headers input if admin and missing state */}
                              {endpoint.category === "Admin" && (
                                <div className={`p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  isDark ? "bg-[#0c1224]/30" : "bg-white"
                                }`}>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <code className="font-mono font-bold text-rose-400">x-admin-password</code>
                                      <span className="text-[9px] text-rose-500 font-extrabold uppercase">Required</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Admin credential secret key header.</p>
                                  </div>
                                  <div className="shrink-0 w-full sm:w-48">
                                    <input
                                      type="password"
                                      placeholder="Admin Password Override"
                                      value={inputs["x-admin-password"] !== undefined ? inputs["x-admin-password"] : adminPassword}
                                      onChange={(e) => handleInputChange(endpoint.id, "x-admin-password", e.target.value)}
                                      className={`w-full h-8 px-2.5 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 border ${
                                        isDark 
                                          ? "bg-[#060a15] border-[#1a263f] text-slate-300" 
                                          : "bg-slate-50 border-slate-200 text-slate-700"
                                      }`}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Query params list */}
                              {endpoint.queryParams?.map((param) => (
                                <div key={param.name} className={`p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  isDark ? "bg-[#0c1224]/30" : "bg-white"
                                }`}>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <code className={`font-mono font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{param.name}</code>
                                      <span className="text-[10px] text-slate-500">({param.type})</span>
                                      {param.required ? (
                                        <span className="text-[9px] text-rose-500 font-extrabold uppercase">Required</span>
                                      ) : (
                                        <span className="text-[9px] text-slate-500 font-bold uppercase">Optional</span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{param.description}</p>
                                  </div>
                                  <div className="shrink-0 w-full sm:w-48">
                                    <input
                                      type="text"
                                      placeholder={param.defaultValue ? `Default: ${param.defaultValue}` : "Enter value..."}
                                      value={inputs[param.name] || ""}
                                      onChange={(e) => handleInputChange(endpoint.id, param.name, e.target.value)}
                                      className={`w-full h-8 px-2.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 border ${
                                        isDark 
                                          ? "bg-[#060a15] border-[#1a263f] text-slate-300" 
                                          : "bg-slate-50 border-slate-200 text-slate-700"
                                      }`}
                                    />
                                  </div>
                                </div>
                              ))}

                              {/* Body params list */}
                              {endpoint.bodyParams?.map((param) => (
                                <div key={param.name} className={`p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  isDark ? "bg-[#0c1224]/30" : "bg-white"
                                }`}>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <code className={`font-mono font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>{param.name}</code>
                                      <span className="text-[10px] text-slate-500">({param.type})</span>
                                      {param.required ? (
                                        <span className="text-[9px] text-rose-500 font-extrabold uppercase">Required</span>
                                      ) : (
                                        <span className="text-[9px] text-slate-500 font-bold uppercase">Optional</span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{param.description}</p>
                                  </div>
                                  <div className="shrink-0 w-full sm:w-48">
                                    <input
                                      type="text"
                                      placeholder={param.defaultValue ? `Default: ${param.defaultValue}` : "Enter payload block..."}
                                      value={inputs[param.name] || ""}
                                      onChange={(e) => handleInputChange(endpoint.id, param.name, e.target.value)}
                                      className={`w-full h-8 px-2.5 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 border ${
                                        isDark 
                                          ? "bg-[#060a15] border-[#1a263f] text-slate-300" 
                                          : "bg-slate-50 border-slate-200 text-slate-700"
                                      }`}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interactive cURL Generator Block */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Terminal cURL Syntax</span>
                          <div className={`p-3.5 rounded-xl border font-mono text-[11px] flex items-center justify-between relative group ${
                            isDark ? "bg-[#03060f] border-[#131d33] text-slate-300" : "bg-slate-900 border-slate-950 text-slate-300"
                          }`}>
                            <span className="truncate mr-4 select-all">{getCurlSnippet(endpoint)}</span>
                            <button
                              onClick={() => copyToClipboard(getCurlSnippet(endpoint), `curl-${endpoint.id}`)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0"
                              title="Copy cURL command"
                            >
                              {copiedEndpointId === `curl-${endpoint.id}` ? (
                                <span className="text-[9px] font-sans font-bold text-emerald-400">Copied!</span>
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Twin Response Grid: Interactive Output vs Example Reference */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          
                          {/* Live Interactive Console Console */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Terminal className="w-3 h-3 text-indigo-400" />
                                Interactive Client Console
                              </span>
                              <button
                                onClick={() => handleTryItOut(endpoint)}
                                disabled={isLoading}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow transition-all active:scale-[0.98]"
                              >
                                {isLoading ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Querying...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3 text-white fill-white" />
                                    Send Request
                                  </>
                                )}
                              </button>
                            </div>

                            <div className={`rounded-xl border p-4 font-mono text-[10px] h-52 overflow-auto relative ${
                              isDark ? "bg-[#040813] border-[#121c32] text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}>
                              {responseText ? (
                                <pre className="whitespace-pre-wrap select-all">{responseText}</pre>
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-center p-4">
                                  <Play className="w-6 h-6 text-indigo-500/20 mb-1.5" />
                                  <p className="font-bold uppercase tracking-wider text-[9px]">Console Ready</p>
                                  <p className="text-[9px] mt-0.5">Click 'Send Request' to trigger a live call to our API.</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Static Example Payload */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Example JSON Response Structure
                              </span>
                              <button
                                onClick={() => copyToClipboard(endpoint.exampleResponse, `json-${endpoint.id}`)}
                                className={`text-[10px] font-bold flex items-center gap-1 ${
                                  isDark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-500"
                                }`}
                              >
                                {copiedEndpointId === `json-${endpoint.id}` ? (
                                  <span className="text-emerald-500">Copied!</span>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    Copy Payload
                                  </>
                                )}
                              </button>
                            </div>

                            <div className={`rounded-xl border p-4 font-mono text-[10px] h-52 overflow-auto relative ${
                              isDark ? "bg-[#040813]/40 border-[#121c32]/60 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                            }`}>
                              <pre className="whitespace-pre">{endpoint.exampleResponse}</pre>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Dynamic Android / Kotlin Integration Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
              isDark ? "bg-[#0a0f1d] border-[#18233c]" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-2 text-indigo-500">
                <Shield className="w-4.5 h-4.5" />
                <h4 className="text-xs font-black uppercase tracking-wider">Android App Integration</h4>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Your client developers can easily interact with HanZone Server APIs. All feeds are fully compliant with standard Kotlin Retrofit interfaces or OkHttp clients.
              </p>
              <div className="text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Zero browser/CORS locks</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Real-time cache busting</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> JSON-standard layouts</div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
              isDark ? "bg-[#0a0f1d] border-[#18233c] text-indigo-300" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Available Feed Assets</span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-mono p-1 rounded hover:bg-indigo-500/5"><span className="text-slate-500">Genres Feed:</span> <strong>/api/get-genres</strong></div>
                <div className="flex justify-between font-mono p-1 rounded hover:bg-indigo-500/5"><span className="text-slate-500">Hero Spotlight:</span> <strong>/api/get-hero-config</strong></div>
                <div className="flex justify-between font-mono p-1 rounded hover:bg-indigo-500/5"><span className="text-slate-500">App Rails Layout:</span> <strong>/api/get-home-layout</strong></div>
                <div className="flex justify-between font-mono p-1 rounded hover:bg-indigo-500/5"><span className="text-slate-500">Unified Overrides:</span> <strong>/api/get-drama-links</strong></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Kotlin / Retrofit Integration Reference Code</span>
              <button
                onClick={() => copyToClipboard(getKotlinTemplate(endpoints[0]), "kotlin-template")}
                className={`text-[10px] font-bold flex items-center gap-1 ${
                  isDark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-500"
                }`}
              >
                {copiedEndpointId === "kotlin-template" ? (
                  <span className="text-emerald-500">Copied Integration Code!</span>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy Integration Code
                  </>
                )}
              </button>
            </div>

            <div className={`rounded-xl border p-4 font-mono text-[11px] h-96 overflow-auto relative text-slate-300 ${
              isDark ? "bg-[#03060f] border-[#131d33]" : "bg-slate-900 border-slate-950"
            }`}>
              <pre className="whitespace-pre">{getKotlinTemplate(endpoints[0])}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
