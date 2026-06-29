export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "You are Alina, a short, clear, helpful voice assistant. Reply naturally in simple Hinglish when the user speaks casually. Keep answers brief unless detail is needed."
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
            temperature: 0.7,
            maxOutputTokens: 220
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Gemini request failed",
        detail: data?.error?.message || "Unknown Gemini error"
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join(" ")
        .trim() || "No reply received.";

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: "AI request failed",
      detail: error.message
    });
  }
}
