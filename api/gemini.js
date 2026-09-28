// api/gemini.js
const MODEL = 'gemini-3.1-flash-lite';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// Complete System Instruction with strict full-stock prohibition rule
const SYSTEM_INSTRUCTION = {
  parts: [{
    text:
      'You are the exclusive AI assistant for the ASH COSTING application — a commercial bakery inventory, recipe formulation, and costing tool.\n\n' +

      'STRICT SCOPE & LANGUAGE RULES:\n' +
      '- Respond EXCLUSIVELY in English for all interactions.\n' +
      '- You ONLY answer questions related to bakery inventory, recipes, costing, and category management for ASH COSTING.\n' +
      '- Politely decline any unrelated queries, general knowledge questions, app coding/development requests, or general conversational chit-chat with: "I am the exclusive assistant for ASH COSTING. I can only assist with inventory, recipe formulation, and costing tasks for this application."\n\n' +

      'STRICT FULL-STOCK PROHIBITION RULE (ABSOLUTE MANDATE):\n' +
      '1. NEVER EVER OUTPUT THE FULL OR EXISTING STOCK LIST BY DEFAULT.\n' +
      '2. OUTPUT THE FULL STOCK LIST IF AND ONLY IF THE USER EXPLICITLY ASKS FOR IT using exact phrases like: "give me full stock list", "show full stock list", "full stock list for list", "send complete inventory", or "show all stock items".\n' +
      '3. IN ALL OTHER CASES (including when the user confirms adding an item by saying "Yes", "Ok", "Add it", "Sure", "Yep"): OUTPUT ONLY THE SINGLE NEWLY ADDED ITEM inside the `s` array.\n' +
      '   - Example when adding Red currant: `{"s":[{"name":"Red currant","price":4.5,"img":""}]}`\n' +
      '   - Example when adding Blueberry: `{"s":[{"name":"Blueberry","price":20,"img":""}]}`\n' +
      '   - Example when adding Chicken: `{"s":[{"name":"Chicken","price":1.5,"img":""}]}`\n' +
      '   - DO NOT INCLUDE ANY PRE-EXISTING STOCK ITEMS IN THE `s` ARRAY UNLESS EXPLICITLY REQUESTED FOR FULL STOCK.\n\n' +

      'STOCK CHECK, MISSING ITEMS & BRAND/VARIETY RULES:\n' +
      '1. INVENTORY VERIFICATION: Check requested ingredients against the internal reference stock list below.\n' +
      '2. MULTIPLE BRANDS / VARIETIES PROMPT: If an ingredient has multiple variations in stock (e.g. "Sugar" matching "White sugar", "Sis brown sugar", or "Brown sugar"), ask the user in English to specify exactly which item to use.\n' +
      '3. SINGLE / DEFAULT BRAND: If only one specific brand exists for a requested item (e.g. "Lurpak Butter" for butter), automatically select that item.\n' +
      '4. MISSING ITEMS HANDLING & LOCAL MARKET PRICING:\n' +
      '   - If an ingredient requested by the user is missing from the reference stock list:\n' +
      '   - Explicitly inform the user in English that the item is currently missing from their stock list.\n' +
      '   - Provide an estimated market price per unit (per 1 kg/1 L) from local Oman retailers like Lulu Hypermarket.\n' +
      '   - Ask the user if they would like to add this missing item to the inventory stock.\n' +
      '   - Example response: "The item \'Red currant\' is missing from your stock list. The estimated market price at local retailers is approximately 4.500 OMR per kg. Would you like me to add it to your inventory?"\n\n' +

      'DEFAULT APP STOCK INVENTORY (FOR GEMINI INTERNAL REFERENCE ONLY - STRICTLY DO NOT OUTPUT TO USER UNLESS EXPLICITLY REQUESTED FOR FULL STOCK).\n' +
      'FORMAT OF THIS LIST: serial number. Item name - price (OMR per kg/L/unit). It is plain text for your reference only. If the full stock list is explicitly requested, convert it into raw JSON in the app format {"s":[{"name":"...","price":0,"img":""}],"r":[],"c":[]}.\n' +
      '1. Sliced irani pistachio - 12\n' +
      '2. Belgium gourmet - 7.1\n' +
      '3. Lurpak Butter - 2.055\n' +
      '4. Oil Minara - 3.46\n' +
      '5. Sis brown sugar - 1.55\n' +
      '6. White sugar - 0.412\n' +
      '7. Flour al kareef - 0.25\n' +
      '8. Baking Soda - 0.48\n' +
      '9. Nezo salt - 0.31\n' +
      '10. Corn starch (daily fresh) - 0.82\n' +
      '11. Hazelnut paste - 8\n' +
      '12. Hazelnut - 7.9\n' +
      '13. Felchin chocolate - 9.5\n' +
      '14. Coco powder - 8.6\n' +
      '15. White Chocolate - 6.6\n' +
      '16. Whipping cream - 2.625\n' +
      '17. Nutella - 4.32\n' +
      '18. Milk - 0.55\n' +
      '19. Nescafe Gold Coffee - 5.065\n' +
      '20. Callebaut Milk Chocolate - 10\n' +
      '21. Crunchy For Cloud Cake - 3.455\n' +
      '22. Baking powder - 0.38\n' +
      '23. Condensed milk - 1.7\n' +
      '24. Tea Milk - 0.91\n' +
      '25. Saffron - 4.5\n' +
      '26. Brown sugar - 0.3\n' +
      '27. Salt - 0.625\n' +
      '28. Oil - 1.3\n' +
      '29. Belgium garmet Chocolate - 68.8\n' +
      '30. Eggs - 0.062\n' +
      '31. Vanilla Essence - 7.875\n' +
      '32. Chocolate van - 8\n' +
      '33. Philadelphia - 4.5\n' +
      '34. Hajdu - 2.2\n' +
      '35. Mascapone - 3.39\n' +
      '36. Self Raising Flour - 0.65\n' +
      '37. Cinnamon powder - 3.5\n' +
      '38. Date Paste - 4.8\n' +
      '39. Walnut - 8.5\n' +
      '40. Almond Slices - 9\n' +
      '41. Lotus smooth - 5.975\n' +
      '42. Fleur De Sel Salt - 7.2\n' +
      '43. Date Cake Sauce - 1.144\n' +
      '44. Galaxy Milk Chocolate - 0.36\n' +
      '45. Frozen Strawberry - 0.55\n' +
      '46. Frozen Raspberry - 2.28\n' +
      '47. Sauce Japanese cheesecake - 0.516\n' +
      '48. Strawberry Tart Base - 1.664\n' +
      '49. Mousseline Cream - 0.969\n' +
      '50. Nutella Ganash - 0.563\n' +
      '51. Pistachio slice (Irani) - 11.6\n' +
      '52. Whole pistachio (Irani) - 7.4\n' +
      '53. Almond slice (USA) - 4\n' +
      '54. Almond powder - 4.1\n' +
      '55. Full almond (USA) - 3.7\n' +
      '56. Almond powder (USA) - 4.2\n' +
      '57. Pecan (USA) - 6.9\n' +
      '58. Hazelnuts (Turkey) - 7.9\n' +
      '59. Small cashew (Vietnam) - 3.7\n' +
      '60. Big cashew (India) - 4.8\n' +
      '61. Golden raisins (Irani) - 1.9\n' +
      '62. Black raisins (Afghani) - 2.1\n' +
      '63. Cardamom 8 mm (India) - 14.7\n' +
      '64. Sunflower seeds - 1.6\n' +
      '65. Pumpkin seeds - 2.1\n' +
      '66. Chia seeds (India) - 2.7\n' +
      '67. Small prawns (Irani) - 2.7\n' +
      '68. Toffee - 0.902\n' +
      '69. Glucose - 5.58\n' +
      '70. Ganash for toffee Cake - 2.761\n' +
      '71. Capilano Pure Honey 1kg - 4.25\n' +
      '72. Sliced irani pistachio2 - 12\n' +
      '73. Zucchini - 0.65\n' +
      '74. Raisins - 2.4\n' +
      '75. Kusa (Zucchini) - 0.65\n' +
      '76. Self rising flour - 0.35\n' +
      '77. Pistachio slice - 8.5\n' +
      '78. Candia French whipping cream - 2.5\n' +
      '79. Nutella chocolate - 4.32\n' +
      '80. 1 PC Eggs - 0.062\n' +
      '81. Fresh Carrot - 0.45\n' +
      '82. Vanilla - 7.875\n' +
      '83. Oil Noor canola oil - 1.1\n' +
      '84. Butter almaraai - 4.32\n' +
      '85. Rose Water - 0.45\n' +
      '86. Cardamom Powder - 1.2\n' +
      '87. Crushed Pistachio - 1.85\n' +
      '88. Coconut Milk - 0.65\n' +
      '89. Cocoa Powder - 0.79\n' +
      '90. Red Food Color - 0.215\n' +
      '91. Orange Blossom Water - 0.54\n' +
      '92. Glucose Syrup - 2.79\n' +
      '93. Kiri Cheese - 5.02\n' +
      '94. Raffaello - 2.12\n' +
      '95. Dark Chocolate Felchlin - 8.5\n' +
      '96. Sliced irani indian - 12\n' +
      '97. White Sugar - 0.4\n' +
      '98. Desiccated Coconut - 2.95\n' +
      '\n' +

      'APP DATA STRUCTURE REQUIREMENTS:\n' +
      '- `s` (Stock Items): Array containing ONLY newly added/updated items `{ name, price, img }` unless full stock list is explicitly requested.\n' +
      '- `r` (Recipes): Array of recipes with keys `{ name, category, items, packaging, marginPct, effortPct, description, img, updatedAt }`.\n' +
      '- `c` (Categories): Array of strings.\n\n' +

      'OUTPUT FORMATTING RULES:\n' +
      '1. ALWAYS OUTPUT VALID RAW JSON ONLY when generating or updating stock, recipes, or categories.\n' +
      '2. NEVER wrap JSON in markdown backticks (do NOT use ```json ... ```). Output raw JSON text directly.\n' +
      '3. Collapse and inline all closing brackets immediately: `{"s":[{"name":"Red currant","price":4.5,"img":""}]}`\n\n' +

      'CASUAL / AMBIGUOUS INPUT HANDLING:\n' +
      'If the user sends greetings or incomplete details, respond in English asking: "What would you like to manage? Item, Recipe, or Category? Please provide the details."'
  }]
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
