import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, RotateCcw, Crop, Sliders } from "lucide-react";

const DEFAULT_FILTERS = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  fade: 0,
  sharpen: 0,
  vignette: 0,
};

const PRESETS = [
  { name: "Original", filters: { ...DEFAULT_FILTERS } },
  { name: "Vivid", filters: { brightness: 105, contrast: 115, saturation: 135, warmth: 5, fade: 0, sharpen: 0, vignette: 0 } },
  { name: "Matte", filters: { brightness: 102, contrast: 90, saturation: 85, warmth: 3, fade: 20, sharpen: 0, vignette: 10 } },
  { name: "B&W", filters: { brightness: 100, contrast: 110, saturation: 0, warmth: 0, fade: 0, sharpen: 5, vignette: 15 } },
  { name: "Warm", filters: { brightness: 105, contrast: 100, saturation: 110, warmth: 20, fade: 0, sharpen: 0, vignette: 0 } },
  { name: "Cool", filters: { brightness: 98, contrast: 105, saturation: 95, warmth: -18, fade: 0, sharpen: 0, vignette: 5 } },
  { name: "Fade", filters: { brightness: 108, contrast: 85, saturation: 80, warmth: 8, fade: 30, sharpen: 0, vignette: 0 } },
  { name: "Drama", filters: { brightness: 95, contrast: 130, saturation: 80, warmth: -5, fade: 0, sharpen: 10, vignette: 30 } },
];

function buildCssFilter(f) {
  const hueShift = (f.warmth * 15) / 50;
  return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) hue-rotate(${hueShift}deg)`;
}

function buildOverlayStyle(f) {
  const styles = [];
  if (f.fade > 0) styles.push(`rgba(255,255,255,${f.fade * 0.006})`);
  if (f.vignette > 0) styles.push(`radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${f.vignette * 0.008}) 100%)`);
  return styles;
}

export default function PhotoEditorDialog({ media, open, onOpenChange, onSaved }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [tab, setTab] = useState("filters");
  const [saving, setSaving] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const [cropStart, setCropStart] = useState(null);
  const [cropRect, setCropRect] = useState(null);
  const [dragging, setDragging] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    if (open && media) {
      setFilters({ ...DEFAULT_FILTERS });
      setCropRect(null);
      setCropMode(false);
      setImgLoaded(false);
    }
  }, [open, media]);

  if (!media || media.media_type === "video") return null;

  const displayUrl = media.edited_url || media.file_url;

  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const applyPreset = (preset) => setFilters({ ...preset.filters });

  // Crop mouse handlers
  const getCropCoords = (e) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };

  const onMouseDown = (e) => {
    if (!cropMode) return;
    const coords = getCropCoords(e);
    setCropStart(coords);
    setCropRect(null);
    setDragging(true);
  };

  const onMouseMove = (e) => {
    if (!cropMode || !dragging || !cropStart) return;
    const coords = getCropCoords(e);
    setCropRect({
      x: Math.min(cropStart.x, coords.x),
      y: Math.min(cropStart.y, coords.y),
      w: Math.abs(coords.x - cropStart.x),
      h: Math.abs(coords.y - cropStart.y),
    });
  };

  const onMouseUp = () => setDragging(false);

  const applyCropToCanvas = (img, rect, w, h) => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(rect.w * w);
    canvas.height = Math.round(rect.h * h);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, rect.x * w, rect.y * h, rect.w * w, rect.h * h, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  const handleSave = async () => {
    setSaving(true);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = displayUrl;
    await new Promise((res) => { img.onload = res; });

    let canvas = document.createElement("canvas");
    let ctx;

    if (cropRect && cropRect.w > 0.01 && cropRect.h > 0.01) {
      canvas = applyCropToCanvas(img, cropRect, img.width, img.height);
      ctx = canvas.getContext("2d");
    } else {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
    }

    // Apply CSS-equivalent filters via canvas
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const octx = offscreen.getContext("2d");
    octx.filter = buildCssFilter(filters);
    octx.drawImage(canvas, 0, 0);

    // Vignette overlay
    if (filters.vignette > 0) {
      const grad = octx.createRadialGradient(
        offscreen.width / 2, offscreen.height / 2, offscreen.width * 0.3,
        offscreen.width / 2, offscreen.height / 2, offscreen.width * 0.7
      );
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, `rgba(0,0,0,${filters.vignette * 0.008})`);
      octx.fillStyle = grad;
      octx.fillRect(0, 0, offscreen.width, offscreen.height);
    }

    // Fade overlay
    if (filters.fade > 0) {
      octx.fillStyle = `rgba(255,255,255,${filters.fade * 0.006})`;
      octx.fillRect(0, 0, offscreen.width, offscreen.height);
    }

    const blob = await new Promise(res => offscreen.toBlob(res, "image/jpeg", 0.92));
    const file = new File([blob], "edited.jpg", { type: "image/jpeg" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Photo.update(media.id, { edited_url: file_url });

    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  const cssFilter = buildCssFilter(filters);
  const overlays = buildOverlayStyle(filters);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <Sliders className="w-5 h-5" /> Edit Photo
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Preview */}
          <div className="flex-1 bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden min-h-[220px]">
            <div
              ref={previewRef}
              className={`relative inline-block select-none ${cropMode ? "cursor-crosshair" : ""}`}
              style={{ maxWidth: "100%", maxHeight: "100%" }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <img
                ref={imgRef}
                src={displayUrl}
                alt="edit preview"
                style={{ filter: cssFilter, display: "block", maxWidth: "100%", maxHeight: "55vh", objectFit: "contain" }}
                onLoad={() => setImgLoaded(true)}
                draggable={false}
              />
              {/* Vignette overlay */}
              {overlays.map((ov, i) => (
                <div key={i} className="absolute inset-0 pointer-events-none" style={{ background: ov }} />
              ))}
              {/* Crop overlay */}
              {cropMode && cropRect && (
                <div
                  className="absolute border-2 border-white/80 border-dashed pointer-events-none"
                  style={{
                    left: `${cropRect.x * 100}%`,
                    top: `${cropRect.y * 100}%`,
                    width: `${cropRect.w * 100}%`,
                    height: `${cropRect.h * 100}%`,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                  }}
                />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="w-full md:w-72 flex flex-col border-t md:border-t-0 md:border-l border-border overflow-hidden">
            <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
              <TabsList className="m-3 shrink-0">
                <TabsTrigger value="filters" className="flex-1"><Sliders className="w-3.5 h-3.5 mr-1.5" />Filters</TabsTrigger>
                <TabsTrigger value="crop" className="flex-1"><Crop className="w-3.5 h-3.5 mr-1.5" />Crop</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
                <TabsContent value="filters" className="mt-0 space-y-4">
                  {/* Presets */}
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Presets</Label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PRESETS.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => applyPreset(p)}
                          className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-muted transition-colors text-center"
                        >
                          <div className="w-10 h-10 rounded-md overflow-hidden">
                            <img
                              src={displayUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              style={{ filter: buildCssFilter(p.filters) }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sliders */}
                  {[
                    { key: "brightness", label: "Brightness", min: 50, max: 150 },
                    { key: "contrast", label: "Contrast", min: 50, max: 200 },
                    { key: "saturation", label: "Saturation", min: 0, max: 200 },
                    { key: "warmth", label: "Warmth", min: -50, max: 50 },
                    { key: "fade", label: "Fade", min: 0, max: 100 },
                    { key: "vignette", label: "Vignette", min: 0, max: 100 },
                  ].map(({ key, label, min, max }) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs">{label}</Label>
                        <span className="text-xs text-muted-foreground tabular-nums">{filters[key]}</span>
                      </div>
                      <Slider
                        min={min}
                        max={max}
                        step={1}
                        value={[filters[key]]}
                        onValueChange={([v]) => handleFilterChange(key, v)}
                      />
                    </div>
                  ))}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => setFilters({ ...DEFAULT_FILTERS })}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Filters
                  </Button>
                </TabsContent>

                <TabsContent value="crop" className="mt-0 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {cropMode ? "Drag on the image to select your crop area." : "Enable crop mode, then drag on the image to select an area."}
                  </p>
                  <Button
                    variant={cropMode ? "default" : "outline"}
                    className="w-full"
                    onClick={() => { setCropMode(!cropMode); if (cropMode) setCropRect(null); }}
                  >
                    <Crop className="w-4 h-4 mr-2" />
                    {cropMode ? "Disable Crop" : "Enable Crop"}
                  </Button>
                  {cropRect && cropRect.w > 0.01 && (
                    <div className="text-xs text-muted-foreground bg-muted rounded-lg p-2">
                      Crop area selected — will apply on save.
                      <button onClick={() => setCropRect(null)} className="ml-2 text-destructive hover:underline">Clear</button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground/70">Crop is applied together with filters when you save.</p>
                </TabsContent>
              </div>
            </Tabs>

            {/* Save */}
            <div className="p-3 border-t border-border shrink-0">
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Saving…" : "Save Edited Photo"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}