import { Check, Clock, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PRIORITY_LABEL,
  formatDay,
  formatTime,
  isDone,
  reminderMeta,
  type Reminder,
} from "@/lib/reminders";

export function ReminderCard({
  reminder,
  onDone,
  onSnooze,
  onEdit,
  onDelete,
}: {
  reminder: Reminder;
  onDone?: (reminder: Reminder) => void;
  onSnooze?: (reminder: Reminder) => void;
  onEdit?: (reminder: Reminder) => void;
  onDelete?: (reminder: Reminder) => void;
}) {
  const meta = reminderMeta(reminder.type);
  const Icon = meta.icon;
  const done = isDone(reminder);

  return (
    <article
      className={`rounded-3xl border-2 p-5 shadow-card transition-colors ${
        done ? "border-border bg-muted" : "border-border bg-card"
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${
            reminder.priority === "high"
              ? "bg-accent text-accent-foreground"
              : "bg-primary-soft text-primary"
          }`}
        >
          <Icon className="size-7" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
            {meta.label}
            {reminder.priority === "high" ? ` • ${PRIORITY_LABEL.high}` : ""}
          </p>
          <h3 className={`text-2xl font-bold ${done ? "line-through opacity-70" : ""}`}>
            {reminder.title}
          </h3>
          <p className="mt-1 text-lg text-muted-foreground">
            {formatDay(reminder.due_at)} at {formatTime(reminder.snoozed_until ?? reminder.due_at)}
          </p>
          {reminder.notes ? <p className="mt-2 text-lg">{reminder.notes}</p> : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {!done && onDone ? (
          <Button variant="success" onClick={() => onDone(reminder)} className="flex-1">
            <Check aria-hidden /> Done
          </Button>
        ) : null}
        {!done && onSnooze ? (
          <Button variant="soft" onClick={() => onSnooze(reminder)} className="flex-1">
            <Clock aria-hidden /> 10 min
          </Button>
        ) : null}
        {onEdit ? (
          <Button
            variant="outline"
            size="icon"
            aria-label={`Change reminder ${reminder.title}`}
            onClick={() => onEdit(reminder)}
          >
            <Pencil aria-hidden />
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            variant="outline"
            size="icon"
            aria-label={`Delete reminder ${reminder.title}`}
            onClick={() => onDelete(reminder)}
          >
            <Trash2 aria-hidden />
          </Button>
        ) : null}
      </div>
    </article>
  );
}
