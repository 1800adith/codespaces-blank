import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, ImagePlus, Loader2, Video, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ACCEPTED = ".jpg,.jpeg,.png,.heic,.mp4,.mov,.webm,.avi";

export default function UploadDialog({ open, onOpenChange, collections, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [collectionId, setCollectionId] = useState("none");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [done, setDone] = useState(false);
  const inputRef = useRef();

  const isVideo = (file) => /\.(mp4|mov|webm|avi)$/i.test(file.name);

  const addFiles = (incoming) => {
    const valid = incoming.filter(f => /\.(jpg|jpeg|png|heic|mp4|mov|webm|avi)$/i.test(f.name));
    setFiles(prev => [...prev, ...valid]);
    valid.forEach(file => {
      if (isVideo(file)) {
        setPreviews(prev => [...prev, { name: file.name, src: null, video: true }]);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPreviews(prev => [...prev, { name: file.name, src: ev.target.result, video: false }]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileInput = (e) => addFiles(Array.from(e.target.files));

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    setUploading(true);
    setProgress(0);
    setDone(false);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFile(file.name);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const data = {
        file_url,
        file_name: file.name,
        title: file.name.replace(/\.[^/.]+$/, ""),
        media_type: isVideo(file) ? "video" : "photo",
      };
      if (collectionId !== "none") data.collection_id = collectionId;
      await base44.entities.Photo.create(data);
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setUploading(false);
    setDone(true);
    setTimeout(() => {
      setFiles([]);
      setPreviews([]);
      setCollectionId("none");
      setDone(false);
      onUploadComplete();
      onOpenChange(false);
    }, 800);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleClose = () => {
    if (uploading) return;
    setFiles([]); setPreviews([]); setCollectionId("none"); setDone(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Upload Media</DialogTitle>
        </DialogHeader>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !uploading && inputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/50 transition-all duration-300"
        >
          <ImagePlus className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Drag & drop or click to browse</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            JPG · PNG · HEIC · MP4 · MOV · WebM — bulk upload supported
          </p>
          <input ref={inputRef} type="file" accept={ACCEPTED} multiple onChange={handleFileInput} className="hidden" />
        </div>

        {previews.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </p>
            <div className="grid grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-1">
              <AnimatePresence>
                {previews.map((p, i) => (
                  <motion.div
                    key={p.name + i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-lg overflow-hidden group bg-muted"
                  >
                    {p.video ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <Video className="w-6 h-6 text-white/60" />
                      </div>
                    ) : (
                      <img src={p.src} alt={p.name} className="w-full h-full object-cover" />
                    )}
                    {!uploading && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Select value={collectionId} onValueChange={setCollectionId} disabled={uploading}>
            <SelectTrigger>
              <SelectValue placeholder="Add to collection (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No collection</SelectItem>
              {collections.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="truncate max-w-[70%]">{currentFile}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="w-full"
          >
            {done ? (
              <><CheckCircle2 className="w-4 h-4 mr-2 text-green-400" /> Done!</>
            ) : uploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading {progress}%</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" />
                Upload {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""}` : "Media"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}