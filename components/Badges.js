import { Flag, BadgeCheck, Star, Target, Flame, Zap, Car, BookOpen, Medal, Trophy } from "lucide-react";
import { BADGES } from "../lib/game";

const ICONS = { Flag, BadgeCheck, Star, Target, Flame, Zap, Car, BookOpen, Medal, Trophy };

export function BadgeGrid({ earned }) {
  return (
    <div className="badges">
      {BADGES.map((b) => {
        const Icon = ICONS[b.icon], on = earned.includes(b.key);
        return (
          <div key={b.key} className={`badge ${on ? "on" : ""}`}>
            <span className="bi"><Icon size={26} aria-hidden="true" /></span>
            <b>{b.title}</b>
            <small>{on ? "Unlocked" : b.desc}</small>
          </div>
        );
      })}
    </div>
  );
}
