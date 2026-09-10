import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — AI Cognitia" },
      { name: "description", content: "Set a new password for your AI Cognitia account." },
      { property: "og:title", content: "Choose a new password — AI Cognitia" },
      { property: "og:description", content: "Set a new password for your AI Cognitia account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Please use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords are not the same.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Your new password is saved.");
    void navigate({ to: "/home", replace: true });
  };

  return (
    <div className="min-h-screen surface-calm px-6 py-12">
      <div className="mx-auto max-w-lg rounded-3xl border-2 border-border bg-card p-6 shadow-card">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <KeyRound className="size-8" aria-hidden />
        </span>
        <h1 className="mt-4 text-3xl font-bold">Choose a new password</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Pick something you can remember, at least 8 characters.
        </p>
        <form className="mt-6 space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <label htmlFor="new-password" className="text-lg font-semibold">
              New password
            </label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-lg font-semibold">
              Type it again
            </label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <Button size="lg" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save new password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
