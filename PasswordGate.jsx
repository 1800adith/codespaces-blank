import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Images } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CORRECT_PASSWORD = "113266AK";
const SESSION_KEY = "gallery_auth";

export function usePasswordGate() {
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  });
  const unlock = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    setUnlocked(true);
  };
  return { unlocked, unlock };
}

export default function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-sm">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <Images className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Gallery</h1>
          <p className="text-sm text-muted-foreground mt-2">AK</p>
        </div>

        {/* Lock icon */}
        <motion.div
          className="flex justify-center mb-8"
          animate={shaking ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}>
          
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-300 ${
          error ? "bg-destructive/10" : "bg-muted"}`
          }>
            <Lock className={`w-6 h-6 transition-colors duration-300 ${error ? "text-destructive" : "text-muted-foreground"}`} />
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`pr-12 h-12 text-center text-lg tracking-widest transition-all ${
              error ? "border-destructive ring-1 ring-destructive" : ""}`
              }
              autoFocus />
            
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error &&
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive text-center">
            
              Incorrect password. Please try again.
            </motion.p>
          }

          <Button type="submit" className="w-full h-12 text-base font-medium">
            Unlock Gallery
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground/50 mt-8">

        </p>
      </motion.div>
    </div>);

}