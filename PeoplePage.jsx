import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, Plus, Trash2, Images, Play, Loader2, Search } from "lucide-react";
import { initTheme } from "@/components/gallery/ThemeSelector";
import PasswordGate, { usePasswordGate } from "@/pages/PasswordGate";
import MediaLightbox from "@/components/gallery/MediaLightbox";

function AddPersonDialog({ open, onOpenChange, onCreated }) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await base44.entities.Person.create({ name: name.trim(), notes: notes.trim() });
    setSaving(false);
    setName(""); setNotes("");
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Add Person</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Best friend" />
          </div>
          <Button onClick={handleSubmit} disabled={!name.trim() || saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Add Person
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PeoplePage() {
  const { unlocked, unlock } = usePasswordGate();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { initTheme(); }, []);

  const { data: people = [] } = useQuery({
    queryKey: ["people"],
    queryFn: () => base44.entities.Person.list("-created_date"),
  });

  const { data: allMedia = [] } = useQuery({
    queryKey: ["photos"],
    queryFn: () => base44.entities.Photo.list("-created_date"),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["people"] });
    queryClient.invalidateQueries({ queryKey: ["photos"] });
  };

  const getPersonMedia = (personId) =>
    allMedia.filter(m => (m.people_ids || []).includes(personId));

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (person) => {
    await base44.entities.Person.delete(person.id);
    if (selectedPerson?.id === person.id) setSelectedPerson(null);
    refresh();
  };

  if (!unlocked) return <PasswordGate onUnlock={unlock} />;

  const personMedia = selectedPerson ? getPersonMedia(selectedPerson.id) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Users className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-heading font-semibold tracking-tight">People</h1>
          </div>
          <div className="ml-auto">
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Person
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {people.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-heading font-semibold">No people yet</h3>
            <p className="text-muted-foreground text-sm">Add people to tag them in your photos.</p>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add First Person
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* People list */}
            <div className="sm:col-span-1 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search people..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredPeople.map(p => {
                    const count = getPersonMedia(p.id).length;
                    const isActive = selectedPerson?.id === p.id;
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "bg-card border-border hover:bg-muted"
                        }`}
                        onClick={() => setSelectedPerson(isActive ? null : p)}
                      >
                        <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-lg font-bold ${
                          isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                        }`}>
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            p.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{p.name}</p>
                          <p className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {count} photo{count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(p); }}
                          className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
                            isActive ? "hover:bg-primary-foreground/20" : "hover:bg-destructive/10 hover:text-destructive"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Person media */}
            <div className="sm:col-span-2 lg:col-span-3">
              {selectedPerson ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                      {selectedPerson.avatar_url ? (
                        <img src={selectedPerson.avatar_url} alt={selectedPerson.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        selectedPerson.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="font-heading text-xl font-bold">{selectedPerson.name}</h2>
                      {selectedPerson.notes && <p className="text-sm text-muted-foreground">{selectedPerson.notes}</p>}
                    </div>
                    <Badge variant="secondary" className="ml-auto">{personMedia.length} photos</Badge>
                  </div>

                  {personMedia.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
                      <Images className="w-10 h-10 opacity-30" />
                      <p className="text-sm">No photos tagged with {selectedPerson.name} yet.</p>
                      <p className="text-xs opacity-60">Open a photo's details to tag people.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      <AnimatePresence>
                        {personMedia.map(m => (
                          <motion.button
                            key={m.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => { setLightboxMedia(m); setLightboxOpen(true); }}
                            className="aspect-square rounded-xl overflow-hidden bg-muted group relative"
                          >
                            {m.media_type === "video" ? (
                              <>
                                <video src={m.file_url} className="w-full h-full object-cover" muted preload="metadata" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <Play className="w-5 h-5 text-white" />
                                </div>
                              </>
                            ) : (
                              <img src={m.file_url} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            )}
                          </motion.button>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
                  <Users className="w-10 h-10 opacity-30" />
                  <p className="text-sm">Select a person to see their photos</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <AddPersonDialog open={addOpen} onOpenChange={setAddOpen} onCreated={refresh} />
      <MediaLightbox
        media={lightboxMedia}
        allMedia={personMedia}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onNavigate={setLightboxMedia}
      />
    </div>
  );
}