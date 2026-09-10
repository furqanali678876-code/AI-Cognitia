import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BellRing, Plus, X } from "lucide-react";

import { AppShell, EmptyState, Panel } from "@/components/AppShell";
import { ReminderCard } from "@/components/ReminderCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  PRIORITY_LABEL,
  REMINDER_TYPES,
  isDone,
  nextOccurrence,
  useDeleteReminder,
  useReminders,
  useSaveReminder,
  useUpdateReminder,
  type Reminder,
  type ReminderPriority,
  type ReminderType,
} from "@/lib/reminders";

export const Route = createFileRoute("/_authenticated/reminders")({
  head: () => ({
    meta: [
      { title: "My reminders — AI Cognitia" },
      {
        name: "description",
        content:
          "Create medicine, appointment, water and family reminders that ring loudly until you answer them.",
      },
      { property: "og:title", content: "My reminders — AI Cognitia" },
      {
        property: "og:description",
        content: "Loud, easy reminders for medicines, appointments and daily routine.",
      },
    ],
  }),
  component: RemindersPage,
});

const REPEATS = [
  { value: "none", label: "Just once" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "hourly", label: "Every hour" },
];

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

function RemindersPage() {
  const { user } = useAuth();
  const { data: reminders, isLoading } = useReminders(user?.id);
  const save = useSaveReminder(user?.id);
  const update = useUpdateReminder(user?.id);
  const remove = useDeleteReminder(user?.id);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<ReminderType>("medication");
  const [priority, setPriority] = useState<ReminderPriority>("normal");
  const [when, setWhen] = useState(() => toLocalInput(new Date(Date.now() + 30 * 60_000).toISOString()));
  const [repeat, setRepeat] = useState("none");

  const { open, done } = useMemo(() => {
    const list = reminders ?? [];
    return { open: list.filter((r) => !isDone(r)), done: list.filter(isDone).slice(0, 10) };
  }, [reminders]);

  const startNew = () => {
    setEditing(null);
    setTitle("");
    setNotes("");
    setType("medication");
    setPriority("normal");
    setWhen(toLocalInput(new Date(Date.now() + 30 * 60_000).toISOString()));
    setRepeat("none");
    setFormOpen(true);
  };

  const startEdit = (reminder: Reminder) => {
    setEditing(reminder);
    setTitle(reminder.title);
    setNotes(reminder.notes ?? "");
    setType(reminder.type);
    setPriority(reminder.priority);
    setWhen(toLocalInput(reminder.due_at));
    setRepeat(reminder.repeat_rule);
    setFormOpen(true);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (title.trim().length < 2) {
      toast.error("Please write what you want to remember.");
      return;
    }
    const dueDate = new Date(when);
    if (Number.isNaN(dueDate.getTime())) {
      toast.error("Please choose a date and time.");
      return;
    }
    save.mutate(
      {
        id: editing?.id,
        title: title.trim().slice(0, 120),
        notes: notes.trim() ? notes.trim().slice(0, 500) : null,
        type,
        priority,
        due_at: dueDate.toISOString(),
        repeat_rule: repeat,
      },
      {
        onSuccess: () => {
          toast.success(editing ? "Reminder updated." : "Reminder saved. We will ring on time.");
          setFormOpen(false);
          setEditing(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const markDone = (reminder: Reminder) => {
    const next = nextOccurrence(reminder);
    update.mutate({
      id: reminder.id,
      patch: next
        ? { due_at: next, snoozed_until: null, completed_at: null }
        : { completed_at: new Date().toISOString(), snoozed_until: null },
    });
  };

  return (
    <AppShell
      title="My reminders"
      subtitle="We ring loudly until you press Done."
      action={
        <Button size="icon" aria-label="Add a reminder" onClick={startNew}>
          <Plus aria-hidden />
        </Button>
      }
    >
      <div className="space-y-5">
        {formOpen ? (
          <Panel as="div" className="animate-soft-rise">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{editing ? "Change reminder" : "New reminder"}</h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close reminder form"
                onClick={() => setFormOpen(false)}
              >
                <X aria-hidden />
              </Button>
            </div>

            <form className="mt-4 space-y-5" onSubmit={submit}>
              <fieldset className="space-y-3">
                <legend className="text-lg font-semibold">What kind of reminder?</legend>
                <div className="grid grid-cols-2 gap-3">
                  {REMINDER_TYPES.map((option) => {
                    const Icon = option.icon;
                    const active = type === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setType(option.value)}
                        aria-pressed={active}
                        className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 text-center text-lg font-semibold transition-colors ${
                          active
                            ? "border-primary bg-primary-soft text-primary"
                            : "border-border bg-card text-foreground"
                        }`}
                      >
                        <Icon className="size-7" aria-hidden />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="space-y-2">
                <label htmlFor="title" className="block text-lg font-semibold">
                  What should we remind you about?
                </label>
                <Input
                  id="title"
                  value={title}
                  maxLength={120}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Take blood pressure tablet"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="block text-lg font-semibold">
                  Extra note (optional)
                </label>
                <Textarea
                  id="notes"
                  value={notes}
                  maxLength={500}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="One white tablet after breakfast"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="when" className="block text-lg font-semibold">
                  Date and time
                </label>
                <Input id="when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
              </div>

              <fieldset className="space-y-3">
                <legend className="text-lg font-semibold">How important is it?</legend>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(PRIORITY_LABEL) as ReminderPriority[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={priority === value}
                      onClick={() => setPriority(value)}
                      className={`min-h-14 rounded-2xl border-2 px-2 text-lg font-semibold ${
                        priority === value
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border bg-card"
                      }`}
                    >
                      {PRIORITY_LABEL[value]}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <label htmlFor="repeat" className="block text-lg font-semibold">
                  Repeat
                </label>
                <select
                  id="repeat"
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                  className="min-h-14 w-full rounded-2xl border-2 border-input bg-card px-4 text-lg"
                >
                  {REPEATS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button size="lg" type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : editing ? "Save changes" : "Save reminder"}
              </Button>
            </form>
          </Panel>
        ) : (
          <Button size="lg" onClick={startNew}>
            <Plus aria-hidden /> Add a reminder
          </Button>
        )}

        <section aria-labelledby="open-heading" className="space-y-4">
          <h2 id="open-heading" className="text-2xl font-bold">
            Waiting for you
          </h2>
          {isLoading ? (
            <Panel className="text-lg text-muted-foreground">Loading your reminders…</Panel>
          ) : open.length === 0 ? (
            <EmptyState
              icon={<BellRing className="size-8" aria-hidden />}
              title="No reminders yet"
              message="Add medicines, doctor visits or a glass of water. We will ring loudly at the right time."
            />
          ) : (
            open.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onDone={markDone}
                onSnooze={(r) =>
                  update.mutate({
                    id: r.id,
                    patch: { snoozed_until: new Date(Date.now() + 10 * 60_000).toISOString() },
                  })
                }
                onEdit={startEdit}
                onDelete={(r) => remove.mutate(r.id)}
              />
            ))
          )}
        </section>

        {done.length > 0 ? (
          <section aria-labelledby="done-heading" className="space-y-4">
            <h2 id="done-heading" className="text-2xl font-bold">
              Finished
            </h2>
            {done.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onDelete={(r) => remove.mutate(r.id)}
              />
            ))}
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
