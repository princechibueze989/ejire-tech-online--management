import { createClient } from "npm:@supabase/supabase-js@2";

const appOrigin = Deno.env.get("STUDENT_APP_ORIGIN");
const localOrigins = new Set([
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && (origin === appOrigin || localOrigins.has(origin));
  return {
    ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonError(message: string, status: number, headers: HeadersInit): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const cors = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    if (origin && !cors["Access-Control-Allow-Origin"]) {
      return new Response(null, { status: 403, headers: cors });
    }
    return new Response("ok", { headers: cors });
  }

  if (origin && !cors["Access-Control-Allow-Origin"]) {
    return jsonError("This application origin is not allowed.", 403, cors);
  }
  if (request.method !== "POST") {
    return jsonError("Method not allowed.", 405, cors);
  }

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!authorization?.startsWith("Bearer ")) {
    return jsonError("Sign in with a student account to use the study assistant.", 401, cors);
  }
  if (!supabaseUrl || !supabaseAnonKey || !groqApiKey) {
    return jsonError("The study assistant is not configured yet.", 503, cors);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonError("Your session could not be verified. Please sign in again.", 401, cors);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError || profile?.role !== "student") {
      return jsonError("The study assistant is available to student accounts only.", 403, cors);
    }

    const { data: requestAllowed, error: limitError } = await supabase.rpc("consume_student_ai_request");
    if (limitError) {
      return jsonError("The study assistant is temporarily unavailable. Please try again.", 503, cors);
    }
    if (!requestAllowed) {
      return jsonError("You have reached the study assistant's short-term message limit. Please try again in a minute.", 429, cors);
    }

    const body = await request.json();
    const messages = body?.messages;
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20) {
      return jsonError("Please send between 1 and 20 recent messages.", 400, cors);
    }
    const validMessages = messages.every((message) =>
      message &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      message.content.trim().length > 0 &&
      message.content.length <= 4000
    );
    const totalCharacters = messages.reduce((total, message) =>
      total + (typeof message?.content === "string" ? message.content.length : 0), 0);
    if (!validMessages || totalCharacters > 12000 || messages[messages.length - 1].role !== "user") {
      return jsonError("That message could not be processed.", 400, cors);
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("GROQ_MODEL") || "llama-3.3-70b-versatile",
        stream: true,
        temperature: 0.4,
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content: "You are Ejire Tech's patient study coach. Help students understand technology concepts with clear, concise explanations, examples, and guided questions. When they are stuck, offer a small hint first, then explain step by step. Do not claim access to courses, grades, messages, or personal records unless they include that information in their prompt. Never ask for passwords, API keys, payment details, or other sensitive information. If a request is outside learning support, politely redirect to their assigned instructor.",
          },
          ...messages.map(({ role, content }) => ({ role, content: content.trim() })),
        ],
      }),
      signal: request.signal,
    });

    if (!groqResponse.ok || !groqResponse.body) {
      console.error("Groq chat request failed with status", groqResponse.status);
      return jsonError("The study assistant could not respond right now. Please try again.", 502, cors);
    }

    return new Response(groqResponse.body, {
      headers: {
        ...cors,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return jsonError("The study assistant could not respond right now. Please try again.", 500, cors);
  }
});
