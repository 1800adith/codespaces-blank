import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, ImageIcon } from "lucide-react";

export default function CoverPageDialog({ collection, photos, open, onOpenChange, onUpdated }) {
  const [selectedUrl, setSelectedUrl] = useState(collection?.cover_url || null);
  const [saving, setSaving] = useState(false);

  const collectionPhotos = photos.filter(p => p.collection_id === collection?.id && p.media_type !== "video");

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Collection.update(collection.id, { cover_url: selectedUrl });
    setSaving(false);
    onUpdated();
    onOpenChange(false);
  };

  if (!collection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Set Cover — {collection.name}
          </DialogTitle>
        </DialogHeader>

        {collectionPhotos.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground gap-3">
            <ImageIcon className="w-10 h-10 opacity-40" />
            <p className="text-sm">Add photos to this collection first</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select a photo as the collection cover</p>
            <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto">
              {collectionPhotos.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedUrl(photo.file_url)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedUrl === photo.file_url
                      ? "border-primary shadow-lg scale-95"
                      : "border-transparent hover:border-primary/40"
                  }`}
                >
                  <img src={photo.file_url} alt="" className="w-full h-full object-cover" />
                  {selectedUrl === photo.file_url && (
                    <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !selectedUrl} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Set as Cover
              </Button>
              {collection.cover_url && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    setSaving(true);
                    await base44.entities.Collection.update(collection.id, { cover_url: null });
                    setSaving(false);
                    onUpdated();
                    onOpenChange(false);
                  }}
                >
                  Remove Cover
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}