import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Mic, MicOff, Send, Sparkles, Volume2 } from "lucide-react";

import { AppShell, Panel } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { askAssistant } from "@/lib/assistant.functions";
import { useAuth } from "@/lib/auth";
import { speak, useSettings } from "@/lib/settings";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "Assistant — AI Cognitia" },
      {
        name: "description",
        content:
          "Ask the AI Cognitia assistant about your medicines, appointments and daily plan, by voice or by typing.",
      },
      { property: "og:title", content: "Assistant — AI Cognitia" },
      { property: "og:description", content: "A patient assistant that answers in simple words." },
    ],
  }),
  component: AssistantPage,
});

const QUICK_QUESTIONS = [
  "What medicines should I take today?",
  "What is my next appointment?",
  "What do I need to do today?",
  "Have I taken my morning tablets?",
];

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function AssistantPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const ask = useServerFn(askAssistant);
  const [question, setQuestion] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const { data: history } = useQuery({
    queryKey: ["assistant-messages", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assistant_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(60);
      if (error) throw error;
      return data;
    },
  });

  const sendQuestion = useMutation({
    mutationFn: async (text: string) => ask({ data: { question: text } }),
    onSuccess: (result) => {
      setQuestion("");
      void queryClient.invalidateQueries({ queryKey: ["assistant-messages", user?.id] });
      if (settings.speakAloud) speak(result.answer);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, sendQuestion.isPending]);

  const toggleVoice = () => {
    const Ctor = (
      window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      }
    ).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;

    if (!Ctor) {
      toast.error("Voice typing is not available on this device. Please type your question.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setQuestion(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = question.trim();
    if (text.length < 2) {
      toast.error("Please say or type your question.");
      return;
    }
    sendQuestion.mutate(text.slice(0, 500));
  };

  return (
    <AppShell title="Your assistant" subtitle="Ask me anything about your day.">
      <div className="space-y-5">
        <Panel className="bg-lavender">
          <p className="flex items-center gap-2 text-lg font-semibold text-lavender-foreground">
            <Sparkles className="size-6" aria-hidden /> Try asking
          </p>
          <div className="mt-3 space-y-3">
            {QUICK_QUESTIONS.map((q) => (
              <Button
                key={q}
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => sendQuestion.mutate(q)}
                disabled={sendQuestion.isPending}
              >
                {q}
              </Button>
            ))}
          </div>
        </Panel>

        <section aria-label="Conversation" className="space-y-4">
          {(history ?? []).length === 0 ? (
            <Panel className="text-lg text-muted-foreground">
              Your conversation will appear here. Nothing you say is shared with anyone else.
            </Panel>
          ) : null}
          {(history ?? []).map((message) => (
            <div
              key={message.id}
              className={`rounded-3xl border-2 p-4 shadow-soft ${
                message.role === "user"
                  ? "ml-6 border-primary bg-primary-soft"
                  : "mr-6 border-border bg-card"
              }`}
            >
              <p className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
                {message.role === "user" ? "You" : "Assistant"}
              </p>
              <p className="mt-1 text-xl">{message.content}</p>
              {message.role === "assistant" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => speak(message.content)}
                >
                  <Volume2 aria-hidden /> Read aloud
                </Button>
              ) : null}
            </div>
          ))}
          {sendQuestion.isPending ? (
            <Panel className="text-lg text-muted-foreground">Thinking…</Panel>
          ) : null}
          <div ref={endRef} />
        </section>

        <form className="space-y-3" onSubmit={submit}>
          <label htmlFor="question" className="block text-lg font-semibold">
            Your question
          </label>
          <Textarea
            id="question"
            value={question}
            maxLength={500}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What medicines should I take today?"
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant={listening ? "accent" : "outline"}
              onClick={toggleVoice}
              className="flex-1"
              aria-pressed={listening}
            >
              {listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}
              {listening ? "Stop" : "Speak"}
            </Button>
            <Button type="submit" className="flex-1" disabled={sendQuestion.isPending}>
              <Send aria-hidden /> Ask
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
