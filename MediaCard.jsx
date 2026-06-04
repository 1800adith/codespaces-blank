import React from "react";
import { motion } from "framer-motion";
import { Trash2, Info, Play, EyeOff, Pencil } from "lucide-react";

export default function MediaCard({ media, onClick, onDelete, onInfo, onHide, onEdit }) {
  const isVideo = media.media_type === "video";
  const displayUrl = media.edited_url || media.file_url;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group relative rounded-xl overflow-hidden cursor-pointer bg-muted w-full h-full"
      onClick={() => onClick(media)}
    >
      {isVideo ? (
        <>
          <video
            src={media.file_url}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-12 h-12 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 text-gray-900 ml-0.5" />
            </div>
          </div>
        </>
      ) : (
        <img
          src={displayUrl}
          alt={media.title || media.file_name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <p className="text-white text-sm font-medium truncate">
          {media.title || media.file_name}
        </p>
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {!isVideo && onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(media); }}
            className="p-1.5 rounded-full bg-black/40 text-white hover:bg-primary transition-colors"
            title="Edit photo"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onInfo(media); }}
          className="p-1.5 rounded-full bg-black/40 text-white hover:bg-primary transition-colors"
          title="Details"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
        {onHide && (
          <button
            onClick={(e) => { e.stopPropagation(); onHide(media); }}
            className="p-1.5 rounded-full bg-black/40 text-white hover:bg-amber-500 transition-colors"
            title="Hide photo"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(media); }}
          className="p-1.5 rounded-full bg-black/40 text-white hover:bg-destructive transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}