import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Images, CalendarDays, Users, Folder, Upload, ArrowRight, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initTheme } from "@/components/gallery/ThemeSelector";
import PasswordGate, { usePasswordGate } from "@/pages/PasswordGate";


export default function HomePage() {
  const { unlocked, unlock } = usePasswordGate();
  const navigate = useNavigate();

  useEffect(() => { initTheme(); }, []);

  const { data: allMedia = [] } = useQuery({
    queryKey: ["photos"],
    queryFn: () => base44.entities.Photo.list("-created_date"),
  });

  const { data: collections = [] } = useQuery({
    queryKey: ["collections"],
    queryFn: () => base44.entities.Collection.list("-created_date"),
  });

  const { data: people = [] } = useQuery({
    queryKey: ["people"],
    queryFn: () => base44.entities.Person.list("-created_date"),
  });

  const photoCount = allMedia.filter(m => m.media_type !== "video").length;
  const videoCount = allMedia.filter(m => m.media_type === "video").length;
  const recentMedia = allMedia.slice(0, 8);

  if (!unlocked) return <PasswordGate onUnlock={unlock} />;

  const stats = [
    { label: "Photos", value: photoCount, icon: Image, color: "bg-violet-500/10 text-violet-600", path: "/gallery" },
    { label: "Videos", value: videoCount, icon: Video, color: "bg-blue-500/10 text-blue-600", path: "/gallery" },
    { label: "Collections", value: collections.length, icon: Folder, color: "bg-amber-500/10 text-amber-600", path: "/gallery" },
    { label: "People", value: people.length, icon: Users, color: "bg-emerald-500/10 text-emerald-600", path: "/people" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Images className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-heading font-semibold tracking-tight">My Gallery</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/gallery")}>
              <Images className="w-4 h-4 mr-1.5" /> Gallery
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border p-6 sm:p-8"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-2">Welcome back 👋</h2>
          <p className="text-muted-foreground mb-5">
            {allMedia.length === 0
              ? "Start uploading your memories."
              : `You have ${allMedia.length} media items across ${collections.length} collection${collections.length !== 1 ? "s" : ""}.`}
          </p>
          <Button onClick={() => navigate("/gallery")} size="lg">
            <Upload className="w-4 h-4 mr-2" /> Open Gallery
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(s.path)}
              className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md transition-shadow group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-heading font-bold">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </motion.button>
          ))}
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Browse Gallery", desc: "View all your photos & videos", icon: Images, path: "/gallery", color: "from-violet-500/20" },
            { label: "Calendar", desc: "Browse by date", icon: CalendarDays, path: "/calendar", color: "from-blue-500/20" },
            { label: "People", desc: "Faces & tagged people", icon: Users, path: "/people", color: "from-emerald-500/20" },
          ].map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              onClick={() => navigate(item.path)}
              className={`relative bg-gradient-to-br ${item.color} to-transparent border border-border rounded-2xl p-5 text-left hover:shadow-lg transition-all group`}
            >
              <item.icon className="w-7 h-7 mb-3 text-foreground/70" />
              <div className="font-semibold font-heading">{item.label}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{item.desc}</div>
              <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </motion.button>
          ))}
        </div>

        {/* Recent media */}
        {recentMedia.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-lg font-semibold">Recent Uploads</h3>
              <button onClick={() => navigate("/gallery")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {recentMedia.map((m, i) => (
                <motion.button
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.03 }}
                  onClick={() => navigate("/gallery")}
                  className="aspect-square rounded-xl overflow-hidden bg-muted group"
                >
                  {m.media_type === "video" ? (
                    <video src={m.file_url} className="w-full h-full object-cover" muted preload="metadata" />
                  ) : (
                    <img src={m.file_url} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* People preview */}
        {people.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-lg font-semibold">People</h3>
              <button onClick={() => navigate("/people")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-3 flex-wrap">
              {people.slice(0, 8).map(p => {
                const count = allMedia.filter(m => (m.people_ids || []).includes(p.id)).length;
                return (
                  <button key={p.id} onClick={() => navigate("/people")} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors min-w-[72px]">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-medium truncate max-w-[60px]">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground">{count} photos</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}