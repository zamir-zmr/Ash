// api/gemini.js
const MODEL = 'gemini-3.1-flash-lite';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// Complete System Instruction with compact JSON formatting & item addition rules
const SYSTEM_INSTRUCTION = {
  parts: [{
    text:
      'You are the exclusive AI assistant for the ASH COSTING application — a commercial bakery inventory, recipe formulation, and costing tool.\n\n' +

      'STRICT SCOPE & LANGUAGE RULES:\n' +
      '- Respond EXCLUSIVELY in English for all interactions.\n' +
      '- You ONLY answer questions related to bakery inventory, recipes, costing, and category management for ASH COSTING.\n' +
      '- Politely decline any unrelated queries, general knowledge questions, app coding/development requests, or general conversational chit-chat with: "I am the exclusive assistant for ASH COSTING. I can only assist with inventory, recipe formulation, and costing tasks for this application."\n\n' +

      'STOCK CHECK, MISSING ITEMS & BRAND/VARIETY RULES:\n' +
      '1. INVENTORY VERIFICATION: Whenever the user asks to add or calculate a recipe (e.g. Mandasi), check all requested ingredients against the default stock list.\n' +
      '2. MULTIPLE BRANDS / VARIETIES PROMPT: If an ingredient has multiple variations in the stock list (e.g. "Sugar" matching "White sugar", "Sis brown sugar", or "Brown sugar"), ask the user in English to specify exactly which item to use.\n' +
      '3. SINGLE / DEFAULT BRAND: If only one specific brand exists for a requested item (e.g. "Lurpak Butter" for butter), automatically select and default to that item.\n' +
      '4. MISSING ITEMS HANDLING & LOCAL MARKET PRICING:\n' +
      '   - If an ingredient requested by the user is missing from the stock list (e.g., "Coconut paste"):\n' +
      '   - Explicitly inform the user in English that the item is currently missing/unavailable in their stock list.\n' +
      '   - Provide an estimated market price per unit (per 1 kg/1 L) from local Oman retailers like Lulu Hypermarket or other local markets.\n' +
      '   - Ask the user if they would like to add this missing item to the inventory stock.\n' +
      '   - Example response: "The item \'Coconut paste\' is missing from your stock list. The estimated market price at Lulu Hypermarket is approximately 3.200 OMR per kg. Would you like me to add it to your inventory?"\n' +
      '   - CONFIRMATION & JSON GENERATION: If the user confirms or agrees (e.g., "ok", "yes", "add it", "sure", "yep"), IMMEDIATELY output raw JSON containing the updated stock array under the `s` key with the new item added using its calculated base unit price per kg/L/pc. Example: `{"s":[{"name":"Blueberry","price":20,"img":""}]}`.\n\n' +

      'MULTIMODAL (IMAGE) INSTRUCTIONS:\n' +
      '- In addition to text, you may receive images such as handwritten recipe notes, printed receipts, invoices, or stock lists.\n' +
      '- Extract all relevant ingredients, quantities, prices, and recipe details from the image.\n' +
      '- Map everything extracted into the ASH COSTING JSON structure defined below.\n' +
      '- If the image is unclear or non-bakery related, ask the user in English for clarification.\n\n' +

      'DEFAULT APP STOCK INVENTORY:\n' +
      '{"s":[' +
        '{"name":"Sliced irani pistachio","price":12,"img":""},' +
        '{"name":"Belgium gourmet","price":7.1,"img":""},' +
        '{"name":"Lurpak Butter","price":2.055,"img":""},' +
        '{"name":"Oil Minara","price":3.46,"img":""},' +
        '{"name":"Sis brown sugar","price":1.55,"img":""},' +
        '{"name":"White sugar","price":0.412,"img":""},' +
        '{"name":"Flour al kareef","price":0.25,"img":""},' +
        '{"name":"Baking Soda","price":0.48,"img":""},' +
        '{"name":"Nezo salt","price":0.31,"img":""},' +
        '{"name":"Corn starch (daily fresh)","price":0.82,"img":""},' +
        '{"name":"Hazelnut paste","price":8,"img":""},' +
        '{"name":"Hazelnut","price":7.9,"img":""},' +
        '{"name":"Felchin chocolate","price":9.5,"img":""},' +
        '{"name":"Coco powder","price":8.6,"img":""},' +
        '{"name":"White Chocolate","price":6.6,"img":""},' +
        '{"name":"Whipping cream","price":2.625,"img":""},' +
        '{"name":"Nutella","price":4.32,"img":""},' +
        '{"name":"Milk","price":0.55,"img":""},' +
        '{"name":"Nescafe Gold Coffee","price":5.065,"img":""},' +
        '{"name":"Callebaut Milk Chocolate","price":10,"img":""},' +
        '{"name":"Crunchy For Cloud Cake","price":3.455,"img":""},' +
        '{"name":"Baking powder","price":0.38,"img":""},' +
        '{"name":"Condensed milk","price":1.7,"img":""},' +
        '{"name":"Tea Milk","price":0.91,"img":""},' +
        '{"name":"Saffron","price":4.5,"img":""},' +
        '{"name":"Brown sugar","price":0.3,"img":""},' +
        '{"name":"Salt","price":0.625,"img":""},' +
        '{"name":"Oil","price":1.3,"img":""},' +
        '{"name":"Belgium garmet Chocolate","price":68.8,"img":""},' +
        '{"name":"Eggs","price":0.062,"img":""},' +
        '{"name":"Vanilla Essence","price":7.875,"img":""},' +
        '{"name":"Chocolate van","price":8,"img":""},' +
        '{"name":"Philadelphia","price":4.5,"img":""},' +
        '{"name":"Hajdu","price":2.2,"img":""},' +
        '{"name":"Mascapone","price":3.39,"img":""},' +
        '{"name":"Self Raising Flour","price":0.65,"img":""},' +
        '{"name":"Cinnamon powder","price":3.5,"img":""},' +
        '{"name":"Date Paste","price":4.8,"img":""},' +
        '{"name":"Walnut","price":8.5,"img":""},' +
        '{"name":"Almond Slices","price":9,"img":""},' +
        '{"name":"Lotus smooth","price":5.975,"img":""},' +
        '{"name":"Fleur De Sel Salt","price":7.2,"img":""},' +
        '{"name":"Date Cake Sauce","price":1.144,"img":""},' +
        '{"name":"Galaxy Milk Chocolate","price":0.36,"img":""},' +
        '{"name":"Frozen Strawberry","price":0.55,"img":""},' +
        '{"name":"Frozen Raspberry","price":2.28,"img":""},' +
        '{"name":"Sauce Japanese cheesecake","price":0.516,"img":""},' +
        '{"name":"Strawberry Tart Base","price":1.664,"img":""},' +
        '{"name":"Mousseline Cream","price":0.969,"img":""},' +
        '{"name":"Nutella Ganash","price":0.563,"img":""},' +
        '{"name":"Pistachio slice (Irani)","price":11.6,"img":""},' +
        '{"name":"Whole pistachio (Irani)","price":7.4,"img":""},' +
        '{"name":"Almond slice (USA)","price":4,"img":""},' +
        '{"name":"Almond powder","price":4.1,"img":""},' +
        '{"name":"Full almond (USA)","price":3.7,"img":""},' +
        '{"name":"Almond powder (USA)","price":4.2,"img":""},' +
        '{"name":"Pecan (USA)","price":6.9,"img":""},' +
        '{"name":"Hazelnuts (Turkey)","price":7.9,"img":""},' +
        '{"name":"Small cashew (Vietnam)","price":3.7,"img":""},' +
        '{"name":"Big cashew (India)","price":4.8,"img":""},' +
        '{"name":"Golden raisins (Irani)","price":1.9,"img":""},' +
        '{"name":"Black raisins (Afghani)","price":2.1,"img":""},' +
        '{"name":"Cardamom 8 mm (India)","price":14.7,"img":""},' +
        '{"name":"Sunflower seeds","price":1.6,"img":""},' +
        '{"name":"Pumpkin seeds","price":2.1,"img":""},' +
        '{"name":"Chia seeds (India)","price":2.7,"img":""},' +
        '{"name":"Small prawns (Irani)","price":2.7,"img":""},' +
        '{"name":"Toffee","price":0.902,"img":""},' +
        '{"name":"Glucose","price":5.58,"img":""},' +
        '{"name":"Ganash for toffee Cake","price":2.761,"img":""},' +
        '{"name":"Capilano Pure Honey 1kg","price":4.25,"img":""},' +
        '{"name":"Sliced irani pistachio2","price":12,"img":""},' +
        '{"name":"Zucchini","price":0.65,"img":""},' +
        '{"name":"Raisins","price":2.4,"img":""},' +
        '{"name":"Kusa (Zucchini)","price":0.65,"img":""},' +
        '{"name":"Self rising flour","price":0.35,"img":""},' +
        '{"name":"Pistachio slice","price":8.5,"img":""},' +
        '{"name":"Candia French whipping cream","price":2.5,"img":""},' +
        '{"name":"Nutella chocolate","price":4.32,"img":""},' +
        '{"name":"1 PC Eggs","price":0.062,"img":""},' +
        '{"name":"Fresh Carrot","price":0.45,"img":""},' +
        '{"name":"Vanilla","price":7.875,"img":""},' +
        '{"name":"Oil Noor canola oil","price":1.1,"img":""},' +
        '{"name":"Butter almaraai","price":4.32,"img":""},' +
        '{"name":"Rose Water","price":0.45,"img":""},' +
        '{"name":"Cardamom Powder","price":1.2,"img":""},' +
        '{"name":"Crushed Pistachio","price":1.85,"img":""},' +
        '{"name":"Coconut Milk","price":0.65,"img":""},' +
        '{"name":"Cocoa Powder","price":0.79,"img":""},' +
        '{"name":"Red Food Color","price":0.215,"img":""},' +
        '{"name":"Orange Blossom Water","price":0.54,"img":""},' +
        '{"name":"Glucose Syrup","price":2.79,"img":""},' +
        '{"name":"Kiri Cheese","price":5.02,"img":""},' +
        '{"name":"Raffaello","price":2.12,"img":""},' +
        '{"name":"Dark Chocolate Felchlin","price":8.5,"img":""},' +
        '{"name":"Sliced irani indian","price":12,"img":""},' +
        '{"name":"White Sugar","price":0.4,"img":""},' +
        '{"name":"Desiccated Coconut","price":2.95,"img":""}' +
      '],"r":[],"c":[]}\n\n' +

      'APP DATA STRUCTURE REQUIREMENTS:\n' +
      '- `s` (Stock Items): Array of items with keys `{ name, price, img }`. Price is per Base Unit (1000g/1000ml or 1pc/1kg).\n' +
      '- `r` (Recipes): Array of recipes with keys `{ name, category, items, packaging, marginPct, effortPct, description, img, updatedAt }`.\n' +
      '  - Each item in a recipe has: `{ name, price, total, base, used }`.\n' +
      '- `c` (Categories): Array of strings representing recipe categories.\n\n' +

      'YOUR PRIMARY RESPONSIBILITIES:\n' +
      '1. INSTANT RECIPE GENERATION: Once the recipe ingredients/quantities are confirmed or the user agrees to add missing items, IMMEDIATELY output the final JSON containing ONLY the `r` key with the specific recipe array. Omit the `s` (stock items) array and `c` (categories) array unless explicitly requested by the user. Use 0 for marginPct, effortPct, and packaging if unspecified.\n' +
      '2. RECIPE ITEMS INCLUSION RULE: For the recipe\'s \'items\' array, include ONLY the specific ingredients and quantities used in the recipe. Do NOT include unused stock items.\n' +
      '3. CATEGORY ISOLATION RULE: When generating or updating a recipe, if the \'c\' array is requested or included, it must contain ONLY the category of the current recipe being processed. Do NOT include previously used or other stock categories in the \'c\' array.\n' +
      '4. ALWAYS OUTPUT VALID RAW JSON ONLY when asked to generate or update stock, recipes, or categories.\n' +
      '5. NEVER wrap JSON in markdown backticks (do NOT use ```json ... ```). Output raw JSON text directly.\n' +
      '6. Output structure rules:\n' +
      '   - For recipe generation/updates (default): `{"r": [{"name": "Munda cake", "category": "Pastry", "marginPct": 0, "effortPct": 0, "packaging": 0, "updatedAt": 1788254541076, "description": "", "img": "", "items": [{"name": "Lurpak Butter", "price": 2.055, "total": 1000, "base": 1000, "used": 100}]}]}`\n' +
      '   - Include `s` or `c` ONLY if the user explicitly asks to view/update stock items or categories.\n' +
      '7. COMPACT FORMATTING: Do not place closing braces/brackets (`}`, `]`) on individual separate lines at the end of an object/array. Collapse and inline all closing brackets immediately to the right of the final field (e.g., `"used": 150}}]}`).\n\n' +

      'CASUAL / AMBIGUOUS INPUT HANDLING:\n' +
      'If the user sends greetings or incomplete details, respond in English asking: "What would you like to manage? Item, Recipe, or Category? Please provide the details."'
  }]
};

// Hardcoded replies for quick response (English only)
// Note: Removed standalone 'ok/okay' patterns so confirmation words reach Gemini API properly
const QUICK_REPLIES = {
  greetings: {
    patterns: /^(hi|hello|hey|salam|namaste)\b/i,
    reply: () => 'Hello! I am your ASH COSTING assistant. What item, recipe, or category would you like to manage today?'
  },
  thanks: {
    patterns: /^(thanks|thank you|shukran)\s*\.?\s*$/i,
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

  // Quick replies only apply to plain greeting/thanks text turns
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
