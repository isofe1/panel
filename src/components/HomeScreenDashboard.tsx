import React, { useState, useEffect } from "react";
import { 
  Layers, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Smartphone, 
  Sliders, 
  Tv, 
  Film, 
  Users, 
  Eye, 
  Pencil, 
  Trash2, 
  Sparkles, 
  ChevronRight, 
  Save, 
  GripVertical, 
  Play, 
  Code,
  TrendingUp,
  Plus,
  X,
  EyeOff
} from "lucide-react";

interface LayoutDataSource {
  media_type?: string;
  countries?: string[];
  sort_by?: string;
}

interface LayoutSection {
  section_id: string;
  layout_type: string;
  title: string;
  visible?: boolean;
  data_source?: LayoutDataSource;
}

interface HomeScreenDashboardProps {
  isDark: boolean;
  homeLayout: LayoutSection[];
  setHomeLayout: React.Dispatch<React.SetStateAction<LayoutSection[]>>;
  layoutLoading: boolean;
  layoutSaving: boolean;
  layoutMessage: { text: string; type: "success" | "error" } | null;
  setLayoutMessage: React.Dispatch<React.SetStateAction<{ text: string; type: "success" | "error" } | null>>;
  fetchHomeLayout: () => void;
  saveLayoutConfig: (layoutToSave: LayoutSection[]) => Promise<boolean>;
  DEFAULT_HOME_LAYOUT: LayoutSection[];
  handleToggleSectionVisibility: (sectionId: string) => Promise<void>;
  handleDeleteSection: (sectionId: string) => Promise<void>;
  handleSaveSectionForm: (e: React.FormEvent) => Promise<void>;
  
  // Form input states passed from parent
  layoutEditingId: string | null;
  setLayoutEditingId: (id: string | null) => void;
  layoutSectionId: string;
  setLayoutSectionId: (id: string) => void;
  layoutTitleInput: string;
  setLayoutTitleInput: (title: string) => void;
  layoutTypeInput: string;
  setLayoutTypeInput: (type: string) => void;
  layoutVisibleInput: boolean;
  setLayoutVisibleInput: (v: boolean) => void;
  layoutMediaTypeInput: string;
  setLayoutMediaTypeInput: (v: string) => void;
  layoutCountriesInput: string;
  setLayoutCountriesInput: (v: string) => void;
  layoutSortByInput: string;
  setLayoutSortByInput: (v: string) => void;
}

export const HomeScreenDashboard: React.FC<HomeScreenDashboardProps> = ({
  isDark,
  homeLayout,
  layoutLoading,
  layoutSaving,
  layoutMessage,
  setLayoutMessage,
  fetchHomeLayout,
  saveLayoutConfig,
  DEFAULT_HOME_LAYOUT,
  layoutEditingId,
  setLayoutEditingId,
  layoutSectionId,
  setLayoutSectionId,
  layoutTitleInput,
  setLayoutTitleInput,
  layoutTypeInput,
  setLayoutTypeInput,
  layoutVisibleInput,
  setLayoutVisibleInput,
  layoutMediaTypeInput,
  setLayoutMediaTypeInput,
  layoutCountriesInput,
  setLayoutCountriesInput,
  layoutSortByInput,
  setLayoutSortByInput,
}) => {
  // Local Draft Layout state
  const [draftLayout, setDraftLayout] = useState<LayoutSection[]>([]);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Custom Confirmation and Alert states to bypass iframe-blocked window.confirm/alert
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    isDanger?: boolean;
  } | null>(null);

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  } | null>(null);

  // Drag and Drop states for visual reordering inside non-HERO list
  const [layoutDraggedIndex, setLayoutDraggedIndex] = useState<number | null>(null);
  const [layoutDragOverIndex, setLayoutDragOverIndex] = useState<number | null>(null);

  // Synchronize draft state with homeLayout when loaded from server
  useEffect(() => {
    setDraftLayout(homeLayout);
    setIsBannerDismissed(false);
  }, [homeLayout]);

  // Determine if draft has unsaved changes compared to actual server state
  const hasChanges = JSON.stringify(draftLayout) !== JSON.stringify(homeLayout);

  // Filtered layouts (HERO section is completely filtered out from listing and editing as requested)
  const nonHeroSections = draftLayout.filter(s => s.layout_type !== "HERO");
  const heroSections = draftLayout.filter(s => s.layout_type === "HERO");

  // Helper to update draft layout with modified non-HERO rails
  const updateNonHeroLayout = (newNonHero: LayoutSection[]) => {
    // Keep HERO spotlight rows always at the very top untouched
    setDraftLayout([...heroSections, ...newNonHero]);
  };

  // Drag and Drop handlers
  const handleLayoutDragStart = (e: React.DragEvent, index: number) => {
    setLayoutDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleLayoutDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (layoutDraggedIndex !== index) {
      setLayoutDragOverIndex(index);
    }
  };

  const handleLayoutDragLeave = () => {
    setLayoutDragOverIndex(null);
  };

  const handleLayoutDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (layoutDraggedIndex !== null && layoutDraggedIndex !== targetIndex) {
      const updatedNonHero = [...nonHeroSections];
      const [removed] = updatedNonHero.splice(layoutDraggedIndex, 1);
      updatedNonHero.splice(targetIndex, 0, removed);
      updateNonHeroLayout(updatedNonHero);
    }
    setLayoutDraggedIndex(null);
    setLayoutDragOverIndex(null);
  };

  const handleLayoutDragEnd = () => {
    setLayoutDraggedIndex(null);
    setLayoutDragOverIndex(null);
  };

  // Local state operations (Does NOT auto-save to server)
  const handleToggleSectionVisibilityLocal = (sectionId: string) => {
    const updated = draftLayout.map((sec) => {
      if (sec.section_id === sectionId) {
        return { ...sec, visible: sec.visible === false ? true : false };
      }
      return sec;
    });
    setDraftLayout(updated);
  };

  const handleDeleteSectionLocal = (sectionId: string) => {
    const sectionName = draftLayout.find(s => s.section_id === sectionId)?.title || "this rail";
    setConfirmState({
      isOpen: true,
      title: "Delete Rail Row",
      message: `Are you sure you want to delete "${sectionName}"? This action will apply to your local draft.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      isDanger: true,
      onConfirm: () => {
        const updated = draftLayout.filter((sec) => sec.section_id !== sectionId);
        setDraftLayout(updated);
      }
    });
  };

  const handleToggleAllVisibilityLocal = () => {
    if (nonHeroSections.length === 0) return;
    const anyVisible = nonHeroSections.some((sec) => sec.visible !== false);
    const updatedNonHero = nonHeroSections.map((sec) => ({ ...sec, visible: !anyVisible }));
    updateNonHeroLayout(updatedNonHero);
  };

  const handleResetToDefaultSequenceLocal = () => {
    setConfirmState({
      isOpen: true,
      title: "Reset Sequence",
      message: "Are you sure you want to reset your local draft sequence to default template sequence?",
      confirmText: "Reset",
      cancelText: "Cancel",
      onConfirm: () => {
        setDraftLayout(DEFAULT_HOME_LAYOUT);
        setIsBannerDismissed(false);
      }
    });
  };

  const handleDeleteAllCustomSectionsLocal = () => {
    setConfirmState({
      isOpen: true,
      title: "Clear All Rails",
      message: "⚠️ WARNING: Are you sure you want to clear ALL custom rails? Your custom layout sequence will be completely empty!",
      confirmText: "Clear All",
      cancelText: "Cancel",
      isDanger: true,
      onConfirm: () => {
        setDraftLayout(heroSections); // keep only HERO
      }
    });
  };

  // Save changes locally from Modal Form
  const handleSaveModalForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!layoutSectionId.trim()) {
      setAlertState({
        isOpen: true,
        title: "Validation Error",
        message: "Section ID is required and must be unique."
      });
      return;
    }

    // Check uniqueness if adding new section
    if (!layoutEditingId && draftLayout.some((sec) => sec.section_id.toLowerCase() === layoutSectionId.trim().toLowerCase())) {
      setAlertState({
        isOpen: true,
        title: "Validation Error",
        message: "Section ID must be unique. A section with this ID already exists."
      });
      return;
    }

    const cleanedSectionId = layoutSectionId.trim();
    const cleanedTitle = layoutTitleInput.trim() || "New Section";

    const newSection: LayoutSection = {
      section_id: cleanedSectionId,
      layout_type: layoutTypeInput,
      title: cleanedTitle,
      visible: layoutVisibleInput
    };

    if (layoutTypeInput === "DRAMA_RAIL") {
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

    let updatedLayout: LayoutSection[] = [];
    if (layoutEditingId) {
      // Overwrite existing section
      updatedLayout = draftLayout.map((sec) => {
        if (sec.section_id === layoutEditingId) {
          return newSection;
        }
        return sec;
      });
    } else {
      // Append new section to layout
      updatedLayout = [...draftLayout, newSection];
    }

    setDraftLayout(updatedLayout);
    setIsModalOpen(false);
    setLayoutEditingId(null);
  };

  // Trigger modal for adding a new row
  const handleOpenAddModal = () => {
    setLayoutSectionId("");
    setLayoutTitleInput("");
    setLayoutTypeInput("DRAMA_RAIL");
    setLayoutVisibleInput(true);
    setLayoutMediaTypeInput("all");
    setLayoutCountriesInput("KR, JP");
    setLayoutSortByInput("popularity");
    setLayoutEditingId(null);
    setIsModalOpen(true);
  };

  // Trigger modal for editing an existing row
  const handleOpenEditModal = (section: LayoutSection) => {
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
    setIsModalOpen(true);
  };

  // Commit draft to server
  const handleCommitChanges = async () => {
    const success = await saveLayoutConfig(draftLayout);
    if (success) {
      setIsBannerDismissed(false);
    }
  };

  // Discard draft changes
  const handleDiscardChanges = () => {
    setConfirmState({
      isOpen: true,
      title: "Discard Draft Changes",
      message: "Discard all your unsaved modifications and reload from the server?",
      confirmText: "Discard",
      cancelText: "Cancel",
      isDanger: true,
      onConfirm: () => {
        setDraftLayout(homeLayout);
        setIsBannerDismissed(false);
        setLayoutMessage(null);
      }
    });
  };

  return (
    <div className={`rounded-2xl p-6 border relative transition-all duration-300 ${
      isDark ? "bg-[#0c1224] border-[#1e2942]/60 shadow-xl shadow-black/10" : "bg-white border-slate-200 shadow-md"
    }`}>
      {/* Header section with status badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 border-b border-slate-700/10 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className={`text-xl font-black ${isDark ? "text-slate-100" : "text-slate-800"}`}>
              Home Screen Layout Engine
            </h2>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Live Engine
            </span>
            {hasChanges && (
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3" /> Unsaved Draft
              </span>
            )}
          </div>
          <p className={`text-xs mt-1 transition-colors duration-300 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Configure your client App home layout. Spotlight spotlight is fixed and managed separately. Drag cards to sequence.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Commit button in toolbar as alternative when banner is dismissed */}
          {hasChanges && (
            <div className="flex items-center gap-1.5 animate-fade-in">
              <button
                type="button"
                onClick={handleCommitChanges}
                disabled={layoutSaving}
                className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                onClick={handleDiscardChanges}
                className={`h-9 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  isDark ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Discard
              </button>
            </div>
          )}

          {/* Manual Sync */}
          <button
            type="button"
            onClick={fetchHomeLayout}
            disabled={layoutLoading}
            className={`h-9 px-3.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all duration-300 active:scale-[0.98] cursor-pointer ${
              isDark 
                ? "bg-[#11192e] border-[#1e2942] hover:bg-[#1c294a] text-slate-200 disabled:opacity-50" 
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm disabled:opacity-50"
            }`}
            title="Force refresh Home layout configuration from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${layoutLoading ? "animate-spin text-indigo-500" : ""}`} />
            <span>Pull Server</span>
          </button>
        </div>
      </div>

      {layoutMessage && (
        <div className={`mb-6 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
          layoutMessage.type === "success" 
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
        }`}>
          {layoutMessage.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{layoutMessage.text}</span>
        </div>
      )}

      {/* Main 2-column layout: Left Rails, Right Simulated Client */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-6">
        
        {/* COLUMN 1: Rails Management List (xl:col-span-8) */}
        <div className="xl:col-span-8 flex flex-col gap-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">Rails Management Sequence</span>
              <span className="text-[10px] text-slate-500">Click a card to edit it. Drag to reorder, use batch actions to manage visibility.</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full border border-indigo-500/20">
                {nonHeroSections.length} Custom Rails
              </span>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-md shadow-indigo-600/15 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rail Row</span>
              </button>
            </div>
          </div>

          {/* Batch operations toolbar */}
          <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
            isDark ? "bg-[#070b14] border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Batch Draft Actions
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleToggleAllVisibilityLocal}
                className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-1 cursor-pointer transition-all border ${
                  isDark 
                    ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
                title="Toggle visibility of all draft rails"
              >
                <Eye className="w-3 h-3 text-slate-400" />
                <span>Toggle Visibility</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefaultSequenceLocal}
                className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-1 cursor-pointer transition-all border ${
                  isDark 
                    ? "bg-indigo-950/40 border-indigo-500/20 text-indigo-400 hover:bg-indigo-950/60" 
                    : "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100"
                }`}
                title="Restore local draft layout sequence to defaults"
              >
                <RefreshCw className="w-3 h-3 text-indigo-400" />
                <span>Reset sequence</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteAllCustomSectionsLocal}
                className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-1 cursor-pointer transition-all border ${
                  isDark 
                    ? "bg-rose-950/40 border-rose-500/20 text-rose-400 hover:bg-rose-950/60" 
                    : "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100"
                }`}
                title="Delete all draft rails"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Delete All</span>
              </button>
            </div>
          </div>

          {/* Visual Section Cards List (Custom Rails only, Spotlight excluded) */}
          <div className="flex flex-col gap-2.5 max-h-[750px] overflow-y-auto pr-1">
            {layoutLoading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 border border-dashed border-slate-800 rounded-2xl">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-xs text-slate-500">Loading layout sequence...</span>
              </div>
            ) : nonHeroSections.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 border border-dashed border-slate-700/20 rounded-2xl text-center">
                <Layers className="w-8 h-8 text-slate-500 opacity-60" />
                <span className="text-xs font-black text-slate-400">No custom layout rails found in this draft.</span>
                <button
                  type="button"
                  onClick={() => setDraftLayout(DEFAULT_HOME_LAYOUT)}
                  className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs shadow cursor-pointer"
                >
                  Load Default Sequence
                </button>
              </div>
            ) : (
              nonHeroSections.map((section, idx) => {
                const isTop10 = section.layout_type === "TOP_10";
                const isDramaRail = section.layout_type === "DRAMA_RAIL";
                const isActors = section.layout_type === "ACTORS";

                return (
                  <div
                    key={section.section_id}
                    draggable={true}
                    onDragStart={(e) => handleLayoutDragStart(e, idx)}
                    onDragOver={(e) => handleLayoutDragOver(e, idx)}
                    onDragLeave={handleLayoutDragLeave}
                    onDrop={(e) => handleLayoutDrop(e, idx)}
                    onDragEnd={handleLayoutDragEnd}
                    onClick={() => handleOpenEditModal(section)}
                    className={`p-4 rounded-2xl border transition-all duration-200 relative group flex items-center justify-between select-none cursor-pointer hover:scale-[1.005] ${
                      layoutDraggedIndex === idx
                        ? "opacity-30 border-dashed border-indigo-500 bg-indigo-500/5 scale-95"
                        : layoutDragOverIndex === idx
                          ? "border-2 border-indigo-500 bg-indigo-500/10 ring-4 ring-indigo-500/10"
                          : !section.visible
                            ? isDark ? "bg-[#0b0f19]/30 border-slate-800/40 opacity-65" : "bg-slate-100/40 border-slate-200/45 opacity-65"
                            : isDark ? "bg-[#070b14] border-[#1e2942]/70 hover:border-indigo-500/40 hover:bg-[#0d1326]" : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50"
                    }`}
                  >
                    {/* Drag Handle & Info */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div 
                        className="cursor-grab active:cursor-grabbing p-2 hover:bg-slate-500/15 rounded-xl text-slate-500 transition-colors shrink-0" 
                        title="Drag to reorder sequence"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="w-4 h-4 shrink-0" />
                      </div>

                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black font-mono shrink-0 ${
                        isDark ? "bg-slate-800/60 text-slate-300" : "bg-slate-100 text-slate-600"
                      }`}>
                        #{idx + 1}
                      </div>

                      <div className="flex flex-col text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-black truncate ${
                            isDark ? "text-slate-200" : "text-slate-800"
                          }`}>
                            {section.title || "Untitled Rail Row"}
                          </h4>
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                            isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                          }`}>
                            ID: {section.section_id}
                          </span>
                        </div>
                        
                        {/* Summary specifications */}
                        <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                          {isTop10 && "🔥 Ranked layout showing top 10 movies/tv sequence"}
                          {isActors && "👥 Horizontal round avatars row displaying popular actors"}
                          {isDramaRail && `📺 Carousel showing ${section.data_source?.media_type === "movie" ? "movies" : section.data_source?.media_type === "tv" ? "tv shows" : "all content"} from ${section.data_source?.countries?.join(", ") || "KR"} sorted by ${section.data_source?.sort_by || "popularity"}`}
                        </p>
                      </div>
                    </div>

                    {/* Action controls & Labels */}
                    <div className="flex items-center gap-3.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {isTop10 && (
                          <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/10 flex items-center gap-1 shrink-0">
                            <TrendingUp className="w-2.5 h-2.5" /> Ranked
                          </span>
                        )}
                        {isDramaRail && (
                          <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 flex items-center gap-1 shrink-0">
                            <Film className="w-2.5 h-2.5" /> Carousel
                          </span>
                        )}
                        {isActors && (
                          <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase bg-teal-500/10 text-teal-400 border border-teal-500/10 flex items-center gap-1 shrink-0">
                            <Users className="w-2.5 h-2.5" /> Cast
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 border-l border-slate-700/10 pl-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleSectionVisibilityLocal(section.section_id)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                            section.visible !== false
                              ? isDark 
                                ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-800" 
                                : "bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                              : "bg-rose-500/15 border-rose-500/20 text-rose-400 hover:bg-rose-500/25"
                          }`}
                          title={section.visible !== false ? "Hide on Client" : "Show on Client"}
                        >
                          {section.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(section)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                            isDark 
                              ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-800" 
                              : "bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                          }`}
                          title="Edit properties"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSectionLocal(section.section_id)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                            isDark 
                              ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-500 hover:bg-slate-800" 
                              : "bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-slate-50"
                          }`}
                          title="Delete rail row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: Live Simulated Mobile Preview (xl:col-span-4) */}
        <div className="xl:col-span-4 flex flex-col gap-4 text-left">
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">Live Client Simulator</span>
            <span className="text-[10px] text-slate-500">Live preview of current draft (Spotlight row is fixed at the top).</span>
          </div>

          {/* Phone container */}
          <div className={`rounded-3xl border shadow-2xl relative overflow-hidden flex flex-col transition-all duration-300 ${
            isDark ? "bg-[#05070c] border-slate-850" : "bg-white border-slate-200"
          }`} style={{ minHeight: "720px" }}>
            
            {/* Status bar mock */}
            <div className={`px-4 py-2 text-[8px] font-bold flex items-center justify-between font-mono select-none border-b ${
              isDark ? "bg-[#090d16] border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
            }`}>
              <span>12:00 PM</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>5G</span>
                <span>98%</span>
              </div>
            </div>

            {/* Simulated Feed Viewport */}
            <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-5 max-h-[610px] select-none">
              
              {/* Permanent HERO Spotlight Banner at the very top */}
              <div className="relative h-28 rounded-2xl overflow-hidden bg-slate-950 border border-slate-900 flex flex-col justify-end p-3 shadow-md">
                <div className="absolute inset-0 bg-cover bg-center opacity-45" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=300')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="relative z-10 text-left">
                  <span className="text-[6px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono">
                    Featured Spotlight
                  </span>
                  <h4 className="text-[11px] font-black text-white leading-tight truncate mt-1">
                    Main Banner Spotlight Row
                  </h4>
                  <div className="flex gap-1 mt-1.5">
                    <span className="px-1.5 py-0.5 bg-white text-black text-[6px] font-black rounded flex items-center gap-0.5">
                      <Play className="w-1 h-1 fill-black" /> Watch Spotlight
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic scrollable rails */}
              {nonHeroSections.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-center p-6 text-slate-500 gap-2 border border-dashed border-slate-800 rounded-2xl">
                  <Smartphone className="w-5 h-5 animate-pulse" />
                  <span className="text-[9px] font-bold">No Custom Rows Active</span>
                  <span className="text-[7px] opacity-70">Add custom rails to preview inside client.</span>
                </div>
              ) : (
                nonHeroSections.map((section, idx) => {
                  return (
                    <div
                      key={section.section_id}
                      draggable={true}
                      onDragStart={(e) => handleLayoutDragStart(e, idx)}
                      onDragOver={(e) => handleLayoutDragOver(e, idx)}
                      onDragLeave={handleLayoutDragLeave}
                      onDrop={(e) => handleLayoutDrop(e, idx)}
                      onDragEnd={handleLayoutDragEnd}
                      onClick={() => handleOpenEditModal(section)}
                      className={`relative rounded-2xl p-2 transition-all duration-300 group/item cursor-grab active:cursor-grabbing my-3 ${
                        layoutDraggedIndex === idx
                          ? "opacity-30 border border-dashed border-indigo-500 bg-indigo-500/5 scale-95"
                          : layoutDragOverIndex === idx
                            ? "border border-dashed border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                            : !section.visible
                              ? "opacity-35 border border-dashed border-rose-500/10 bg-transparent"
                              : "bg-transparent border-0"
                      }`}
                    >
                      {/* Drag/Hover Overlay inside Simulator */}
                      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs rounded-2xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 z-20 px-2 text-center">
                        <div className="flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[8px] font-black text-slate-100 uppercase tracking-wider">
                            Drag rail / Click to edit
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="p-1 bg-slate-800 text-slate-300 rounded cursor-grab">
                              <GripVertical className="w-3 h-3" />
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleSectionVisibilityLocal(section.section_id)}
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                !section.visible ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-indigo-600"
                              }`}
                              title="Toggle visibility"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(section)}
                              className="p-1 bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-black rounded transition-colors cursor-pointer"
                              title="Edit details"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Mock visual rails in phone simulation */}
                      {section.layout_type === "TOP_10" && (
                        <div className="flex flex-col gap-1.5 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-wide ${
                              isDark ? "text-slate-200" : "text-slate-800"
                            }`}>
                              {section.title || "Top 10 Hits"}
                            </span>
                            <span className="text-[8px] font-semibold text-indigo-500/80 cursor-pointer">
                              See All
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 mt-1">
                            {[1, 2, 3].map((rank) => (
                              <div key={rank} className="flex items-center gap-1.5">
                                <span className="text-3xl font-black italic text-indigo-500 select-none leading-none tracking-tighter shrink-0 w-5 text-center">
                                  {rank}
                                </span>
                                <div className={`flex-1 aspect-[2/3] rounded-lg border flex flex-col justify-between p-1.5 relative overflow-hidden shrink-0 ${
                                  isDark ? "bg-[#11192e] border-slate-800" : "bg-white border-slate-200"
                                }`}>
                                  <div className="w-full h-3/4 bg-indigo-500/5 rounded flex items-center justify-center">
                                    <Film className="w-3.5 h-3.5 text-slate-500/30 animate-pulse" />
                                  </div>
                                  <span className="text-[5px] font-bold text-slate-400 text-center truncate uppercase w-full block mt-0.5">Poster</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.layout_type === "DRAMA_RAIL" && (
                        <div className="flex flex-col gap-1.5 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-wide ${
                              isDark ? "text-slate-200" : "text-slate-800"
                            }`}>
                              {section.title || "Horizontal Rail"}
                            </span>
                            <span className="text-[8px] font-semibold text-indigo-500/80 cursor-pointer">
                              See All
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 mt-1">
                            {[1, 2, 3, 4].map((item) => (
                              <div key={item} className={`aspect-[2/3] rounded-lg border flex flex-col justify-between p-1.5 relative overflow-hidden ${
                                isDark ? "bg-[#11192e] border-slate-800" : "bg-white border-slate-200"
                              }`}>
                                <div className="w-full h-3/4 bg-indigo-500/5 rounded flex items-center justify-center">
                                  <Film className="w-3.5 h-3.5 text-slate-600/30" />
                                </div>
                                <span className="text-[5px] font-bold truncate text-slate-400 uppercase w-full text-center block mt-1">Drama</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.layout_type === "ACTORS" && (
                        <div className="flex flex-col gap-1.5 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-wide ${
                              isDark ? "text-slate-200" : "text-slate-800"
                            }`}>
                              {section.title || "Star Profiles"}
                            </span>
                            <span className="text-[8px] font-semibold text-indigo-500/80 cursor-pointer">
                              See All
                            </span>
                          </div>
                          <div className="flex items-center gap-3 overflow-x-auto py-1">
                            {[
                              { name: "Song Joong-ki", initial: "S" },
                              { name: "Park Shin-hye", initial: "P" },
                              { name: "Lee Min-ho", initial: "L" },
                              { name: "IU Ji-eun", initial: "I" }
                            ].map((act, idx) => (
                              <div key={idx} className="flex flex-col items-center shrink-0 w-11">
                                <div className={`w-9 h-9 rounded-full border border-red-500 flex items-center justify-center text-[10px] font-black shrink-0 ${
                                  isDark ? "bg-slate-900/80 text-slate-200" : "bg-slate-100 text-slate-700"
                                }`}>
                                  {act.initial}
                                </div>
                                <span className={`text-[6px] font-semibold mt-1 text-center truncate w-full ${
                                  isDark ? "text-slate-400" : "text-slate-500"
                                }`}>
                                  {act.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live JSON API Response Payload Preview */}
      <div className={`mt-6 p-4 rounded-2xl border flex flex-col gap-2.5 ${
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
        <pre className={`p-3 rounded-xl text-[10px] font-mono overflow-x-auto text-left leading-relaxed max-h-[160px] ${
          isDark ? "bg-[#05070e] text-indigo-300 border border-indigo-950/40" : "bg-white text-indigo-900 border border-slate-200"
        }`}>
          {JSON.stringify(draftLayout, null, 2)}
        </pre>
      </div>

      {/* ==================================== */}
      {/* 1. FLOATING EDIT/ADD MODAL DIALOG  */}
      {/* ==================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`border rounded-3xl w-full max-w-lg shadow-2xl flex flex-col p-6 text-left animate-scale-up ${
            isDark ? "bg-[#0c1224] border-[#1e2942]" : "bg-white border-slate-200"
          }`}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-700/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${layoutEditingId ? "bg-amber-500 animate-pulse" : "bg-indigo-500"}`} />
                <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                  {layoutEditingId ? "✏️ Edit Custom Layout Rail" : "➕ Add Custom Layout Rail"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setLayoutEditingId(null); }}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isDark ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModalForm} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Section ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!layoutEditingId}
                    placeholder="e.g. 8"
                    value={layoutSectionId}
                    onChange={(e) => setLayoutSectionId(e.target.value)}
                    className={`h-10 px-3.5 rounded-xl text-xs font-semibold border focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all ${
                      isDark ? "bg-[#11192e] border-slate-700/60 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                  <span className="text-[8px] text-slate-500 font-mono">Unique number, e.g. `8`</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Display Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Romantic K-Hits"
                    value={layoutTitleInput}
                    onChange={(e) => setLayoutTitleInput(e.target.value)}
                    className={`h-10 px-3.5 rounded-xl text-xs font-semibold border focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all ${
                      isDark ? "bg-[#11192e] border-slate-700/60 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                  <span className="text-[8px] text-slate-500 font-mono">Visible title label</span>
                </div>
              </div>

              {/* Layout Style Visual Cards Selector (Excludes Spotlight/HERO as requested) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Layout Style Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "TOP_10",
                      title: "Top 10 Rankings",
                      desc: "Numbered cards",
                      icon: TrendingUp,
                      bg: "bg-amber-500/10",
                      text: "text-amber-400"
                    },
                    {
                      id: "DRAMA_RAIL",
                      title: "Poster Carousel",
                      desc: "Scroll rail carousel",
                      icon: Film,
                      bg: "bg-indigo-500/10",
                      text: "text-indigo-400"
                    },
                    {
                      id: "ACTORS",
                      title: "Cast Avatars",
                      desc: "Circular actor circles",
                      icon: Users,
                      bg: "bg-teal-500/10",
                      text: "text-teal-400"
                    }
                  ].map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = layoutTypeInput === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLayoutTypeInput(opt.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all duration-200 relative flex flex-col gap-1.5 cursor-pointer hover:scale-[1.01] ${
                          isSelected
                            ? `border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20`
                            : isDark ? "bg-[#11192e] border-slate-800 hover:bg-[#16213e]" : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`p-1 rounded-lg shrink-0 ${isSelected ? "bg-indigo-600 text-white" : `${opt.bg} ${opt.text}`}`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </span>
                          <span className={`text-[10px] font-black tracking-tight leading-none ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                            {opt.title}
                          </span>
                        </div>
                        <span className="text-[8px] text-slate-500 leading-normal">
                          {opt.desc}
                        </span>
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggle switch for Visibility */}
              <div className="flex items-center gap-3 py-3 border-t border-b border-slate-700/10">
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layoutVisibleInput}
                      onChange={(e) => setLayoutVisibleInput(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="flex flex-col text-left">
                  <span className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    Visible on Client App
                  </span>
                  <span className="text-[9px] text-slate-500">Toggle active visibility of this rail row instantly.</span>
                </div>
              </div>

              {/* Data Source Filters (DRAMA_RAIL only) */}
              {layoutTypeInput === "DRAMA_RAIL" && (
                <div className={`p-4 rounded-xl border flex flex-col gap-3.5 ${
                  isDark ? "bg-[#090d1a] border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center gap-1.5 border-b border-slate-700/10 pb-2">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <div className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">
                      Data Source Filter Settings
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-400">Media Filter</label>
                      <select
                        value={layoutMediaTypeInput}
                        onChange={(e) => setLayoutMediaTypeInput(e.target.value)}
                        className={`h-9 px-2.5 rounded-lg text-xs font-semibold border focus:outline-none focus:border-indigo-500 transition-colors ${
                          isDark ? "bg-[#11192e] border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="all">🎬 All Media Types</option>
                        <option value="tv">📺 TV Shows Only</option>
                        <option value="movie">🎥 Movies Only</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-400">Sort By Order</label>
                      <select
                        value={layoutSortByInput}
                        onChange={(e) => setLayoutSortByInput(e.target.value)}
                        className={`h-9 px-2.5 rounded-lg text-xs font-semibold border focus:outline-none focus:border-indigo-500 transition-colors ${
                          isDark ? "bg-[#11192e] border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="popularity">🔥 Popularity</option>
                        <option value="rating">⭐ Rating Scores</option>
                        <option value="newest">📅 Newest Release</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[9px] font-bold text-slate-400 font-mono">Country Filters (Comma separated list)</label>
                    <input
                      type="text"
                      placeholder="KR, JP"
                      value={layoutCountriesInput}
                      onChange={(e) => setLayoutCountriesInput(e.target.value)}
                      className={`h-8 px-2.5 rounded-lg text-xs font-mono font-bold border focus:outline-none focus:border-indigo-500 transition-colors ${
                        isDark ? "bg-[#11192e] border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    />
                    
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[
                        { code: "KR", flag: "🇰🇷" },
                        { code: "JP", flag: "🇯🇵" },
                        { code: "CN", flag: "🇨🇳" },
                        { code: "TW", flag: "🇹🇼" },
                        { code: "TH", flag: "🇹🇭" }
                      ].map((c) => {
                        const activeList = layoutCountriesInput.split(",").map(item => item.trim().toUpperCase());
                        const isActive = activeList.includes(c.code);
                        return (
                          <button
                            type="button"
                            key={c.code}
                            onClick={() => {
                              let items = layoutCountriesInput.split(",").map(x => x.trim().toUpperCase()).filter(Boolean);
                              if (items.includes(c.code)) {
                                items = items.filter(x => x !== c.code);
                              } else {
                                items.push(c.code);
                              }
                              setLayoutCountriesInput(items.join(", "));
                            }}
                            className={`px-2.5 py-1 rounded text-[8px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                              isActive
                                ? "bg-indigo-600 text-white border border-indigo-500 shadow"
                                : isDark ? "bg-slate-800 text-slate-300 border border-slate-700/50 hover:bg-slate-750" : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            <span>{c.flag}</span>
                            <span>{c.code}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons inside Modal */}
              <div className="flex items-center gap-2.5 mt-2 border-t border-slate-700/10 pt-4">
                <button
                  type="submit"
                  className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/15"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{layoutEditingId ? "Apply Modifications" : "Insert Custom Rail"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setLayoutEditingId(null); }}
                  className={`px-4 h-10 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                    isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* CUSTOM CONFIRMATION MODAL            */}
      {/* ==================================== */}
      {confirmState && confirmState.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl w-full max-w-sm shadow-2xl flex flex-col p-6 text-left ${
            isDark ? "bg-[#0c1224] border-[#1e2942]" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-start gap-3 mb-4">
              <span className={`p-2 rounded-xl shrink-0 ${confirmState.isDanger ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"}`}>
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div className="flex flex-col text-left">
                <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                  {confirmState.title}
                </h3>
                <p className={`text-xs mt-1 transition-colors leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {confirmState.message}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 mt-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                  isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {confirmState.cancelText || "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmState.onConfirm();
                  setConfirmState(null);
                }}
                className={`px-4 py-2 text-xs font-black rounded-xl text-white transition-all cursor-pointer shadow-md ${
                  confirmState.isDanger 
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/15" 
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/15"
                }`}
              >
                {confirmState.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* CUSTOM ALERT MODAL                   */}
      {/* ==================================== */}
      {alertState && alertState.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl w-full max-w-sm shadow-2xl flex flex-col p-6 text-left ${
            isDark ? "bg-[#0c1224] border-[#1e2942]" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-start gap-3 mb-4">
              <span className="p-2 bg-rose-500/10 text-rose-400 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div className="flex flex-col text-left">
                <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                  {alertState.title}
                </h3>
                <p className={`text-xs mt-1 transition-colors leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {alertState.message}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 mt-2 justify-end">
              <button
                type="button"
                onClick={() => setAlertState(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-600/15 transition-all cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. FLOATING BOTTOM NOTICE FOR UNSAVED CHANGES (DRAFT MODE) */}
      {/* ========================================================== */}
      {hasChanges && !isBannerDismissed && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 animate-bounce-in">
          <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] font-extrabold text-slate-100 uppercase tracking-wide">
                  Unsaved Layout Changes
                </span>
                <span className="text-[9px] text-slate-400 leading-relaxed">
                  You have active local draft changes. Do you want to save them?
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCommitChanges}
                disabled={layoutSaving}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-xl shadow transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                {layoutSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleDiscardChanges}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black rounded-xl transition-all cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => setIsBannerDismissed(true)}
                className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Dismiss warning temporarily"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
