import React from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

export default function PhotoCard({ photo, onClick, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group relative rounded-xl overflow-hidden cursor-pointer bg-muted"
      onClick={() => onClick(photo)}
    >
      <img
        src={photo.file_url}
        alt={photo.title || photo.file_name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <p className="text-white text-sm font-medium truncate">
          {photo.title || photo.file_name}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(photo); }}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-destructive"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}