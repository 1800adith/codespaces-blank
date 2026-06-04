import React from "react";
import { motion } from "framer-motion";
import { Folder, Trash2 } from "lucide-react";

export default function CollectionCard({ collection, photoCount, coverUrl, isActive, onClick, onDelete }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick(collection)}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 group min-w-[100px] ${
        isActive
          ? "bg-primary text-primary-foreground shadow-lg"
          : "bg-card hover:bg-muted border border-border"
      }`}
    >
      {coverUrl ? (
        <div className="w-14 h-14 rounded-lg overflow-hidden">
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
          isActive ? "bg-primary-foreground/20" : "bg-muted"
        }`}>
          <Folder className="w-6 h-6" />
        </div>
      )}
      <span className="text-xs font-medium truncate max-w-[80px]">{collection.name}</span>
      <span className={`text-[10px] ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
        {photoCount} photos
      </span>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(collection); }}
          className="absolute -top-1 -right-1 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </motion.button>
  );
}