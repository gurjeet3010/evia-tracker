import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { getCurrentEmail, saveUserData } from "@/lib/auth";
import type { TrackingFor } from "@/lib/cycle";
import { Flower2, User, Heart, Calendar as CalendarIcon, ChevronRight, ChevronLeft, Check } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — Evia" },
      { name: "description", content: "Set up your cycle preferences to get personalized insights." },
    ],
  }),
  component: OnboardingPage,
});

const TOTAL_STEPS = 4;

function OnboardingPage() {
  const navigate = useNavigate();
  const email = getCurrentEmail();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [trackingFor, setTrackingFor] = useState<TrackingFor>("self");
  const [lastPeriod, setLastPeriod] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [error, setError] = useState<string | null>(null);

  if (!email) {
    if (typeof window !== "undefined") navigate({ to: "/login", replace: true });
    return null;
  }

  function next() {
    setError(null);
    if (step === 1 && !name.trim()) {
      setError("Please enter a name so we can personalize your experience.");
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      finish();
    }
  }

  function back() {
    setError(null);
    if (step > 1) setStep(step - 1);
  }

  function finish() {
    if (!email) return;
    saveUserData({
      email,
      name: name.trim(),
      trackingFor,
      lastPeriodDate: lastPeriod,
      cycleLength,
      periodLength,
      onboarded: true,
    });
    navigate({ to: "/dashboard", replace: true });
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-soft">
      <div className="pointer-events-none absolute -top-32 -right-20 h-72 w-72 rounded-full bg-gradient-pink opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-gradient-purple opacity-40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-pink shadow-soft">
            <Flower2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Step {step} of {TOTAL_STEPS}
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-pink transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-soft backdrop-blur">
            {step === 1 && (
              <StepWrapper icon={<User className="h-6 w-6" />} title="What should we call you?" subtitle="Your name helps make Evia feel personal.">
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your first name"
                  maxLength={40}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </StepWrapper>
            )}

            {step === 2 && (
              <StepWrapper icon={<Heart className="h-6 w-6" />} title="Who are you tracking for?" subtitle="You can track your own cycle or support someone you love.">
                <div className="grid gap-3">
                  <ChoiceCard
                    selected={trackingFor === "self"}
                    onClick={() => setTrackingFor("self")}
                    emoji="🌸"
                    title="Myself"
                    description="Track your own cycle and wellness."
                  />
                  <ChoiceCard
                    selected={trackingFor === "partner"}
                    onClick={() => setTrackingFor("partner")}
                    emoji="💞"
                    title="My partner"
                    description="Stay in sync and support them through every phase."
                  />
                </div>
              </StepWrapper>
            )}

            {step === 3 && (
              <StepWrapper icon={<CalendarIcon className="h-6 w-6" />} title="When did the last period start?" subtitle="A rough date is fine — you can update it anytime.">
                <input
                  type="date"
                  value={lastPeriod}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setLastPeriod(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </StepWrapper>
            )}

            {step === 4 && (
              <StepWrapper icon={<Flower2 className="h-6 w-6" />} title="Cycle & period length" subtitle="The average is 28 days, but every body is different.">
                <div className="space-y-5">
                  <SliderField
                    label="Cycle length"
                    value={cycleLength}
                    unit="days"
                    min={21}
                    max={45}
                    onChange={setCycleLength}
                    hint="Days between the start of two periods"
                  />
                  <SliderField
                    label="Period length"
                    value={periodLength}
                    unit="days"
                    min={2}
                    max={10}
                    onChange={setPeriodLength}
                    hint="How long the period typically lasts"
                  />
                </div>
              </StepWrapper>
            )}

            {error && (
              <div className="mt-4 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
                {error}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={back}
                className="flex items-center justify-center gap-1 rounded-2xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-pink py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {step === TOTAL_STEPS ? (
                <><Check className="h-4 w-4" /> Finish setup</>
              ) : (
                <>Continue <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepWrapper({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-pink text-primary-foreground shadow-glow">
          {icon}
        </div>
        <h2 className="mt-4 text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ChoiceCard({ selected, onClick, emoji, title, description }: { selected: boolean; onClick: () => void; emoji: string; title: string; description: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-soft"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl">
        {emoji}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${selected ? "border-primary bg-primary" : "border-border"}`}>
        {selected && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
    </button>
  );
}

function SliderField({ label, value, unit, min, max, onChange, hint }: { label: string; value: number; unit: string; min: number; max: number; onChange: (v: number) => void; hint: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-sm font-bold text-primary">{value} <span className="text-xs font-medium text-muted-foreground">{unit}</span></p>
      </div>
      <p className="mb-2 text-[11px] text-muted-foreground">{hint}</p>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--primary)]"
      />
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}
