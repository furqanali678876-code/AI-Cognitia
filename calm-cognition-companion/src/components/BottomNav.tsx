import { Link } from "@tanstack/react-router";
import { Home, BellRing, MessageCircleHeart, Puzzle, UserRound } from "lucide-react";

const ITEMS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/reminders", label: "Reminders", icon: BellRing },
  { to: "/assistant", label: "Assistant", icon: MessageCircleHeart },
  { to: "/games", label: "Games", icon: Puzzle },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Main menu"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-lift"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 py-2">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="tap-target flex h-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-base font-semibold text-muted-foreground transition-colors hover:bg-primary-soft"
              activeProps={{ className: "bg-primary-soft text-primary" }}
              aria-label={label}
            >
              <Icon className="size-7" aria-hidden />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
