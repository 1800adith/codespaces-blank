import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileImage, Video, Save, Loader2, X, Plus, Tag, Users } from "lucide-react";
import { format } from "date-fns";

export default function PhotoDetailsDialog({ media, collections, open, onOpenChange, onUpdated }) {
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [collectionId, setCollectionId] = useState("none");
  const [assignedDate, setAssignedDate] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [peopleIds, setPeopleIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const { data: allPeople = [] } = useQuery({
    queryKey: ["people"],
    queryFn: () => base44.entities.Person.list("-created_date"),
  });

  useEffect(() => {
    if (media) {
      setTitle(media.title || "");
      setFileName(media.file_name || "");
      setCollectionId(media.collection_id || "none");
      setAssignedDate(media.assigned_date || "");
      setKeywords(media.keywords || []);
      setPeopleIds(media.people_ids || []);
      setKeywordInput("");
    }
  }, [media]);

  if (!media) return null;

  const isVideo = media.media_type === "video";

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) setKeywords(prev => [...prev, kw]);
    setKeywordInput("");
  };

  const removeKeyword = (kw) => setKeywords(prev => prev.filter(k => k !== kw));

  const handleKeywordKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addKeyword(); }
  };

  const togglePerson = (id) => {
    setPeopleIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Photo.update(media.id, {
      title: title.trim(),
      file_name: fileName.trim() || media.file_name,
      collection_id: collectionId !== "none" ? collectionId : null,
      assigned_date: assignedDate || null,
      keywords,
      people_ids: peopleIds,
    });
    setSaving(false);
    onUpdated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            {isVideo ? <Video className="w-5 h-5 text-blue-500" /> : <FileImage className="w-5 h-5" />}
            Edit Media Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Thumbnail */}
          <div className="rounded-xl overflow-hidden bg-muted aspect-video relative">
            {isVideo ? (
              <video src={media.file_url} className="w-full h-full object-contain" controls />
            ) : (
              <img src={media.file_url} alt={media.title} className="w-full h-full object-contain" />
            )}
            <Badge className={`absolute top-2 right-2 text-xs ${isVideo ? "bg-blue-600 text-white" : "bg-black/60 text-white"}`}>
              {isVideo ? "VIDEO" : "PHOTO"}
            </Badge>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter title..." />
          </div>

          {/* File name */}
          <div className="space-y-1.5">
            <Label>File Name</Label>
            <Input value={fileName} onChange={e => setFileName(e.target.value)} placeholder="filename.jpg" />
          </div>

          {/* Collection */}
          <div className="space-y-1.5">
            <Label>Collection</Label>
            <Select value={collectionId} onValueChange={setCollectionId}>
              <SelectTrigger>
                <SelectValue placeholder="No collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No collection</SelectItem>
                {collections.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned Date */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Assign Date
            </Label>
            <Input type="date" value={assignedDate} onChange={e => setAssignedDate(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Uploaded: {media.created_date ? format(new Date(media.created_date), "MMM d, yyyy") : "—"}
            </p>
          </div>

          {/* People */}
          {allPeople.length > 0 && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Tag People
              </Label>
              <div className="flex flex-wrap gap-2">
                {allPeople.map(p => {
                  const tagged = peopleIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePerson(p.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        tagged
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted border-border hover:bg-accent"
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center font-bold text-[10px]">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                      {p.name}
                      {tagged && <X className="w-3 h-3 ml-0.5 opacity-70" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Keywords */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Keywords
            </Label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Add keyword, press Enter..."
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={addKeyword}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {keywords.map(kw => (
                  <Badge key={kw} variant="secondary" className="flex items-center gap-1 pr-1">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="ml-0.5 hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}