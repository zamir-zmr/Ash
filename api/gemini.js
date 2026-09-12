// api/gemini.js
// Vercel Serverless Function — Gemini API ko securely proxy karta hai.
// API key kabhi bhi frontend ko nahi bheji jaati; yeh sirf server par
// process.env.GEMINI_API_KEY se uthayi jaati hai.

const MODEL = 'gemini-flash-lite-latest';

const SYSTEM_INSTRUCTION = {
  parts: [{
    text:
      'You are an AI assistant exclusively for this restaurant. ' +
      'You only answer questions related to this restaurant — such as our menu items, prices, ingredients, opening and closing times, location, reservations, offers, and any other restaurant-specific details. ' +
      'Do NOT discuss any other topics such as recipes, health advice, cooking techniques, general knowledge, news, or anything unrelated to this restaurant. ' +
      'If asked about anything outside the restaurant scope, politely decline and redirect the user to ask about the restaurant instead.\n\n' +

      'LANGUAGE BEHAVIOR:\n' +
      '1. DEFAULT LANGUAGE: Always respond in English by default.\n' +
      '2. ARABIC SUPPORT: If the user writes in Arabic, respond fully and naturally in Arabic (Modern Standard or Khaleeji/Egyptian dialect as appropriate). Use proper Arabic script. Be warm and hospitable — Arabic speakers expect gracious hospitality language.\n' +
      '3. HINDI SUPPORT: If the user writes in Hindi or Hinglish, respond naturally in Hindi or Hinglish matching their style. Use Devanagari script for pure Hindi, or Roman script for Hinglish.\n' +
      '4. LANGUAGE DETECTION: Detect the user\'s language from their message and mirror it immediately. If the user switches language mid-conversation, switch with them seamlessly.\n' +
      '5. NEVER MIX scripts in a single response unless the user themselves mixed them.\n\n' +

      'TONE & STYLE:\n' +
      '- Be warm, friendly, and professional — like a helpful restaurant host.\n' +
      '- Keep answers concise and clear.\n' +
      '- Use food emojis occasionally to make responses feel welcoming 🍽️.\n\n' +

      'CORE BEHAVIOR:\n' +
      '1. CURRENT DATE & TIME: The current date is September 12, 2026. You can accurately calculate date differences and times.\n' +
      '2. IMAGE INPUTS: Images sent in chat may have been compressed for upload. Analyze them normally and never apologize for image quality unless the user explicitly asks.'
  }]
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: { message: 'Server misconfigured: GEMINI_API_KEY missing' } });
    return;
  }

  const { contents } = req.body || {};
  if (!contents) {
    res.status(400).json({ error: { message: 'Missing "contents" in request body' } });
    return;
  }

  const upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction: SYSTEM_INSTRUCTION })
    });
  } catch (err) {
    res.status(502).json({ error: { message: 'Failed to reach Gemini API', detail: err.message } });
    return;
  }

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    let detail = null;
    try { detail = await upstreamResponse.json(); } catch (_) {}
    res.status(upstreamResponse.status).json({
      error: { message: detail?.error?.message || `Gemini API error: ${upstreamResponse.status}` }
    });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const reader = upstreamResponse.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  } catch (err) {
    // Stream error handled silently
  } finally {
    res.end();
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb'
    }
  }
};

