import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FolderPlus, Images, LayoutGrid, Search, Palette, CalendarDays, Users, Home, EyeOff, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import MediaCard from "@/components/gallery/MediaCard";
import MediaLightbox from "@/components/gallery/MediaLightbox";
import CollectionCard from "@/components/gallery/CollectionCard";
import UploadDialog from "@/components/gallery/UploadDialog";
import CollectionDialog from "@/components/gallery/CollectionDialog";
import PhotoDetailsDialog from "@/components/gallery/PhotoDetailsDialog";
import ThemeSelector, { applyTheme, initTheme } from "@/components/gallery/ThemeSelector";
import CoverPageDialog from "@/components/gallery/CoverPage";
import PasswordGate, { usePasswordGate } from "@/pages/PasswordGate";
import PhotoEditorDialog from "@/components/gallery/PhotoEditorDialog";
import PeopleFilterBar from "@/components/gallery/PeopleFilterBar";

export default function Gallery() {
  const { unlocked, unlock } = usePasswordGate();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [activeCollection, setActiveCollection] = useState(null);
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [detailsMedia, setDetailsMedia] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [coverCollection, setCoverCollection] = useState(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTheme, setCurrentTheme] = useState("light");
  const [filterType, setFilterType] = useState("all"); // all | photo | video
  const [activePeopleIds, setActivePeopleIds] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const [editorMedia, setEditorMedia] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = initTheme();
    setCurrentTheme(saved);
  }, []);

  const { data: allMedia = [], isLoading } = useQuery({
    queryKey: ["photos"],
    queryFn: () => base44.entities.Photo.list("-created_date")
  });

  const { data: collections = [] } = useQuery({
    queryKey: ["collections"],
    queryFn: () => base44.entities.Collection.list("-created_date")
  });

  const { data: allPeople = [] } = useQuery({
    queryKey: ["people"],
    queryFn: () => base44.entities.Person.list("-created_date")
  });

  // Filtering pipeline
  const filteredMedia = allMedia
    .filter((m) => showHidden ? m.is_hidden : !m.is_hidden)
    .filter((m) => activeCollection ? m.collection_id === activeCollection.id : true)
    .filter((m) => filterType === "all" ? true : m.media_type === filterType || (!m.media_type && filterType === "photo"))
    .filter((m) => {
      if (activePeopleIds.length === 0) return true;
      return activePeopleIds.every(pid => (m.people_ids || []).includes(pid));
    })
    .filter((m) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (m.title || "").toLowerCase().includes(q) ||
        (m.file_name || "").toLowerCase().includes(q) ||
        (m.keywords || []).some((k) => k.toLowerCase().includes(q))
      );
    });

  const getCollectionCount = (collId) => allMedia.filter((m) => m.collection_id === collId).length;

  const getCollectionCover = (collection) => {
    if (collection.cover_url) return collection.cover_url;
    const first = allMedia.find((m) => m.collection_id === collection.id && m.media_type !== "video");
    return first?.file_url;
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["photos"] });
    queryClient.invalidateQueries({ queryKey: ["collections"] });
  };

  const handleDelete = async (media) => {
    await base44.entities.Photo.delete(media.id);
    refresh();
  };

  const handleHide = async (media) => {
    await base44.entities.Photo.update(media.id, { is_hidden: !media.is_hidden });
    refresh();
  };

  const togglePersonFilter = (personId) => {
    setActivePeopleIds(prev =>
      prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
    );
  };

  const openEditor = (media) => {
    setEditorMedia(media);
    setEditorOpen(true);
  };

  const handleDeleteCollection = async (collection) => {
    await base44.entities.Collection.delete(collection.id);
    if (activeCollection?.id === collection.id) setActiveCollection(null);
    refresh();
  };

  const handleThemeChange = (id) => {
    applyTheme(id);
    setCurrentTheme(id);
  };

  const openLightbox = (media) => {
    setLightboxMedia(media);
    setLightboxOpen(true);
  };

  const openDetails = (media) => {
    setDetailsMedia(media);
    setDetailsOpen(true);
  };

  const openCoverDialog = (collection) => {
    setCoverCollection(collection);
    setCoverOpen(true);
  };

  if (!unlocked) {
    return <PasswordGate onUnlock={unlock} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Images className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-heading font-semibold tracking-tight hidden sm:block">1e</h1>
          </div>

          {/* Search */}
          <div className="flex-1 relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search photos & videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-muted/60 border-transparent focus:bg-background focus:border-input" />
            
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9" title="Home">
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/calendar")} className="h-9 w-9" title="Calendar">
              <CalendarDays className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/people")} className="h-9 w-9" title="People">
              <Users className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setThemeOpen(true)} className="h-9 w-9">
              <Palette className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCollectionOpen(true)} className="h-9">
              <FolderPlus className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline text-sm">Collection</span>
            </Button>
            <Button size="sm" onClick={() => setUploadOpen(true)} className="h-9">
              <Upload className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline text-sm">Upload</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Collections Bar */}
        {collections.length > 0 &&
        <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collections</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {/* All */}
              <button
              onClick={() => setActiveCollection(null)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-300 min-w-[88px] shrink-0 ${
              !activeCollection ? "bg-primary text-primary-foreground shadow-md" : "bg-card hover:bg-muted border border-border"}`
              }>
              
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${!activeCollection ? "bg-primary-foreground/20" : "bg-muted"}`}>
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">All</span>
                <span className={`text-[10px] ${!activeCollection ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {allMedia.length}
                </span>
              </button>

              {collections.map((c) =>
            <div key={c.id} className="relative group/col shrink-0">
                  <CollectionCard
                collection={c}
                photoCount={getCollectionCount(c.id)}
                coverUrl={getCollectionCover(c)}
                isActive={activeCollection?.id === c.id}
                onClick={setActiveCollection}
                onDelete={handleDeleteCollection} />
              
                  {/* Cover button */}
                  <button
                onClick={() => openCoverDialog(c)}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded opacity-0 group-hover/col:opacity-100 transition-opacity whitespace-nowrap">
                
                    Set Cover
                  </button>
                </div>
            )}
            </div>
          </section>
        }

        {/* Filter bar */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {["all", "photo", "video"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filterType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {type === "all" ? "All" : type === "photo" ? "Photos" : "Videos"}
              </button>
            ))}

            {/* Hidden toggle */}
            <button
              onClick={() => setShowHidden(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ml-auto ${
                showHidden
                  ? "bg-amber-500 text-white"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showHidden ? "Hidden" : "Hidden"}
            </button>

            <span className={`text-sm text-muted-foreground ${showHidden ? "" : "ml-0"}`}>
              {filteredMedia.length} items
            </span>
          </div>

          {/* People filter */}
          {allPeople.length > 0 && !showHidden && (
            <PeopleFilterBar
              people={allPeople}
              activePeopleIds={activePeopleIds}
              onToggle={togglePersonFilter}
            />
          )}
        </div>

        {/* Grid */}
        {isLoading ?
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array(8).fill(0).map((_, i) =>
          <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
          )}
          </div> :
        filteredMedia.length > 0 ?
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <AnimatePresence>
              {filteredMedia.map((m) =>
            <div key={m.id} className="aspect-square">
                  <MediaCard
                media={m}
                onClick={openLightbox}
                onDelete={handleDelete}
                onInfo={openDetails}
                onHide={handleHide}
                onEdit={openEditor} />
              
                </div>
            )}
            </AnimatePresence>
          </div> :

        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Images className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-heading font-semibold mb-1">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : showHidden
                ? "No hidden photos"
                : activePeopleIds.length > 0
                ? "No photos with these people"
                : activeCollection
                ? "No media in this collection"
                : "No media yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery
                ? "Try a different search term"
                : showHidden
                ? "Photos you hide will appear here"
                : "Upload photos and videos to get started"}
            </p>
            {!searchQuery &&
          <Button onClick={() => setUploadOpen(true)}>
                <Upload className="w-4 h-4 mr-2" /> Upload Media
              </Button>
          }
          </div>
        }
      </main>

      {/* Dialogs */}
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} collections={collections} onUploadComplete={refresh} />
      <CollectionDialog open={collectionOpen} onOpenChange={setCollectionOpen} onCreated={refresh} />
      <MediaLightbox media={lightboxMedia} allMedia={filteredMedia} open={lightboxOpen} onOpenChange={setLightboxOpen} onNavigate={setLightboxMedia} />
      <PhotoDetailsDialog media={detailsMedia} collections={collections} open={detailsOpen} onOpenChange={setDetailsOpen} onUpdated={refresh} />
      <ThemeSelector open={themeOpen} onOpenChange={setThemeOpen} currentTheme={currentTheme} onThemeChange={handleThemeChange} />
      <CoverPageDialog collection={coverCollection} photos={allMedia} open={coverOpen} onOpenChange={setCoverOpen} onUpdated={refresh} />
      <PhotoEditorDialog media={editorMedia} open={editorOpen} onOpenChange={setEditorOpen} onSaved={refresh} />
    </div>);

}