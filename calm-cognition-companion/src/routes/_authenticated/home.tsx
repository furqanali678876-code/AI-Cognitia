import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BellRing,
  CalendarHeart,
  Droplets,
  MessageCircleHeart,
  Pill,
  Plus,
  Puzzle,
  Sun,
} from "lucide-react";

import { AppShell, EmptyState, Panel } from "@/components/AppShell";
import { ReminderCard } from "@/components/ReminderCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { firstName, useProfile } from "@/lib/profile";
import {
  isDone,
  isToday,
  nextOccurrence,
  useReminders,
  useUpdateReminder,
  type Reminder,
} from "@/lib/reminders";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Today — AI Cognitia" },
      {
        name: "description",
        content: "Your day at a glance: medicines, appointments, water and family reminders.",
      },
      { property: "og:title", content: "Today — AI Cognitia" },
      { property: "og:description", content: "Your day at a glance in AI Cognitia." },
    ],
  }),
  component: HomePage,
});

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function HomePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: reminders, isLoading } = useReminders(user?.id);
  const updateReminder = useUpdateReminder(user?.id);

  const today = (reminders ?? []).filter(isToday);
  const doneToday = today.filter(isDone).length;
  const medsToday = today.filter((r) => r.type === "medication");
  const medsDone = medsToday.filter(isDone).length;
  const upcoming = (reminders ?? [])
    .filter((r) => !isDone(r) && new Date(r.due_at).getTime() > Date.now())
    .slice(0, 3);
  const familyNotes = (reminders ?? []).filter((r) => r.type === "family" && !isDone(r)).slice(0, 2);
  const progress = today.length ? Math.round((doneToday / today.length) * 100) : 0;

  const markDone = (reminder: Reminder) => {
    const next = nextOccurrence(reminder);
    updateReminder.mutate({
      id: reminder.id,
      patch: next
        ? { due_at: next, snoozed_until: null, completed_at: null }
        : { completed_at: new Date().toISOString(), snoozed_until: null },
    });
  };

  const snooze = (reminder: Reminder) =>
    updateReminder.mutate({
      id: reminder.id,
      patch: { snoozed_until: new Date(Date.now() + 10 * 60_000).toISOString() },
    });

  return (
    <AppShell
      title={`${greeting()}, ${firstName(profile)}`}
      subtitle={new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}
    >
      <div className="space-y-5">
        <Panel className="bg-primary text-primary-foreground">
          <p className="text-lg opacity-90">Today's progress</p>
          <p className="mt-1 text-3xl font-bold">
            {doneToday} of {today.length || 0} done
          </p>
          <div
            className="mt-4 h-4 w-full overflow-hidden rounded-full bg-primary-foreground/25"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Tasks finished today"
          >
            <div className="h-full rounded-full bg-primary-foreground" style={{ width: `${progress}%` }} />
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={<Pill className="size-7" aria-hidden />}
            label="Medicines"
            value={medsToday.length ? `${medsDone} of ${medsToday.length} taken` : "None today"}
          />
          <StatCard
            icon={<Droplets className="size-7" aria-hidden />}
            label="Water"
            value={`${today.filter((r) => r.type === "hydration" && isDone(r)).length} glasses`}
          />
        </div>

        <section aria-labelledby="today-heading" className="space-y-4">
          <h2 id="today-heading" className="text-2xl font-bold">
            Today's tasks
          </h2>
          {isLoading ? (
            <Panel className="text-lg text-muted-foreground">Loading your day…</Panel>
          ) : today.length === 0 ? (
            <EmptyState
              icon={<Sun className="size-8" aria-hidden />}
              title="Nothing planned yet"
              message="Add your first reminder and we will ring loudly when it is time."
              action={
                <Button asChild className="mt-2">
                  <Link to="/reminders">
                    <Plus aria-hidden /> Add a reminder
                  </Link>
                </Button>
              }
            />
          ) : (
            today.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onDone={markDone}
                onSnooze={snooze}
              />
            ))
          )}
        </section>

        {upcoming.length > 0 ? (
          <section aria-labelledby="upcoming-heading" className="space-y-4">
            <h2 id="upcoming-heading" className="text-2xl font-bold">
              Coming up next
            </h2>
            {upcoming.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </section>
        ) : null}

        {familyNotes.length > 0 ? (
          <section aria-labelledby="family-heading" className="space-y-4">
            <h2 id="family-heading" className="text-2xl font-bold">
              From your family
            </h2>
            {familyNotes.map((reminder) => (
              <Panel key={reminder.id} className="bg-lavender">
                <p className="flex items-center gap-2 text-lg font-semibold text-lavender-foreground">
                  <CalendarHeart className="size-6" aria-hidden /> {reminder.title}
                </p>
                {reminder.notes ? <p className="mt-2 text-lg">{reminder.notes}</p> : null}
              </Panel>
            ))}
          </section>
        ) : null}

        <section aria-labelledby="quick-heading" className="space-y-4">
          <h2 id="quick-heading" className="text-2xl font-bold">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickAction to="/reminders" icon={<BellRing className="size-8" aria-hidden />} label="Add reminder" />
            <QuickAction
              to="/assistant"
              icon={<MessageCircleHeart className="size-8" aria-hidden />}
              label="Ask assistant"
            />
            <QuickAction to="/games" icon={<Puzzle className="size-8" aria-hidden />} label="Play a game" />
            <QuickAction to="/profile" icon={<Pill className="size-8" aria-hidden />} label="My details" />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Panel className="bg-sky">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-card text-primary">
        {icon}
      </span>
      <p className="mt-3 text-lg font-semibold text-sky-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </Panel>
  );
}

function QuickAction({
  to,
  icon,
  label,
}: {
  to: "/reminders" | "/assistant" | "/games" | "/profile";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-border bg-card p-4 text-center text-xl font-bold shadow-card transition-colors hover:bg-primary-soft"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        {icon}
      </span>
      {label}
    </Link>
  );
}
