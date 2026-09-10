import { useEffect, useMemo, useState } from "react";
import { AlarmClock, BellRing, Check, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useSettings, speak } from "@/lib/settings";
import { primeAudio, startAlarm, stopAlarm } from "@/lib/alarm-sound";
import {
  formatTime,
  isDue,
  nextOccurrence,
  reminderMeta,
  useReminders,
  useUpdateReminder,
  type Reminder,
} from "@/lib/reminders";

const SNOOZE_CHOICES = [5, 10, 15];

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { data: reminders } = useReminders(user?.id);
  const updateReminder = useUpdateReminder(user?.id);
  const [now, setNow] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const unlock = () => primeAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const active: Reminder | null = useMemo(() => {
    if (!reminders) return null;
    const due = reminders
      .filter((r) => isDue(r, now) && !dismissed.includes(r.id))
      .sort((a, b) => (a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0));
    return due[0] ?? null;
  }, [reminders, now, dismissed]);

  useEffect(() => {
    if (!active) {
      stopAlarm();
      return;
    }
    if (settings.alarmSound) startAlarm({ volume: 0.9, vibrate: settings.vibration });
    if (settings.speakAloud) speak(`Reminder. ${active.title}`);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("AI Cognitia reminder", { body: active.title, requireInteraction: true });
      } catch {
        /* notification is a bonus channel */
      }
    }
    return () => stopAlarm();
  }, [active, settings.alarmSound, settings.vibration, settings.speakAloud]);

  const done = (reminder: Reminder) => {
    const next = nextOccurrence(reminder);
    stopAlarm();
    setDismissed((prev) => [...prev, reminder.id]);
    updateReminder.mutate({
      id: reminder.id,
      patch: next
        ? { due_at: next, snoozed_until: null, completed_at: null }
        : { completed_at: new Date().toISOString(), snoozed_until: null },
    });
  };

  const snooze = (reminder: Reminder, minutes: number) => {
    stopAlarm();
    setDismissed((prev) => [...prev, reminder.id]);
    updateReminder.mutate({
      id: reminder.id,
      patch: { snoozed_until: new Date(Date.now() + minutes * 60_000).toISOString() },
    });
    setTimeout(() => setDismissed((prev) => prev.filter((id) => id !== reminder.id)), 4000);
  };

  return (
    <>
      {children}
      {active ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="alarm-title"
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-primary px-6 py-10 text-primary-foreground animate-soft-rise"
        >
          <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
            <div className="flex size-24 items-center justify-center rounded-full bg-primary-foreground/15 animate-gentle-pulse">
              <BellRing className="size-12" aria-hidden />
            </div>
            <p className="text-xl font-semibold uppercase tracking-wide opacity-90">
              {reminderMeta(active.type).label} reminder
            </p>
            <h1 id="alarm-title" className="text-3xl font-bold">
              {active.title}
            </h1>
            <p className="flex items-center gap-2 text-xl">
              <AlarmClock className="size-6" aria-hidden />
              {formatTime(active.snoozed_until ?? active.due_at)}
            </p>
            {active.notes ? <p className="text-xl opacity-95">{active.notes}</p> : null}
          </div>

          <div className="flex w-full max-w-md flex-col gap-4">
            <Button
              size="lg"
              variant="success"
              className="min-h-20 text-2xl"
              onClick={() => done(active)}
            >
              <Check className="size-8" aria-hidden /> I have done this
            </Button>
            <p className="text-center text-lg opacity-90">Not now? Remind me again in…</p>
            <div className="grid grid-cols-3 gap-3">
              {SNOOZE_CHOICES.map((minutes) => (
                <Button
                  key={minutes}
                  variant="outline"
                  className="min-h-16 flex-col gap-1 border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => snooze(active, minutes)}
                >
                  <Clock className="size-6" aria-hidden />
                  <span className="text-lg">{minutes} min</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
