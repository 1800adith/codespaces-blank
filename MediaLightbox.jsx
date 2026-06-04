import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function MediaLightbox({ media, allMedia, open, onOpenChange, onNavigate }) {
  if (!media) return null;

  const currentIndex = allMedia.findIndex(m => m.id === media.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allMedia.length - 1;
  const isVideo = media.media_type === "video";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 bg-black/96 border-none [&>button]:hidden">
        <div className="relative flex items-center justify-center min-h-[60vh] max-h-[90vh]">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {hasPrev && (
            <button
              onClick={() => onNavigate(allMedia[currentIndex - 1])}
              className="absolute left-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {isVideo ? (
            <video
              key={media.id}
              src={media.file_url}
              controls
              autoPlay
              className="max-w-full max-h-[85vh] rounded-lg"
            />
          ) : (
            <img
              src={media.file_url}
              alt={media.title || media.file_name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          )}

          {hasNext && (
            <button
              onClick={() => onNavigate(allMedia[currentIndex + 1])}
              className="absolute right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {media.title || media.file_name} · {currentIndex + 1} / {allMedia.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}