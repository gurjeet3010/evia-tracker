import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCurrentEmail } from "@/lib/auth";
import { isOnboarded } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Evia — Keep track of your period" },
      { name: "description", content: "Easily and accurately track each phase of your menstrual cycle." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Brief splash, then route based on auth state
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleStart = () => {
    const email = getCurrentEmail();
    if (!email) return navigate({ to: "/login" });
    if (!isOnboarded()) return navigate({ to: "/onboarding" });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white">
      {/* Soft gradient blob — center-bottom */}
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 h-[110vh] w-[110vh] -translate-x-1/2 -translate-y-[40%] rounded-full blur-3xl transition-opacity duration-700 ${show ? "opacity-100" : "opacity-0"}`}
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #F5D5E0 0%, transparent 55%), radial-gradient(circle at 70% 40%, #6667AB 0%, transparent 50%), radial-gradient(circle at 60% 70%, #7B337E 0%, transparent 55%)",
        }}
      />
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 blur-2xl ${show ? "" : ""}`}
        style={{
          background:
            "radial-gradient(circle, #7B337E 0%, #420D4B 60%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-24">
        <div className="flex-1" />
        <div className={`transition-all duration-700 ${show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          <h1 className="text-[44px] font-bold leading-[1.05] tracking-tight text-white drop-shadow-sm">
            Keep track of<br />your period
          </h1>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/85">
            Easily and accurately track each phase of your menstrual cycle.
          </p>
        </div>

        <button
          onClick={handleStart}
          className={`mt-10 w-full rounded-full bg-white py-4 text-center text-base font-semibold text-primary shadow-glow transition-all hover:scale-[1.01] active:scale-[0.99] ${show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          Get started
        </button>
      </div>
    </div>
  );
}
