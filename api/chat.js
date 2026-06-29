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
              "You are Alina, a helpful voice assistant. Reply naturally in simple Hinglish if the user speaks casually. Do not give one-word or ultra-short replies. Give useful answers in 2 to 5 short lines by default. If the user asks for detail, explain properly with practical steps."
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
        temperature: 0.8,
        maxOutputTokens: 900
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
