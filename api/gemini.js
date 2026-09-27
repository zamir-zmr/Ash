// api/gemini.js
const MODEL = 'gemini-1.5-flash';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

const SYSTEM_INSTRUCTION = {
  parts: [{
    text:
      'You are the core intelligence for ASH COSTING — a commercial bakery inventory, recipe formulation, and costing application.\n\n' +

      'APP DATA STRUCTURE:\n' +
      '- `s` (Stock Items): Array of items with keys `{ name, price, img }`. Price is per Base Unit (1000g/1000ml or 1pc/1kg).\n' +
      '- `r` (Recipes): Array of recipes with keys `{ name, category, items, packaging, marginPct, effortPct, description, img, updatedAt }`.\n' +
      '  - Each item in a recipe has: `{ name, price, total, base, used }`.\n' +
      '- `c` (Categories): Array of strings representing recipe categories.\n\n' +

      'YOUR PRIMARY RESPONSIBILITIES:\n' +
      '1. QUERY & ANALYSIS: Answer user questions about current stock, recipe counts, ingredient prices, and cost breakdowns in the current application state provided in context.\n' +
      '2. INGREDIENT & PRICE SEARCH: When requested to add a new ingredient/item, check market rates (Lulu Oman / local bakery market in OMR) for realistic commercial pricing (per kg/liter/pc).\n' +
      '3. DATA ADDITION & MODIFICATION (JSON CREATION):\n' +
      '   - Whenever the user asks to add or update stock items, recipes, or categories, output the modified or new JSON structure clearly alongside your text explanation.\n' +
      '   - Maintain exact keys:\n' +
      '     `s`: [{"name": "Item Name", "price": 0.00, "img": ""}]\n' +
      '     `r`: [{"name": "Recipe Name", "category": "Category", "marginPct": 0, "effortPct": 0, "packaging": 0, "updatedAt": 1788254541076, "description": "", "items": [{"name": "Item", "price": 0.00, "total": 1000, "base": 1000, "used": 250}]}]\n' +
      '     `c`: ["Category Name"]\n\n' +

      'EXAMPLE JSON FORMAT FOR ADDING ITEMS/RECIPES:\n' +
      '{\n' +
      '  "s": [{"name": "Sliced irani pistachio", "price": 12, "img": ""}],\n' +
      '  "r": [{\n' +
      '    "category": "Tiramisu",\n' +
      '    "name": "Classic Tiramisu",\n' +
      '    "items": [\n' +
      '      {"name": "White sugar", "price": 0.412, "total": 1000, "base": 1000, "used": 250},\n' +
      '      {"name": "Mascapone", "price": 3.39, "total": 250, "base": 250, "used": 500},\n' +
      '      {"name": "Whipping cream", "price": 2.625, "total": 1000, "base": 1000, "used": 500},\n' +
      '      {"name": "1 PC Eggs", "price": 0.062, "total": 1000, "base": 1000, "used": 400},\n' +
      '      {"name": "Gelatin sheets", "price": 46.9, "total": 1000, "base": 1000, "used": 10}\n' +
      '    ],\n' +
      '    "marginPct": 0,\n' +
      '    "effortPct": 0,\n' +
      '    "packaging": 0,\n' +
      '    "updatedAt": 1788254541076,\n' +
      '    "description": ""\n' +
      '  }],\n' +
      '  "c": ["Tiramisu"]\n' +
      '}\n\n' +

      'TONE & BEHAVIOR:\n' +
      '- Professional, precise, calculation-oriented assistant.\n' +
      '- Match the user language (English / Hindi / Hinglish / Arabic).'
  }]
};

const QUICK_REPLIES = {
  greetings: {
    patterns: /^(hi|hello|hey|salam|salaam)\b/i,
    reply: () => 'Hello! Ash Costing AI Assistant here. How can I help you with your recipes, stock, or pricing today?'
  },
  thanks: {
    patterns: /^(thanks|thank you|shukran|ok|okay)\s*\.?\s*$/i,
    reply: () => 'You are welcome! Let me know if you need any other calculations or JSON updates.'
  }
};

async function handleTTS(req, res, apiKey) {
  const { text, voice } = req.body || {};
  if (!text) {
    res.status(400).json({ error: { message: 'Missing "text" for TTS' } });
    return;
  }

  const voiceName = voice || 'Ursa';
  const ttsUrl = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`;

  try {
    const ttsResponse = await fetch(ttsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } }
          }
        }
      })
    });

    if (!ttsResponse.ok) {
      let detail = null;
      try { detail = await ttsResponse.json(); } catch (_) {}
      res.status(ttsResponse.status).json({
        error: { message: detail?.error?.message || `TTS error: ${ttsResponse.status}` }
      });
      return;
    }

    const data = await ttsResponse.json();
    const audioPart = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    const audioBase64 = audioPart?.inlineData?.data;
    const mimeType = audioPart?.inlineData?.mimeType || 'audio/L16;rate=24000';

    if (!audioBase64) {
      res.status(502).json({ error: { message: 'No audio returned' } });
      return;
    }

    res.status(200).json({ audioBase64, mimeType });
  } catch (err) {
    res.status(502).json({ error: { message: 'TTS server failure', detail: err.message } });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: { message: 'GEMINI_API_KEY missing' } });
    return;
  }

  if (req.body && req.body.action === 'tts') {
    await handleTTS(req, res, apiKey);
    return;
  }

  const { contents, appData } = req.body || {};
  if (!contents) {
    res.status(400).json({ error: { message: 'Missing "contents" in request body' } });
    return;
  }

  const lastMsg = contents?.slice(-1)?.[0];
  const lastText = lastMsg?.parts?.map(p => p.text || '').join(' ').trim() || '';

  for (const key of Object.keys(QUICK_REPLIES)) {
    const rule = QUICK_REPLIES[key];
    if (rule.patterns.test(lastText)) {
      const replyText = rule.reply(lastText);
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      const chunk = JSON.stringify({ candidates: [{ content: { parts: [{ text: replyText }] } }] });
      res.write(`data: ${chunk}\n\n`);
      res.end();
      return;
    }
  }

  // Inject current app state context into model payload if supplied by frontend
  let requestContents = [...contents];
  if (appData) {
    const appStateContext = {
      role: 'user',
      parts: [{
        text: `[CURRENT APP DATABASE STATE]\n${JSON.stringify(appData)}`
      }]
    };
    requestContents.unshift(appStateContext);
  }

  const upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: requestContents,
        systemInstruction: SYSTEM_INSTRUCTION
      })
    });

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
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  } catch (err) {
    res.status(502).json({ error: { message: 'Gemini request failed', detail: err.message } });
  } finally {
    res.end();
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '8mb' } }
};
  
