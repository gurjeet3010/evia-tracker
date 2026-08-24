import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CYCLE_SYNCING_DATA, type PhaseSyncGuidance } from "@/lib/cycleSyncing";
import type { Phase } from "@/lib/cycle";
import { Droplet, FlaskConical, Brain, Sun, HeartHandshake, Zap, Utensils, Activity } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn — Evia" },
      { name: "description", content: "Friendly guides to understanding the menstrual cycle, hormones, mood, cycle syncing, and supporting a partner." },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  return (
    <AppShell>
      <LearnContent />
    </AppShell>
  );
}

const articles = [
  {
    icon: Droplet,
    title: "The menstrual cycle",
    summary: "A 28-day rhythm (give or take), divided into four phases.",
    body: "Your cycle has four phases: menstruation (days 1–5), follicular (days 1–13), ovulation (around day 14), and luteal (days 15–28). Each phase brings shifts in energy, mood, and physical sensations. Tracking helps you understand the patterns that are uniquely yours.",
    gradient: "bg-gradient-period",
    tone: "dark" as const,
  },
  {
    icon: FlaskConical,
    title: "Estrogen & progesterone",
    summary: "Two hormones that orchestrate your entire cycle.",
    body: "Estrogen rises in the first half of your cycle, building energy and lifting mood. After ovulation, progesterone takes over, encouraging rest and warmth. Both drop sharply just before your period — which can explain those low-energy days right before bleeding starts.",
    gradient: "bg-gradient-purple",
    tone: "dark" as const,
  },
  {
    icon: Brain,
    title: "Mood swings",
    summary: "Why feelings can shift through the month — and what helps.",
    body: "Hormonal changes affect serotonin and dopamine, which regulate mood. Many people feel more sensitive in the days before their period (PMS). Gentle movement, sleep, complex carbs, and emotional support can soften the dip. If symptoms feel overwhelming, talk to a clinician about PMDD.",
    gradient: "bg-gradient-pms",
    tone: "dark" as const,
  },
  {
    icon: Sun,
    title: "Menopause",
    summary: "A natural transition, usually between 45 and 55.",
    body: "Menopause marks the end of menstrual cycles, defined as 12 months without a period. The years leading up — perimenopause — bring fluctuating hormones and symptoms like hot flashes, sleep changes, and mood shifts. It's a transition, not an illness, and there's a lot of support available.",
    gradient: "bg-gradient-fertile",
    tone: "light" as const,
  },
  {
    icon: HeartHandshake,
    title: "Supporting someone on their period",
    summary: "Small gestures that mean a lot.",
    body: "Listen without trying to fix. Offer warmth — a hot water bottle, a blanket, a favorite snack. Don't take mood changes personally. Ask what they need rather than assuming. Sometimes that's company; sometimes that's quiet space. Empathy beats advice every time.",
    gradient: "bg-gradient-hero",
    tone: "dark" as const,
  },
];

const PHASE_TABS: { key: Phase; label: string }[] = [
  { key: "period", label: "Menstrual" },
  { key: "follicular", label: "Follicular" },
  { key: "ovulation", label: "Ovulation" },
  { key: "luteal", label: "Luteal" },
];

function LearnContent() {
  const [activeTab, setActiveTab] = useState<Phase>("period");
  const activeData: PhaseSyncGuidance = CYCLE_SYNCING_DATA[activeTab];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Knowledge</p>
        <h1 className="text-2xl font-bold tracking-tight">Learn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Friendly, science-backed guides to your body and rhythm.
        </p>
      </header>

      {/* Cycle Syncing Interactive Guide */}
      <section className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-pink text-primary-foreground shadow-soft">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Cycle Syncing Cheat Sheet</h2>
            <p className="text-xs text-muted-foreground">Match your nutrition & workouts to your hormones</p>
          </div>
        </div>

        {/* Phase Selector Tabs */}
        <div className="flex rounded-2xl bg-secondary/60 p-1 text-xs gap-1">
          {PHASE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-xl py-2 font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-gradient-pink text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Selected Phase Detail Content */}
        <div className="rounded-2xl bg-secondary/30 p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-foreground">{activeData.title}</span>
            <span className="rounded-lg bg-primary/10 px-2 py-0.5 font-bold text-primary">
              Energy: {activeData.energyPercent}%
            </span>
          </div>
          <p className="text-muted-foreground leading-relaxed">{activeData.tagline}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl border border-border/60 bg-background p-3 space-y-1.5">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Utensils className="h-3.5 w-3.5 text-emerald-500" /> Food Focus
              </span>
              <p className="text-muted-foreground leading-relaxed">{activeData.nutrition.summary}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {activeData.nutrition.keyNutrients.map((n) => (
                  <span key={n} className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background p-3 space-y-1.5">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-indigo-500" /> Training Focus
              </span>
              <p className="font-semibold text-foreground">{activeData.movement.type}</p>
              <p className="text-muted-foreground leading-relaxed">{activeData.movement.summary}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Articles */}
      <div className="space-y-4">
        {articles.map((a) => (
          <article
            key={a.title}
            className={`overflow-hidden rounded-3xl ${a.gradient} p-5 shadow-soft ${a.tone === "light" ? "text-foreground" : "text-primary-foreground"}`}
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/25 backdrop-blur-sm`}>
                <a.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold leading-snug">{a.title}</h2>
                <p className={`text-xs ${a.tone === "light" ? "text-foreground/75" : "text-primary-foreground/85"}`}>
                  {a.summary}
                </p>
              </div>
            </div>
            <p className={`mt-4 text-sm leading-relaxed ${a.tone === "light" ? "text-foreground/90" : "text-primary-foreground/95"}`}>
              {a.body}
            </p>
          </article>
        ))}
      </div>

      <p className="px-2 pt-2 text-center text-[11px] text-muted-foreground">
        Educational content only. Always consult a healthcare professional for medical advice.
      </p>
    </div>
  );
}

