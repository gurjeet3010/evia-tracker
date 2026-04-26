import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Droplet, FlaskConical, Brain, Sun, HeartHandshake } from "lucide-react";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn — Evia" },
      { name: "description", content: "Friendly guides to understanding the menstrual cycle, hormones, mood, menopause, and how to support a partner." },
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

function LearnContent() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Knowledge</p>
        <h1 className="text-2xl font-bold tracking-tight">Learn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Friendly, science-backed guides to your body and rhythm.
        </p>
      </header>

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
