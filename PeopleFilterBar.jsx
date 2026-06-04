import React from "react";
import { Users } from "lucide-react";

export default function PeopleFilterBar({ people, activePeopleIds, onToggle }) {
  if (!people || people.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">People</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {people.map((person) => {
          const active = activePeopleIds.includes(person.id);
          return (
            <button
              key={person.id}
              onClick={() => onToggle(person.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted"
              }`}
            >
              {person.avatar_url ? (
                <img
                  src={person.avatar_url}
                  alt={person.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {person.name.charAt(0).toUpperCase()}
                </span>
              )}
              {person.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}