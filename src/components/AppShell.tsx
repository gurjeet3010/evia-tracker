import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { getCurrentEmail } from "@/lib/auth";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const email = getCurrentEmail();
    if (!email) {
      navigate({ to: "/login" });
    } else {
      setReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.state.location.pathname]);

  if (!ready) {
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
