import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Brain, Calculator, Puzzle, Sparkles, X } from "lucide-react";

import { AppShell, EmptyState, Panel } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/games")({
  head: () => ({
    meta: [
      { title: "Brain games — AI Cognitia" },
      {
        name: "description",
        content:
          "Gentle memory and thinking exercises you can play offline, with progress and friendly badges.",
      },
      { property: "og:title", content: "Brain games — AI Cognitia" },
      { property: "og:description", content: "Calm memory and thinking exercises for every day." },
    ],
  }),
  component: GamesPage,
});

type GameKey = "pairs" | "sequence" | "numbers";

const GAMES: { key: GameKey; label: string; blurb: string; icon: typeof Brain }[] = [
  { key: "pairs", label: "Matching pairs", blurb: "Find the two cards that match.", icon: Puzzle },
  { key: "sequence", label: "Remember the order", blurb: "Repeat the colours you see.", icon: Brain },
  { key: "numbers", label: "Easy sums", blurb: "Pick the right answer.", icon: Calculator },
];

function GamesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<GameKey | null>(null);

  const { data: scores } = useQuery({
    queryKey: ["game-scores", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_scores")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const saveScore = useMutation({
    mutationFn: async ({ game, score }: { game: GameKey; score: number }) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("game_scores")
        .insert({ user_id: user.id, game_key: game, score });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["game-scores", user?.id] }),
  });

  const stats = useMemo(() => {
    const list = scores ?? [];
    const plays = list.length;
    const best = list.reduce((max, row) => Math.max(max, row.score ?? 0), 0);
    const todayPlays = list.filter(
      (row) => new Date(row.created_at).toDateString() === new Date().toDateString(),
    ).length;
    return { plays, best, todayPlays };
  }, [scores]);

  const badges = [
    { label: "First game", earned: stats.plays >= 1 },
    { label: "Five games", earned: stats.plays >= 5 },
    { label: "Twenty games", earned: stats.plays >= 20 },
    { label: "Played today", earned: stats.todayPlays >= 1 },
  ];

  return (
    <AppShell title="Brain games" subtitle="A few calm minutes, whenever you like.">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Panel className="bg-sky">
            <p className="text-lg font-semibold text-sky-foreground">Games played</p>
            <p className="text-3xl font-bold">{stats.plays}</p>
          </Panel>
          <Panel className="bg-lavender">
            <p className="text-lg font-semibold text-lavender-foreground">Best score</p>
            <p className="text-3xl font-bold">{stats.best}</p>
          </Panel>
        </div>

        {active ? (
          <Panel className="animate-soft-rise">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {GAMES.find((g) => g.key === active)?.label}
              </h2>
              <Button variant="ghost" size="icon" aria-label="Close game" onClick={() => setActive(null)}>
                <X aria-hidden />
              </Button>
            </div>
            <div className="mt-4">
              {active === "pairs" ? (
                <PairsGame onFinish={(score) => saveScore.mutate({ game: "pairs", score })} />
              ) : null}
              {active === "sequence" ? (
                <SequenceGame onFinish={(score) => saveScore.mutate({ game: "sequence", score })} />
              ) : null}
              {active === "numbers" ? (
                <NumbersGame onFinish={(score) => saveScore.mutate({ game: "numbers", score })} />
              ) : null}
            </div>
          </Panel>
        ) : (
          <section aria-labelledby="games-heading" className="space-y-4">
            <h2 id="games-heading" className="text-2xl font-bold">
              Choose a game
            </h2>
            {GAMES.map((game) => {
              const Icon = game.icon;
              return (
                <button
                  key={game.key}
                  type="button"
                  onClick={() => setActive(game.key)}
                  className="flex w-full items-center gap-4 rounded-3xl border-2 border-border bg-card p-5 text-left shadow-card transition-colors hover:bg-primary-soft"
                >
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <Icon className="size-7" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-2xl font-bold">{game.label}</span>
                    <span className="block text-lg text-muted-foreground">{game.blurb}</span>
                  </span>
                </button>
              );
            })}
          </section>
        )}

        <section aria-labelledby="badges-heading" className="space-y-4">
          <h2 id="badges-heading" className="text-2xl font-bold">
            Your badges
          </h2>
          {stats.plays === 0 ? (
            <EmptyState
              icon={<Sparkles className="size-8" aria-hidden />}
              title="No badges yet"
              message="Play one game today and your first badge appears here."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {badges.map((badge) => (
                <Panel
                  key={badge.label}
                  className={badge.earned ? "bg-success text-success-foreground" : "bg-muted"}
                >
                  <Award className="size-8" aria-hidden />
                  <p className="mt-2 text-lg font-bold">{badge.label}</p>
                  <p className="text-base">{badge.earned ? "Earned" : "Not yet"}</p>
                </Panel>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

const PAIR_ICONS = ["🌻", "🐦", "🍎", "🌙", "🚲", "☕"];

function PairsGame({ onFinish }: { onFinish: (score: number) => void }) {
  const [deck, setDeck] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const start = () => {
    const cards = [...PAIR_ICONS, ...PAIR_ICONS]
      .map((icon) => ({ icon, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((c) => c.icon);
    setDeck(cards);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  };

  useEffect(() => {
    start();
  }, []);

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped as [number, number];
    const timer = setTimeout(() => {
      if (deck[a] === deck[b]) setMatched((prev) => [...prev, a, b]);
      setFlipped([]);
    }, 700);
    return () => clearTimeout(timer);
  }, [flipped, deck]);

  const complete = deck.length > 0 && matched.length === deck.length;

  useEffect(() => {
    if (complete) onFinish(Math.max(10, 100 - moves * 4));
  }, [complete]);

  return (
    <div className="space-y-4">
      <p className="text-lg text-muted-foreground">Turns used: {moves}</p>
      <div className="grid grid-cols-3 gap-3">
        {deck.map((icon, index) => {
          const shown = flipped.includes(index) || matched.includes(index);
          return (
            <button
              key={index}
              type="button"
              aria-label={shown ? `Card showing ${icon}` : "Hidden card"}
              onClick={() => {
                if (shown || flipped.length === 2) return;
                setFlipped((prev) => [...prev, index]);
                if (flipped.length === 1) setMoves((m) => m + 1);
              }}
              className={`flex min-h-24 items-center justify-center rounded-2xl border-2 text-4xl transition-colors ${
                shown ? "border-primary bg-primary-soft" : "border-border bg-muted"
              }`}
            >
              {shown ? icon : ""}
            </button>
          );
        })}
      </div>
      {complete ? (
        <Panel className="bg-success text-success-foreground">
          <p className="text-xl font-bold">Well done! All pairs found.</p>
          <Button variant="soft" className="mt-3" onClick={start}>
            Play again
          </Button>
        </Panel>
      ) : null}
    </div>
  );
}

const SEQUENCE_COLORS = [
  { label: "Blue", className: "bg-primary text-primary-foreground" },
  { label: "Lavender", className: "bg-lavender text-lavender-foreground" },
  { label: "Sky", className: "bg-sky text-sky-foreground" },
  { label: "Purple", className: "bg-accent text-accent-foreground" },
];

function SequenceGame({ onFinish }: { onFinish: (score: number) => void }) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [showIndex, setShowIndex] = useState<number | null>(null);
  const [showing, setShowing] = useState(false);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("Press Start to begin.");

  const playSequence = (seq: number[]) => {
    setShowing(true);
    setStep(0);
    seq.forEach((value, i) => {
      setTimeout(() => setShowIndex(value), i * 900);
      setTimeout(() => setShowIndex(null), i * 900 + 550);
    });
    setTimeout(() => {
      setShowing(false);
      setMessage("Now press the colours in the same order.");
    }, seq.length * 900);
  };

  const start = () => {
    const seq = [Math.floor(Math.random() * 4)];
    setSequence(seq);
    setMessage("Watch carefully…");
    playSequence(seq);
  };

  const press = (index: number) => {
    if (showing || sequence.length === 0) return;
    if (sequence[step] === index) {
      if (step + 1 === sequence.length) {
        const next = [...sequence, Math.floor(Math.random() * 4)];
        setMessage("Correct! One more colour.");
        setSequence(next);
        setTimeout(() => playSequence(next), 800);
      } else {
        setStep(step + 1);
      }
    } else {
      setMessage(`Good try. You remembered ${sequence.length - 1} colours.`);
      onFinish((sequence.length - 1) * 10);
      setSequence([]);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xl">{message}</p>
      <div className="grid grid-cols-2 gap-4">
        {SEQUENCE_COLORS.map((color, index) => (
          <button
            key={color.label}
            type="button"
            onClick={() => press(index)}
            className={`min-h-28 rounded-2xl border-2 border-border text-xl font-bold transition-opacity ${color.className} ${
              showIndex === index ? "opacity-100" : "opacity-70"
            }`}
          >
            {color.label}
          </button>
        ))}
      </div>
      <Button variant="soft" onClick={start} disabled={showing}>
        {sequence.length ? "Start again" : "Start"}
      </Button>
    </div>
  );
}

function makeSum() {
  const a = Math.floor(Math.random() * 12) + 1;
  const b = Math.floor(Math.random() * 12) + 1;
  const answer = a + b;
  const options = new Set<number>([answer]);
  while (options.size < 3) options.add(Math.max(1, answer + Math.floor(Math.random() * 9) - 4));
  return {
    a,
    b,
    answer,
    options: [...options].sort(() => Math.random() - 0.5),
  };
}

function NumbersGame({ onFinish }: { onFinish: (score: number) => void }) {
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [sum, setSum] = useState<ReturnType<typeof makeSum> | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSum(makeSum());
  }, []);

  if (!sum) return null;

  const answer = (value: number) => {
    const right = value === sum.answer;
    setMessage(right ? "That's right!" : `The answer was ${sum.answer}.`);
    const nextCorrect = right ? correct + 1 : correct;
    setCorrect(nextCorrect);
    if (round === 5) {
      onFinish(nextCorrect * 20);
      setMessage(`Finished. You got ${nextCorrect} out of 5.`);
      setRound(1);
      setCorrect(0);
      setTimeout(() => setSum(makeSum()), 1200);
      return;
    }
    setRound(round + 1);
    setTimeout(() => setSum(makeSum()), 900);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg text-muted-foreground">Question {round} of 5</p>
      <p className="text-4xl font-bold">
        {sum.a} + {sum.b} = ?
      </p>
      <div className="grid grid-cols-3 gap-3">
        {sum.options.map((option) => (
          <Button key={option} variant="outline" onClick={() => answer(option)}>
            {option}
          </Button>
        ))}
      </div>
      {message ? <p className="text-xl font-semibold">{message}</p> : null}
    </div>
  );
}
