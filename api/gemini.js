
// api/gemini.js
const MODEL = 'gemini-3.1-flash-lite';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// Complete System Instruction with plain text stock inventory
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
      '   - Example response: "The item \'Coconut paste\' is missing from your stock list. The estimated market price at Lulu Hypermarket is approximately 3.200 OMR per kg. Would you like me to add it to your inventory?"\n\n' +

      'MULTIMODAL (IMAGE) INSTRUCTIONS:\n' +
      '- In addition to text, you may receive images such as handwritten recipe notes, printed receipts, invoices, or stock lists.\n' +
      '- Extract all relevant ingredients, quantities, prices, and recipe details from the image.\n' +
      '- Map everything extracted into the ASH COSTING JSON structure defined below.\n' +
      '- If the image is unclear or non-bakery related, ask the user in English for clarification.\n\n' +

      'DEFAULT APP STOCK INVENTORY:\n' +
      '1. Sliced irani pistachio - 12 OMR\n' +
      '2. Belgium gourmet - 7.1 OMR\n' +
      '3. Lurpak Butter - 2.055 OMR\n' +
      '4. Oil Minara - 3.46 OMR\n' +
      '5. Sis brown sugar - 1.55 OMR\n' +
      '6. White sugar - 0.412 OMR\n' +
      '7. Flour al kareef - 0.25 OMR\n' +
      '8. Baking Soda - 0.48 OMR\n' +
      '9. Nezo salt - 0.31 OMR\n' +
      '10. Corn starch (daily fresh) - 0.82 OMR\n' +
      '11. Hazelnut paste - 8 OMR\n' +
      '12. Hazelnut - 7.9 OMR\n' +
      '13. Felchin chocolate - 9.5 OMR\n' +
      '14. Coco powder - 8.6 OMR\n' +
      '15. White Chocolate - 6.6 OMR\n' +
      '16. Whipping cream - 2.625 OMR\n' +
      '17. Nutella - 4.32 OMR\n' +
      '18. Milk - 0.55 OMR\n' +
      '19. Nescafe Gold Coffee - 5.065 OMR\n' +
      '20. Callebaut Milk Chocolate - 10 OMR\n' +
      '21. Crunchy For Cloud Cake - 3.455 OMR\n' +
      '22. Baking powder - 0.38 OMR\n' +
      '23. Condensed milk - 1.7 OMR\n' +
      '24. Tea Milk - 0.91 OMR\n' +
      '25. Saffron - 4.5 OMR\n' +
      '26. Brown sugar - 0.3 OMR\n' +
      '27. Salt - 0.625 OMR\n' +
      '28. Oil - 1.3 OMR\n' +
      '29. Belgium garmet Chocolate - 68.8 OMR\n' +
      '30. Eggs - 0.062 OMR\n' +
      '31. Vanilla Essence - 7.875 OMR\n' +
      '32. Chocolate van - 8 OMR\n' +
      '33. Philadelphia - 4.5 OMR\n' +
      '34. Hajdu - 2.2 OMR\n' +
      '35. Mascapone - 3.39 OMR\n' +
      '36. Self Raising Flour - 0.65 OMR\n' +
      '37. Cinnamon powder - 3.5 OMR\n' +
      '38. Date Paste - 4.8 OMR\n' +
      '39. Walnut - 8.5 OMR\n' +
      '40. Almond Slices - 9 OMR\n' +
      '41. Lotus smooth - 5.975 OMR\n' +
      '42. Fleur De Sel Salt - 7.2 OMR\n' +
      '43. Date Cake Sauce - 1.144 OMR\n' +
      '44. Galaxy Milk Chocolate - 0.36 OMR\n' +
      '45. Frozen Strawberry - 0.55 OMR\n' +
      '46. Frozen Raspberry - 2.28 OMR\n' +
      '47. Sauce Japanese cheesecake - 0.516 OMR\n' +
      '48. Strawberry Tart Base - 1.664 OMR\n' +
      '49. Mousseline Cream - 0.969 OMR\n' +
      '50. Nutella Ganash - 0.563 OMR\n' +
      '51. Pistachio slice (Irani) - 11.6 OMR\n' +
      '52. Whole pistachio (Irani) - 7.4 OMR\n' +
      '53. Almond slice (USA) - 4 OMR\n' +
      '54. Almond powder - 4.1 OMR\n' +
      '55. Full almond (USA) - 3.7 OMR\n' +
      '56. Almond powder (USA) - 4.2 OMR\n' +
      '57. Pecan (USA) - 6.9 OMR\n' +
      '58. Hazelnuts (Turkey) - 7.9 OMR\n' +
      '59. Small cashew (Vietnam) - 3.7 OMR\n' +
      '60. Big cashew (India) - 4.8 OMR\n' +
      '61. Golden raisins (Irani) - 1.9 OMR\n' +
      '62. Black raisins (Afghani) - 2.1 OMR\n' +
      '63. Cardamom 8 mm (India) - 14.7 OMR\n' +
      '64. Sunflower seeds - 1.6 OMR\n' +
      '65. Pumpkin seeds - 2.1 OMR\n' +
      '66. Chia seeds (India) - 2.7 OMR\n' +
      '67. Small prawns (Irani) - 2.7 OMR\n' +
      '68. Toffee - 0.902 OMR\n' +
      '69. Glucose - 5.58 OMR\n' +
      '70. Ganash for toffee Cake - 2.761 OMR\n' +
      '71. Capilano Pure Honey 1kg - 4.25 OMR\n' +
      '72. Sliced irani pistachio2 - 12 OMR\n' +
      '73. Zucchini - 0.65 OMR\n' +
      '74. Raisins - 2.4 OMR\n' +
      '75. Kusa (Zucchini) - 0.65 OMR\n' +
      '76. Self rising flour - 0.35 OMR\n' +
      '77. Pistachio slice - 8.5 OMR\n' +
      '78. Candia French whipping cream - 2.5 OMR\n' +
      '79. Nutella chocolate - 4.32 OMR\n' +
      '80. 1 PC Eggs - 0.062 OMR\n' +
      '81. Fresh Carrot - 0.45 OMR\n' +
      '82. Vanilla - 7.875 OMR\n' +
      '83. Oil Noor canola oil - 1.1 OMR\n' +
      '84. Butter almaraai - 4.32 OMR\n' +
      '85. Rose Water - 0.45 OMR\n' +
      '86. Cardamom Powder - 1.2 OMR\n' +
      '87. Crushed Pistachio - 1.85 OMR\n' +
      '88. Coconut Milk - 0.65 OMR\n' +
      '89. Cocoa Powder - 0.79 OMR\n' +
      '90. Red Food Color - 0.215 OMR\n' +
      '91. Orange Blossom Water - 0.54 OMR\n' +
      '92. Glucose Syrup - 2.79 OMR\n' +
      '93. Kiri Cheese - 5.02 OMR\n' +
      '94. Raffaello - 2.12 OMR\n' +
      '95. Dark Chocolate Felchlin - 8.5 OMR\n' +
      '96. Sliced irani indian - 12 OMR\n' +
      '97. White Sugar - 0.4 OMR\n' +
      '98. Desiccated Coconut - 2.95 OMR\n\n' +

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
      
