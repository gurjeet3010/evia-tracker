import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getCurrentEmail } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    const email = getCurrentEmail();
    navigate({ to: email ? "/dashboard" : "/login", replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-soft">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-full bg-gradient-pink shadow-glow" />
        <p className="text-sm font-medium text-muted-foreground">Bloom</p>
      </div>
    </div>
  );
}
