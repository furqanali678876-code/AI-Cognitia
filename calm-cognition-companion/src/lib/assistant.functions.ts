import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  question: z.string().trim().min(1).max(500),
});

const SYSTEM_PROMPT = `You are AI Cognitia, a calm and patient assistant for older adults, including people living with memory loss or dementia.
Rules:
- Use very simple, short sentences. One idea per sentence.
- Be warm, reassuring and never rushed. Never scold or say "you already asked".
- Keep answers under 70 words.
- When the person asks about medicines, appointments or tasks, answer only from the reminder list you are given. If the list has nothing, say so kindly and suggest adding a reminder.
- For anything medical beyond their reminders, kindly suggest speaking to their doctor or caregiver.`;

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("The assistant is not available right now.");

    const { supabase, userId } = context;

    const { data: reminders } = await supabase
      .from("reminders")
      .select("title, notes, type, due_at, completed_at")
      .is("completed_at", null)
      .order("due_at", { ascending: true })
      .limit(25);

    const remindersText =
      reminders && reminders.length > 0
        ? reminders
            .map(
              (r) =>
                `- ${r.type}: ${r.title}${r.notes ? ` (${r.notes})` : ""} at ${new Date(
                  r.due_at,
                ).toLocaleString()}`,
            )
            .join("\n")
        : "No reminders saved yet.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "system",
            content: `Today is ${new Date().toDateString()}.\nUpcoming reminders for this person:\n${remindersText}`,
          },
          { role: "user", content: data.question },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("The assistant could not answer just now. Please try again in a moment.");
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const answer =
      payload.choices?.[0]?.message?.content?.trim() ??
      "I am sorry, I did not catch that. Could you ask me again?";

    await supabase.from("assistant_messages").insert([
      { user_id: userId, role: "user", content: data.question },
      { user_id: userId, role: "assistant", content: answer },
    ]);

    return { answer };
  });
