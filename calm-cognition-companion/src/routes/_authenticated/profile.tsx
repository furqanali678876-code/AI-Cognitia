import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, ShieldCheck } from "lucide-react";

import { AppShell, Panel } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useProfile, useUpdateProfile } from "@/lib/profile";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile — AI Cognitia" },
      {
        name: "description",
        content:
          "Your details, emergency contacts, caregiver information and how reminders should look and sound.",
      },
      { property: "og:title", content: "My profile — AI Cognitia" },
      { property: "og:description", content: "Your details, contacts and reminder settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile(user?.id);
  const updateProfile = useUpdateProfile(user?.id);
  const { settings, update } = useSettings();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    caregiver_name: "",
    caregiver_phone: "",
    medical_notes: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      emergency_contact_name: profile.emergency_contact_name ?? "",
      emergency_contact_phone: profile.emergency_contact_phone ?? "",
      caregiver_name: profile.caregiver_name ?? "",
      caregiver_phone: profile.caregiver_phone ?? "",
      medical_notes: profile.medical_notes ?? "",
    });
  }, [profile]);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    updateProfile.mutate(
      {
        full_name: form.full_name.trim().slice(0, 120) || null,
        phone: form.phone.trim().slice(0, 30) || null,
        emergency_contact_name: form.emergency_contact_name.trim().slice(0, 120) || null,
        emergency_contact_phone: form.emergency_contact_phone.trim().slice(0, 30) || null,
        caregiver_name: form.caregiver_name.trim().slice(0, 120) || null,
        caregiver_phone: form.caregiver_phone.trim().slice(0, 30) || null,
        medical_notes: form.medical_notes.trim().slice(0, 1000) || null,
      },
      {
        onSuccess: () => toast.success("Your details are saved."),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell title="My profile" subtitle="Your details and how the app should behave.">
      <form className="space-y-5" onSubmit={save}>
        <Panel>
          <h2 className="text-2xl font-bold">About me</h2>
          <div className="mt-4 space-y-4">
            <Labelled id="full_name" label="My name">
              <Input id="full_name" maxLength={120} {...field("full_name")} />
            </Labelled>
            <Labelled id="phone" label="My phone number">
              <Input id="phone" type="tel" maxLength={30} {...field("phone")} />
            </Labelled>
            <p className="text-lg text-muted-foreground">Signed in as {user?.email}</p>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-2xl font-bold">Emergency contact</h2>
          <div className="mt-4 space-y-4">
            <Labelled id="emergency_contact_name" label="Name">
              <Input id="emergency_contact_name" maxLength={120} {...field("emergency_contact_name")} />
            </Labelled>
            <Labelled id="emergency_contact_phone" label="Phone number">
              <Input
                id="emergency_contact_phone"
                type="tel"
                maxLength={30}
                {...field("emergency_contact_phone")}
              />
            </Labelled>
            {form.emergency_contact_phone ? (
              <Button asChild variant="accent">
                <a href={`tel:${form.emergency_contact_phone}`}>Call now</a>
              </Button>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-2xl font-bold">My carer</h2>
          <div className="mt-4 space-y-4">
            <Labelled id="caregiver_name" label="Name">
              <Input id="caregiver_name" maxLength={120} {...field("caregiver_name")} />
            </Labelled>
            <Labelled id="caregiver_phone" label="Phone number">
              <Input id="caregiver_phone" type="tel" maxLength={30} {...field("caregiver_phone")} />
            </Labelled>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-2xl font-bold">Health notes</h2>
          <p className="mt-1 text-lg text-muted-foreground">
            Medicines, allergies or anything a helper should know.
          </p>
          <div className="mt-4">
            <Textarea id="medical_notes" maxLength={1000} {...field("medical_notes")} />
          </div>
        </Panel>

        <Button size="lg" type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving…" : "Save my details"}
        </Button>
      </form>

      <Panel className="mt-5">
        <h2 className="text-2xl font-bold">How the app looks and sounds</h2>
        <div className="mt-4 space-y-3">
          <Toggle
            label="Bigger text"
            description="Make all words larger."
            checked={settings.largeText}
            onChange={(value) => update({ largeText: value })}
          />
          <Toggle
            label="Stronger contrast"
            description="Darker text on plain backgrounds."
            checked={settings.highContrast}
            onChange={(value) => update({ highContrast: value })}
          />
          <Toggle
            label="Alarm sound"
            description="Play a loud chime for reminders."
            checked={settings.alarmSound}
            onChange={(value) => update({ alarmSound: value })}
          />
          <Toggle
            label="Vibration"
            description="Buzz when a reminder rings."
            checked={settings.vibration}
            onChange={(value) => update({ vibration: value })}
          />
          <Toggle
            label="Read answers aloud"
            description="The assistant speaks its replies."
            checked={settings.speakAloud}
            onChange={(value) => update({ speakAloud: value })}
          />
        </div>
      </Panel>

      <Panel className="mt-5">
        <p className="flex items-center gap-2 text-lg text-muted-foreground">
          <ShieldCheck className="size-6" aria-hidden /> Only you can see your information.
        </p>
        <Button variant="outline" size="lg" className="mt-4" onClick={signOut}>
          <LogOut aria-hidden /> Sign out
        </Button>
      </Panel>
    </AppShell>
  );
}

function Labelled({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-lg font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-border bg-card p-4 text-left"
    >
      <span>
        <span className="block text-xl font-semibold">{label}</span>
        <span className="block text-base text-muted-foreground">{description}</span>
      </span>
      <span
        className={`flex h-9 w-16 shrink-0 items-center rounded-full p-1 transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`size-7 rounded-full bg-card shadow-soft transition-transform ${
            checked ? "translate-x-7" : ""
          }`}
        />
      </span>
    </button>
  );
}
