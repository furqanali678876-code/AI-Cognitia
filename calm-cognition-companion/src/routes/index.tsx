import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BellRing, Brain, HeartHandshake, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Cognitia — Gentle daily memory support" },
      {
        name: "description",
        content:
          "A calm, easy app for older adults: loud medicine and appointment reminders, brain games and a friendly voice assistant.",
      },
      { property: "og:title", content: "AI Cognitia — Gentle daily memory support" },
      {
        property: "og:description",
        content:
          "Loud reminders, brain games and a friendly assistant, designed for people living with memory loss.",
      },
    ],
  }),
  component: Welcome,
});

const POINTS = [
  { icon: BellRing, title: "Reminders that ring", text: "A loud alarm until you press Done." },
  { icon: Brain, title: "Gentle brain games", text: "Simple games you can play offline." },
  { icon: HeartHandshake, title: "Family close by", text: "Keep caregiver details in one place." },
  { icon: ShieldCheck, title: "Private and safe", text: "Only you can see your information." },
];

function Welcome() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/home", replace: true });
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen surface-calm">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-between px-6 py-12">
        <div className="animate-soft-rise">
          <p className="text-lg font-semibold uppercase tracking-widest text-primary">
            AI Cognitia
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-foreground">
            Your calm helper for every day
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Remember your medicines, appointments and daily routine — with big buttons, clear words
            and reminders you cannot miss.
          </p>

          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex items-start gap-4 rounded-3xl border-2 border-border bg-card p-4 shadow-card"
              >
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <Icon className="size-7" aria-hidden />
                </span>
                <span>
                  <span className="block text-xl font-bold">{title}</span>
                  <span className="block text-lg text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 space-y-4">
          <Button size="lg" asChild>
            <Link to="/auth">Sign in or create account</Link>
          </Button>
          <p className="text-center text-lg text-muted-foreground">
            Made for older adults and their families.
          </p>
        </div>
      </div>
    </div>
  );
}
