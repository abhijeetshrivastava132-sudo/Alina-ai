const DEFAULT_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash"
].filter(Boolean);

function sendJson(res, status, payload) {
  res.setHeader("Content-Type", "application/json");
  return res.status(status).json(payload);
}

function cleanMessage(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 4000);
}

async function callGemini({ apiKey, model, message }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text:
              "You are Alina, a natural human-like AI voice assistant. Match the answer length to the question. For yes/no questions, answer with yes/no plus at most one short reason. For greetings or casual small talk, reply in one short natural line. For simple factual questions, answer in one or two lines. For explanations, tutorials, study, coding, business, health, or serious advice, give a useful structured answer. Do not over-explain unless the user asks for detail. Use simple Hinglish when the user speaks casually; use professional English when needed."
          }
        ]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: message }]
        }
      ],
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 700
      }
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data?.error?.message || `Gemini HTTP ${response.status}`;
    const error = new Error(detail);
    error.status = response.status;
    error.model = model;
    throw error;
  }

  const reply =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join(" ")
      .trim() || "No reply received.";

  return reply;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return sendJson(res, 500, {
      error: "GEMINI_API_KEY is missing",
      detail: "Add GEMINI_API_KEY in Vercel Project Settings > Environment Variables."
    });
  }

  const message = cleanMessage(req.body?.message);

  if (!message) {
    return sendJson(res, 400, { error: "Message is required" });
  }

  const failures = [];

  for (const model of DEFAULT_MODELS) {
    try {
      const reply = await callGemini({ apiKey, model, message });
      return sendJson(res, 200, { reply, model });
    } catch (error) {
      failures.push(`${error.model || model}: ${error.message}`);
    }
  }

  return sendJson(res, 502, {
    error: "Gemini request failed",
    detail: failures[failures.length - 1] || "No Gemini model responded.",
    triedModels: DEFAULT_MODELS
  });
}
