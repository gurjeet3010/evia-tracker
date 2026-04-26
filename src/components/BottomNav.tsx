import { Link, useLocation } from "@tanstack/react-router";
import { Home, CalendarDays, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/learn", label: "Learn", icon: BookOpen },
] as const;

export function BottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                  active && "bg-gradient-pink text-primary-foreground shadow-soft"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className={cn(active && "text-foreground")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
