import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Mail, Phone, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AI Cognitia" },
      {
        name: "description",
        content:
          "Sign in or create your AI Cognitia account with email, phone number or Google to start your daily reminders.",
      },
      { property: "og:title", content: "Sign in — AI Cognitia" },
      {
        property: "og:description",
        content: "Sign in to AI Cognitia to see today's reminders and medicines.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "register" | "phone" | "forgot" | "verify-email" | "verify-phone";

const OTP_SECONDS = 120;

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/home", replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("cognitia.remember.email");
      if (saved) setEmail(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const rememberEmail = (value: string) => {
    try {
      if (remember) window.localStorage.setItem("cognitia.remember.email", value);
      else window.localStorage.removeItem("cognitia.remember.email");
    } catch {
      /* ignore */
    }
  };

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "That email or password is not right. Please try again."
          : error.message,
      );
      return;
    }
    rememberEmail(email.trim());
    toast.success("Welcome back.");
  };

  const register = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Please use a password with at least 8 characters.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), phone: phone.trim() },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    rememberEmail(email.trim());
    if (!data.session) {
      setSecondsLeft(OTP_SECONDS);
      setMode("verify-email");
      toast.success("We sent a confirmation email. Please check your inbox.");
    }
  };

  const verifyEmailCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = code.trim().replace(/\s+/g, "");
    if (token.length !== 6) {
      toast.error("Please type the 6 digit code from the email.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: "signup" });
    setBusy(false);
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("expired") || message.includes("not found") || message.includes("invalid")) {
        toast.error(
          "That code no longer works. If you already tapped the link in the email, your email is confirmed — just sign in below. Otherwise ask for a new code.",
        );
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Your email is confirmed.");
  };


  const resendEmail = async () => {
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      setSecondsLeft(OTP_SECONDS);
      toast.success("A new email is on its way.");
    }
  };

  const sendPhoneCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
    setBusy(false);
    if (error) {
      toast.error(
        "Text message sign in is not switched on yet. Please use your email address for now.",
      );
      return;
    }
    setSecondsLeft(OTP_SECONDS);
    setMode("verify-phone");
    toast.success("We sent a 6 digit code to your phone.");
  };

  const verifyPhoneCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: code.trim(),
      type: "sms",
    });
    setBusy(false);
    if (error) toast.error("That code did not work. Please try again.");
    else toast.success("Welcome back.");
  };

  const forgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Check your email for the reset link.");
  };

  const googleSignIn = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setBusy(false);
    if (result.error) {
      toast.error("Google sign in did not work. Please try your email instead.");
      return;
    }
  };

  const back = (to: Mode) => (
    <Button variant="ghost" size="sm" onClick={() => setMode(to)} className="-ml-2">
      <ArrowLeft aria-hidden /> Back
    </Button>
  );

  return (
    <div className="min-h-screen surface-calm px-5 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-card">
            <ShieldCheck className="size-8" aria-hidden />
          </span>
          <h1 className="mt-4 text-3xl font-bold">AI Cognitia</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Your calm daily helper. Big buttons, clear words.
          </p>
        </div>

        <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-card animate-soft-rise">
          {mode === "signin" ? (
            <form className="space-y-5" onSubmit={signIn}>
              <h2 className="text-2xl font-bold">Sign in</h2>
              <Field
                id="email"
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <Field
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
              <label className="flex items-center gap-3 text-lg font-semibold">
                <input
                  type="checkbox"
                  className="size-7 rounded-md border-2 border-input"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me on this device
              </label>
              <Button size="lg" type="submit" disabled={busy}>
                {busy ? "Please wait…" : "Sign in"}
              </Button>
              <Button variant="outline" size="lg" type="button" onClick={googleSignIn} disabled={busy}>
                Continue with Google
              </Button>
              <div className="space-y-2 pt-1">
                <Button variant="ghost" size="lg" type="button" onClick={() => setMode("phone")}>
                  <Phone aria-hidden /> Use my phone number
                </Button>
                <Button variant="link" size="link" type="button" onClick={() => setMode("forgot")}>
                  I forgot my password
                </Button>
                <Button variant="link" size="link" type="button" onClick={() => setMode("register")}>
                  Create a new account
                </Button>
              </div>
            </form>
          ) : null}

          {mode === "register" ? (
            <form className="space-y-5" onSubmit={register}>
              {back("signin")}
              <h2 className="text-2xl font-bold">Create your account</h2>
              <Field id="name" label="Your name" value={fullName} onChange={setFullName} autoComplete="name" />
              <Field
                id="reg-email"
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <Field
                id="reg-phone"
                label="Phone number (optional)"
                type="tel"
                value={phone}
                onChange={setPhone}
                autoComplete="tel"
              />
              <Field
                id="reg-password"
                label="Create a password"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                hint="At least 8 characters."
              />
              <Button size="lg" type="submit" disabled={busy}>
                {busy ? "Please wait…" : "Create account"}
              </Button>
            </form>
          ) : null}

          {mode === "verify-email" ? (
            <form className="space-y-5" onSubmit={verifyEmailCode}>
              {back("signin")}
              <h2 className="text-2xl font-bold">Check your email</h2>
              <p className="text-lg text-muted-foreground">
                We sent a message to <strong>{email}</strong>. Tap the link inside it, or type the 6
                digit code below.
              </p>
              <Field
                id="email-code"
                label="6 digit code"
                value={code}
                onChange={setCode}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
              <Button size="lg" type="submit" disabled={busy}>
                Confirm my email
              </Button>
              <ResendRow secondsLeft={secondsLeft} onResend={resendEmail} busy={busy} />
              <Button
                variant="link"
                size="link"
                type="button"
                onClick={() => {
                  setCode("");
                  setMode("signin");
                }}
              >
                I already confirmed — sign in
              </Button>

            </form>
          ) : null}

          {mode === "phone" ? (
            <form className="space-y-5" onSubmit={sendPhoneCode}>
              {back("signin")}
              <h2 className="text-2xl font-bold">Sign in with your phone</h2>
              <Field
                id="phone"
                label="Phone number"
                type="tel"
                value={phone}
                onChange={setPhone}
                autoComplete="tel"
                hint="Include your country code, for example +1 555 010 2030."
              />
              <Button size="lg" type="submit" disabled={busy}>
                Send me a code
              </Button>
            </form>
          ) : null}

          {mode === "verify-phone" ? (
            <form className="space-y-5" onSubmit={verifyPhoneCode}>
              {back("phone")}
              <h2 className="text-2xl font-bold">Enter your code</h2>
              <p className="text-lg text-muted-foreground">
                We sent 6 digits to <strong>{phone}</strong>.
              </p>
              <Field
                id="phone-code"
                label="6 digit code"
                value={code}
                onChange={setCode}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
              <Button size="lg" type="submit" disabled={busy}>
                Sign in
              </Button>
              <ResendRow
                secondsLeft={secondsLeft}
                busy={busy}
                onResend={async () => {
                  const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
                  if (error) toast.error(error.message);
                  else {
                    setSecondsLeft(OTP_SECONDS);
                    toast.success("New code sent.");
                  }
                }}
              />
            </form>
          ) : null}

          {mode === "forgot" ? (
            <form className="space-y-5" onSubmit={forgotPassword}>
              {back("signin")}
              <h2 className="text-2xl font-bold">Reset your password</h2>
              <p className="text-lg text-muted-foreground">
                Type your email and we will send you a link to choose a new password.
              </p>
              <Field
                id="forgot-email"
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <Button size="lg" type="submit" disabled={busy}>
                <Mail aria-hidden /> Send reset link
              </Button>
            </form>
          ) : null}
        </div>

        <p className="text-center text-lg text-muted-foreground">
          Need help? Ask a family member or caregiver to sit with you.
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  hint,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
} & Omit<React.ComponentProps<"input">, "onChange" | "value" | "id" | "type">) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-lg font-semibold">
        {label}
      </label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
      {hint ? <p className="text-base text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ResendRow({
  secondsLeft,
  onResend,
  busy,
}: {
  secondsLeft: number;
  onResend: () => void | Promise<void>;
  busy: boolean;
}) {
  return (
    <div className="text-center">
      {secondsLeft > 0 ? (
        <p className="text-lg text-muted-foreground">
          You can ask for a new code in {Math.floor(secondsLeft / 60)}:
          {String(secondsLeft % 60).padStart(2, "0")}
        </p>
      ) : (
        <Button variant="link" size="link" type="button" onClick={() => void onResend()} disabled={busy}>
          Send me a new code
        </Button>
      )}
    </div>
  );
}
