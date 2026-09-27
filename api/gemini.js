// api/gemini.js
const MODEL = 'gemini-3.1-flash-lite';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

const SYSTEM_INSTRUCTION = {
  parts: [{
    text:
      'You are the exclusive AI assistant for the ASH COSTING application — a commercial bakery inventory, recipe formulation, and costing tool.\n\n' +

      'STRICT SCOPE & LANGUAGE RULES:\n' +
      '- Respond EXCLUSIVELY in English for all interactions.\n' +
      '- You ONLY answer questions related to bakery inventory, recipes, costing, and category management for ASH COSTING.\n' +
      '- When requested, you can provide estimated current market prices for stock items or ingredients, specifically referencing local Omani retail trends (such as Lulu Market) if mentioned by the user.\n' +
      '- Politely decline any unrelated queries, general knowledge questions, app coding/development requests, or general conversational chit-chat with: "I am the exclusive assistant for ASH COSTING. I can only assist with inventory, recipe formulation, and costing tasks for this application."\n\n' +

      'MULTIMODAL (IMAGE) INSTRUCTIONS:\n' +
      '- In addition to text, you may receive images such as handwritten recipe notes, printed receipts, invoices, or stock lists.\n' +
      '- When an image is provided, carefully read it and extract all relevant ingredients, quantities, prices, and recipe details visible in it.\n' +
      '- Map everything you extract from the image into the ASH COSTING JSON structure defined below, using your best judgement for any values that are implied but not explicit (e.g. estimate "total"/"base" as 1000 for standard units unless the image states otherwise).\n' +
      '- If the image is unclear, unrelated to bakery/costing content, or you cannot confidently extract structured data, ask the user in English for clarification instead of guessing wildly.\n\n' +

      'APP DATA STRUCTURE:\n' +
      '- `s` (Stock Items): Array of items with keys `{ name, price, img }`. Price is per Base Unit (1000g/1000ml or 1pc/1kg).\n' +
      '- `r` (Recipes): Array of recipes with keys `{ name, category, items, packaging, marginPct, effortPct, description, img, updatedAt }`.\n' +
      '  - Each item in a recipe has: `{ name, price, total, base, used }`.\n' +
      '- `c` (Categories): Array of strings representing recipe categories.\n\n' +

      'YOUR PRIMARY RESPONSIBILITIES:\n' +
      '1. ALWAYS OUTPUT VALID JSON ONLY when requested to add or update stock items, recipes, or categories from text OR image input.\n' +
      '2. NEVER wrap JSON in markdown backticks (do NOT use ```json ... ```). Output raw JSON text directly.\n' +
      '3. Maintain exact keys required by the app structure:\n' +
      '   - `s`: [{"name": "Item Name", "price": 0.00, "img": ""}]\n' +
      '   - `r`: [{"name": "Recipe Name", "category": "Category Name", "marginPct": 0, "effortPct": 0, "packaging": 0, "updatedAt": 1788254541076, "description": "", "img": "", "items": [{"name": "Ingredient Name", "price": 0.00, "total": 1000, "base": 1000, "used": 100}]}]\n' +
      '   - `c`: ["Category Name"]\n\n' +

      'EXAMPLE JSON FORMAT FOR ADDING ITEMS/RECIPES:\n' +
      '{"s":[{"name":"Sliced irani pistachio","price":12,"img":""}],"r":[{"category":"Tiramisu","effortPct":0,"img":"","items":[{"base":1000,"name":"White sugar","price":0.412,"total":1000,"used":250},{"base":250,"name":"Mascapone","price":3.39,"total":250,"used":500},{"base":1000,"name":"Whipping cream","price":2.625,"total":1000,"used":500},{"base":1000,"name":"1 PC Eggs ","price":0.062,"total":1000,"used":400},{"base":1000,"name":"Gelatin sheets","price":46.9,"total":1000,"used":10}],"marginPct":0,"name":"Classic Tiramisu","packaging":0,"updatedAt":1788254541076,"description":""}],"c":["Tiramisu"]}\n\n' +

      'CASUAL / AMBIGUOUS INPUT HANDLING:\n' +
      'If the user sends greetings or incomplete details, respond in English asking: "What would you like to manage? Item, Recipe, or Category? Please provide the details."'
  }]
};

// Hardcoded replies for quick response (English only)
const QUICK_REPLIES = {
  greetings: {
    patterns: /^(hi|hello|hey|salam|namaste)\b/i,
    reply: () => 'Hello! I am your ASH COSTING assistant. What item, recipe, or category would you like to manage today?'
  },
  thanks: {
    patterns: /^(thanks|thank you|ok|okay|shukran)\s*\.?\s*$/i,
    reply: () => 'You are welcome! Please let me know if you need help with your bakery inventory or recipes.'
  }
};

async function handleTTS(req, res, apiKey) {
  const { text, voice } = req.body || {};
  if (!text) {
    res.status(400).json({ error: { message: 'Missing "text" for TTS' } });
    return;
  }

  const voiceName = voice || 'Ursa';
  const ttsUrl = `https://generativelanguage.googleapis.com/v1/models/${TTS_MODEL}:generateContent?key=${apiKey}`;

  let ttsResponse;
  try {
    ttsResponse = await fetch(ttsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          }
        }
      })
    });
  } catch (err) {
    res.status(502).json({ error: { message: 'Failed to reach Gemini TTS API', detail: err.message } });
    return;
  }

  if (!ttsResponse.ok) {
    let detail = null;
    try { detail = await ttsResponse.json(); } catch (_) {}
    res.status(ttsResponse.status).json({
      error: { message: detail?.error?.message || `Gemini TTS error: ${ttsResponse.status}` }
    });
    return;
  }

  let data;
  try {
    data = await ttsResponse.json();
  } catch (err) {
    res.status(502).json({ error: { message: 'Invalid TTS response from Gemini' } });
    return;
  }

  const audioPart = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  const audioBase64 = audioPart?.inlineData?.data;
  const mimeType = audioPart?.inlineData?.mimeType || 'audio/L16;rate=24000';

  if (!audioBase64) {
    res.status(502).json({ error: { message: 'No audio returned from Gemini TTS' } });
    return;
  }

  res.status(200).json({ audioBase64, mimeType });
}

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

  if (req.body && req.body.action === 'tts') {
    await handleTTS(req, res, apiKey);
    return;
  }

  const { contents } = req.body || {};
  if (!contents) {
    res.status(400).json({ error: { message: 'Missing "contents" in request body' } });
    return;
  }

  const lastMsg = contents?.slice(-1)?.[0];
  const lastText = lastMsg?.parts?.map(p => p.text || '').join(' ').trim() || '';
  const lastHasImage = !!(lastMsg?.parts || []).find(p => p.inline_data || p.inlineData);

  // Quick replies only apply to plain greeting/thanks text turns — never
  // skip the real model call when an image was attached to this turn.
  if (!lastHasImage) {
    for (const key of Object.keys(QUICK_REPLIES)) {
      const rule = QUICK_REPLIES[key];
      if (rule.patterns.test(lastText)) {
        const replyText = rule.reply();
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        const chunk = JSON.stringify({ candidates: [{ content: { parts: [{ text: replyText }] } }] });
        res.write(`data: ${chunk}\n\n`);
        res.end();
        return;
      }
    }
  }

  const upstreamUrl = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

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
  } catch (err) {}
  finally {
    res.end();
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '8mb' } }
};
    
