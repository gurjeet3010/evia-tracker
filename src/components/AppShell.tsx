import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/AuthProvider";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-soft">
        <div className="h-10 w-10 animate-pulse rounded-full bg-gradient-pink" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <main className="mx-auto max-w-md px-5 pb-28 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}
