import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pill, Stethoscope, Sun, Droplets, HeartHandshake, Bell } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
export type ReminderType = Database["public"]["Enums"]["reminder_type"];
export type ReminderPriority = Database["public"]["Enums"]["reminder_priority"];

export const REMINDER_TYPES: {
  value: ReminderType;
  label: string;
  helper: string;
  icon: typeof Pill;
}[] = [
  { value: "medication", label: "Medicine", helper: "Pills, drops or insulin", icon: Pill },
  { value: "appointment", label: "Doctor visit", helper: "Clinic or hospital", icon: Stethoscope },
  { value: "routine", label: "Daily routine", helper: "Meals, walk, rest", icon: Sun },
  { value: "hydration", label: "Drink water", helper: "Stay hydrated", icon: Droplets },
  { value: "family", label: "Family", helper: "Calls and visits", icon: HeartHandshake },
  { value: "custom", label: "Something else", helper: "Anything you choose", icon: Bell },
];

export function reminderMeta(type: ReminderType) {
  return REMINDER_TYPES.find((t) => t.value === type) ?? REMINDER_TYPES[5]!;
}

export const PRIORITY_LABEL: Record<ReminderPriority, string> = {
  low: "Can wait",
  normal: "Normal",
  high: "Very important",
};

export function remindersQueryKey(userId: string | undefined) {
  return ["reminders", userId] as const;
}

export function useReminders(userId: string | undefined) {
  return useQuery({
    queryKey: remindersQueryKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .order("due_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export type ReminderInput = {
  title: string;
  notes: string | null;
  type: ReminderType;
  priority: ReminderPriority;
  due_at: string;
  repeat_rule: string;
};

export function useSaveReminder(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ReminderInput & { id?: string | undefined }) => {
      if (!userId) throw new Error("You need to be signed in.");
      if (id) {
        const { error } = await supabase.from("reminders").update(input).eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("reminders").insert({ ...input, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: remindersQueryKey(userId) }),
  });
}

export function useUpdateReminder(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Database["public"]["Tables"]["reminders"]["Update"];
    }) => {
      const { error } = await supabase.from("reminders").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: remindersQueryKey(userId) }),
  });
}

export function useDeleteReminder(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: remindersQueryKey(userId) }),
  });
}

/** A reminder is "active" when it is not done and its (possibly snoozed) time has arrived. */
export function effectiveTime(reminder: Reminder) {
  return new Date(reminder.snoozed_until ?? reminder.due_at).getTime();
}

export function isDone(reminder: Reminder) {
  return Boolean(reminder.completed_at);
}

export function isToday(reminder: Reminder) {
  const d = new Date(reminder.due_at);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function isDue(reminder: Reminder, now = Date.now()) {
  return !isDone(reminder) && effectiveTime(reminder) <= now;
}

export function nextOccurrence(reminder: Reminder): string | null {
  const base = new Date(reminder.due_at);
  switch (reminder.repeat_rule) {
    case "daily":
      base.setDate(base.getDate() + 1);
      return base.toISOString();
    case "weekly":
      base.setDate(base.getDate() + 7);
      return base.toISOString();
    case "hourly":
      base.setHours(base.getHours() + 1);
      return base.toISOString();
    default:
      return null;
  }
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatDay(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}
