import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ArrowLeft, Images, Play } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, subMonths, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import MediaLightbox from "@/components/gallery/MediaLightbox";
import PasswordGate, { usePasswordGate } from "@/pages/PasswordGate";
import { initTheme } from "@/components/gallery/ThemeSelector";

export default function CalendarView() {
  const { unlocked, unlock } = usePasswordGate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => { initTheme(); }, []);

  const { data: allMedia = [] } = useQuery({
    queryKey: ["photos"],
    queryFn: () => base44.entities.Photo.list("-created_date"),
  });

  // Get the effective date for a media item (assigned_date OR created_date)
  const getEffectiveDate = (m) => {
    if (m.assigned_date) return parseISO(m.assigned_date);
    if (m.created_date) return new Date(m.created_date);
    return null;
  };

  // Build a map: "YYYY-MM-DD" -> media[]
  const mediaByDate = {};
  allMedia.forEach(m => {
    const d = getEffectiveDate(m);
    if (!d) return;
    const key = format(d, "yyyy-MM-dd");
    if (!mediaByDate[key]) mediaByDate[key] = [];
    mediaByDate[key].push(m);
  });

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = getDay(days[0]); // 0=Sun

  const selectedKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedMedia = selectedKey ? (mediaByDate[selectedKey] || []) : [];

  const allDisplayedMedia = selectedDate ? selectedMedia : allMedia;

  if (!unlocked) return <PasswordGate onUnlock={unlock} />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Images className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-heading font-semibold tracking-tight">Calendar</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Calendar */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="font-heading text-xl font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2.5 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Padding cells */}
            {Array(startPad).fill(null).map((_, i) => (
              <div key={`pad-${i}`} className="aspect-square sm:aspect-auto sm:h-20 border-b border-r border-border/40 bg-muted/20" />
            ))}

            {days.map((day, i) => {
              const key = format(day, "yyyy-MM-dd");
              const dayMedia = mediaByDate[key] || [];
              const hasMedia = dayMedia.length > 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={`aspect-square sm:aspect-auto sm:h-20 border-b border-r border-border/40 p-1.5 text-left transition-all hover:bg-muted/50 relative flex flex-col ${
                    isSelected ? "bg-primary/10 ring-2 ring-inset ring-primary" : ""
                  } ${!isSameMonth(day, currentMonth) ? "opacity-30" : ""}`}
                >
                  <span className={`text-xs sm:text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? "bg-primary text-primary-foreground" : isSelected ? "text-primary font-bold" : ""
                  }`}>
                    {format(day, "d")}
                  </span>

                  {hasMedia && (
                    <div className="mt-auto w-full">
                      {/* Thumbnail strip on larger screens */}
                      <div className="hidden sm:flex gap-0.5 mt-1 overflow-hidden">
                        {dayMedia.slice(0, 3).map(m => (
                          <div key={m.id} className="w-5 h-5 rounded overflow-hidden bg-muted shrink-0 relative">
                            {m.media_type === "video" ? (
                              <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                                <Play className="w-2.5 h-2.5 text-white" />
                              </div>
                            ) : (
                              <img src={m.file_url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                        ))}
                      </div>
                      <Badge className="mt-1 text-[9px] px-1 py-0 h-4 bg-primary/20 text-primary border-0 font-semibold">
                        {dayMedia.length}
                      </Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day or overview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-lg font-semibold">
              {selectedDate
                ? `${format(selectedDate, "MMMM d, yyyy")} · ${selectedMedia.length} item${selectedMedia.length !== 1 ? "s" : ""}`
                : `All Media · ${allMedia.length} items`
              }
            </h3>
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)} className="text-xs text-muted-foreground hover:text-foreground underline">
                Show all
              </button>
            )}
          </div>

          {allDisplayedMedia.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
              <Images className="w-10 h-10 opacity-30" />
              <p className="text-sm">No media on this date</p>
              <p className="text-xs opacity-60">Open a photo's details to assign it a date</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {allDisplayedMedia.map(m => {
                const effectiveDate = getEffectiveDate(m);
                return (
                  <button
                    key={m.id}
                    onClick={() => { setLightboxMedia(m); setLightboxOpen(true); }}
                    className="aspect-square rounded-lg overflow-hidden group relative bg-muted"
                  >
                    {m.media_type === "video" ? (
                      <>
                        <video src={m.file_url} className="w-full h-full object-cover" muted preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                            <Play className="w-3.5 h-3.5 text-gray-900 ml-0.5" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <img src={m.file_url} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}
                    {m.assigned_date && (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[9px] text-center py-0.5 font-medium">
                        {format(parseISO(m.assigned_date), "MMM d")}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <MediaLightbox
        media={lightboxMedia}
        allMedia={allDisplayedMedia}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onNavigate={setLightboxMedia}
      />
    </div>
  );
}