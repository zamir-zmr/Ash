// api/gemini.js
const MODEL = 'gemini-3.1-flash-lite';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// Complete System Instruction with strict trigger phrases for full stock output
const SYSTEM_INSTRUCTION = {
  parts: [{
    text:
      'You are the exclusive AI assistant for the ASH COSTING application — a commercial bakery inventory, recipe formulation, and costing tool.\n\n' +

      'STRICT SCOPE & LANGUAGE RULES:\n' +
      '- Respond EXCLUSIVELY in English for all interactions.\n' +
      '- You ONLY answer questions related to bakery inventory, recipes, costing, and category management for ASH COSTING.\n' +
      '- Politely decline any unrelated queries, general knowledge questions, app coding/development requests, or general conversational chit-chat with: "I am the exclusive assistant for ASH COSTING. I can only assist with inventory, recipe formulation, and costing tasks for this application."\n\n' +

      'STRICT FULL-STOCK JSON OUTPUT TRIGGER RULES (ABSOLUTE MANDATE):\n' +
      '1. DEFAULT BEHAVIOR: NEVER EVER OUTPUT THE FULL OR EXISTING STOCK LIST BY DEFAULT.\n' +
      '2. YOU MUST OUTPUT THE COMPLETE STOCK LIST JSON IF AND ONLY IF THE USER SAYS EXACTLY ONE OF THE FOLLOWING PHRASES:\n' +
      '   - "give me full stock JSON"\n' +
      '   - "Full item list in JSON"\n' +
      '   - "Full JSON item"\n' +
      '   - "Full stock JSON"\n' +
      '   - "Full stock in JSON"\n' +
      '   - "phool stock list for list"\n' +
      '3. IN ALL OTHER SCENARIOS (including when the user confirms adding an item by saying "Yes", "Ok", "Add it", "Sure", "Yep"):\n' +
      '   - OUTPUT ONLY THE SINGLE NEWLY ADDED ITEM inside the `s` array.\n' +
      '   - Example when adding Red currant: `{"s":[{"name":"Red currant","price":4.5,"img":""}]}`\n' +
      '   - Example when adding Blueberry: `{"s":[{"name":"Blueberry","price":20,"img":""}]}`\n' +
      '   - Example when adding Chicken: `{"s":[{"name":"Chicken","price":1.5,"img":""}]}`\n' +
      '   - ABSOLUTELY DO NOT INCLUDE ANY PRE-EXISTING STOCK ITEMS IN THE `s` ARRAY UNLESS EXPLICITLY TRIGGERED BY THE STRICT PHRASES ABOVE.\n\n' +

      'CRITICAL SELF-CHECK BEFORE EVERY JSON OUTPUT (MANDATORY, NO EXCEPTIONS):\n' +
      '   - Before outputting any JSON, silently check: did the user\'s most recent message contain one of the exact full-stock trigger phrases listed above, word-for-word?\n' +
      '   - IF NO: the `s` array MUST contain EXACTLY ONE item (the single item just being added or updated) — NEVER more than one item, and NEVER any of the pre-existing/default inventory items (Sliced irani pistachio, Belgium gourmet, Lurpak Butter, Oil Minara, etc.) unless that exact item is the one being added right now.\n' +
      '   - IF YES: output the complete stock list as raw JSON, built from the numbered DEFAULT APP STOCK INVENTORY list below (same names, same prices, same order).\n' +
      '   - A reply like "Yes", "Ok", "Add it", "Sure", or "Yep" confirming a single addition is NEVER a full-stock trigger phrase, even if it follows a question about adding an item — it must ALWAYS produce a single-item `s` array only.\n' +
      '   - If you find yourself about to output more than one item in the `s` array without the exact trigger phrase, STOP and output only the single newly added/confirmed item instead. This is a critical error to avoid.\n\n' +

      'STOCK CHECK, MISSING ITEMS & BRAND/VARIETY RULES:\n' +
      '1. INVENTORY VERIFICATION: Check requested ingredients against the internal reference stock list below.\n' +
      '2. MULTIPLE BRANDS / VARIETIES PROMPT: If an ingredient has multiple variations in stock (e.g. "Sugar" matching "White sugar", "Sis brown sugar", or "Brown sugar"), ask the user in English to specify exactly which item to use.\n' +
      '3. SINGLE / DEFAULT BRAND: If only one specific brand exists for a requested item (e.g. "Lurpak Butter" for butter), automatically select that item.\n' +
      '4. MISSING ITEMS HANDLING & LOCAL MARKET PRICING:\n' +
      '   - If an ingredient requested by the user is missing from the reference stock list:\n' +
      '   - Explicitly inform the user in English that the item is currently missing from their stock list.\n' +
      '   - Provide an estimated market price per unit (per 1 kg/1 L) from local Oman retailers like Lulu Hypermarket.\n' +
      '   - Ask the user if they would like to add this missing item to the inventory stock.\n' +
      '   - Example response: "The item \'Red currant\' is missing from your stock list. The estimated market price at local retailers is approximately 4.500 OMR per kg. Would you like me to add it to your inventory?"\n' +
      '5. RECIPE + MISSING ITEM COMBINED CONFIRMATION (CRITICAL — DO NOT FORGET THE RECIPE, DO NOT MIX UP ITEMS):\n' +
      '   - If the user originally asked to add/create a RECIPE, and that recipe uses an ingredient missing from stock, and you asked whether to add the missing item, and the user then confirms with "Yes"/"Ok"/"Add it"/"Sure"/"Yep":\n' +
      '   - You MUST output BOTH in the SAME JSON response: (a) the new item in the `s` array, AND (b) the complete recipe the user originally asked for in the `r` array, using that newly added item among its `items`.\n' +
      '   - NEVER output only the `s` array in this situation and drop the recipe — the recipe the user asked for must always be created once its missing ingredient is confirmed added.\n' +
      '   - USE ONLY THE MOST RECENT RECIPE REQUEST AND MOST RECENT MISSING ITEM FROM THIS CONVERSATION — the one from the user\'s latest "Add recipe..." message and your immediately preceding "is missing from your stock list" question. NEVER reuse an item name, price, or recipe from an earlier exchange, an older example, or a previous recipe discussed earlier in the conversation. Every "Ok"/"Yes" confirmation refers ONLY to the single missing-item question that came directly before it — nothing older.\n' +
      '   - Before outputting, double-check: does the item name in your `s` array exactly match the ingredient name from your own immediately preceding "is missing from your stock list" message? Does the recipe name/category/items in your `r` array exactly match the user\'s most recent "Add recipe..." message? If either does not match, you have used stale/wrong data — correct it before responding.\n' +
      '   - FORMAT TEMPLATE ONLY (placeholder names — DO NOT copy these literal words into any real answer, they are structure examples only): if a recipe called <RECIPE_NAME> in category <CATEGORY> needs missing item <ITEM_NAME> at quantity <QTY> <UNIT>, and the user confirms adding it, the JSON shape is: `{"s":[{"name":"<ITEM_NAME>","price":<PRICE>,"img":""}],"r":[{"name":"<RECIPE_NAME>","category":"<CATEGORY>","items":[{"name":"<ITEM_NAME>","qty":<QTY>,"unit":"<UNIT>"}],"packaging":"","marginPct":0,"effortPct":0,"description":"","img":"","updatedAt":""}],"c":[]}`. Replace every <PLACEHOLDER> above with the REAL item/recipe name, price, quantity, unit and category taken from the CURRENT conversation turn only — never with "ladyfingers", "Martha cake", "tuti", or any other wording that appears in these instructions themselves. If your output contains any word from this instructions text that the user did not actually type in this conversation, that is an error — remove it and use the real values instead.\n\n' +
      'DEFAULT APP STOCK INVENTORY — PLAIN NUMBERED LIST (Serial No. | Item Name | Price per 1 kg/1 L in OMR). FOR INTERNAL REFERENCE ONLY — DO NOT PRINT THIS LIST TO THE USER UNLESS A STRICT FULL-STOCK TRIGGER PHRASE IS MATCHED. When (and only when) a trigger phrase is matched, convert this list into raw JSON in exactly this shape: {"s":[{"name":"<Item Name>","price":<Price>,"img":""}, ...],"r":[],"c":[]} keeping the same order and the same names/prices as this list, with no markdown backticks:\n' +
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
      '- `s` (Stock Items): Array containing ONLY newly added/updated items `{ name, price, img }` unless explicitly triggered by one of the strict full stock phrases.\n' +
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

// ---------------------------------------------------------------------------
// DYNAMIC GROUND-TRUTH EXTRACTION
// The small/lite model sometimes fails to track which item was actually
// discussed and repeats an older item name from earlier in the chat (or even
// from the instructions' own examples). To make this bulletproof, we
// programmatically scan the real conversation history sent by the client and
// extract the EXACT missing-item name/price and the EXACT original recipe
// request text ourselves — then hand those facts to the model as a
// non-negotiable "ground truth" instruction for this turn only. This removes
// the model's need to "remember" anything; it just has to obey the facts we
// give it.
// ---------------------------------------------------------------------------

function getTurnText(turn) {
  if (!turn || !Array.isArray(turn.parts)) return '';
  return turn.parts.map(p => (p && typeof p.text === 'string') ? p.text : '').join(' ').trim();
}

// Matches only when the ENTIRE user message is just a short confirmation
// word/phrase (optionally with trailing punctuation) — this is important so
// that a NEW message like "Add recipe: Banana Cake..." (which also starts
// with the word "add") is never mistaken for a confirmation of a previous
// missing-item question.
const CONFIRM_REGEX = /^\s*(yes|ok(ay)?|sure|yep|yeah|add|add it|please add|go ahead|confirm(ed)?)\s*[.!]?\s*$/i;
const MISSING_ITEM_REGEX = /item\s+'([^']+)'\s+is\s+missing\s+from\s+your\s+stock\s+list[\s\S]*?approximately\s*([\d.]+)\s*OMR\s*per\s*(kg|l|unit)/i;
const RECIPE_REQUEST_REGEX = /add\s+recipe/i;

function extractGroundTruth(contents) {
  if (!Array.isArray(contents) || contents.length === 0) return null;

  const lastTurn = contents[contents.length - 1];
  if (!lastTurn || lastTurn.role !== 'user') return null;

  const lastText = getTurnText(lastTurn);
  if (!CONFIRM_REGEX.test(lastText)) return null;

  let missingItemName = null;
  let missingPrice = null;
  let missingUnit = null;
  let recipeRequestText = null;

  // Walk backwards from just before the confirmation message.
  for (let i = contents.length - 2; i >= 0; i--) {
    const turn = contents[i];
    const text = getTurnText(turn);

    if (!missingItemName && turn.role === 'model') {
      const match = text.match(MISSING_ITEM_REGEX);
      if (match) {
        missingItemName = match[1];
        missingPrice = parseFloat(match[2]);
        missingUnit = match[3].toLowerCase();
        continue; // keep walking backwards to find the recipe request, if any
      }
    }

    if (missingItemName && turn.role === 'user' && RECIPE_REQUEST_REGEX.test(text)) {
      recipeRequestText = text;
      break; // found the original recipe request; stop scanning
    }

    // Stop scanning once we've gone far enough back that further turns are
    // unlikely to be relevant (keeps this cheap and avoids grabbing an even
    // older, unrelated recipe request).
    if (missingItemName && i <= contents.length - 6) break;
  }

  if (!missingItemName) return null;

  return { missingItemName, missingPrice, missingUnit, recipeRequestText };
}

function buildSystemInstructionForTurn(contents) {
  const ground = extractGroundTruth(contents);
  if (!ground) return SYSTEM_INSTRUCTION;

  const { missingItemName, missingPrice, missingUnit, recipeRequestText } = ground;

  let directive =
    '\n\nCURRENT TURN GROUND TRUTH (PROGRAMMATICALLY EXTRACTED FROM THE ACTUAL CONVERSATION — ' +
    'THIS OVERRIDES ANY EXAMPLE, PLACEHOLDER, OR OLDER ITEM NAME MENTIONED ANYWHERE ELSE IN THESE INSTRUCTIONS):\n' +
    `The user just confirmed adding the missing item. Its name is EXACTLY "${missingItemName}" ` +
    `and its price is EXACTLY ${isNaN(missingPrice) ? missingPrice : missingPrice} (per ${missingUnit || 'kg'}). ` +
    `Your \`s\` array for this response MUST be exactly: {"s":[{"name":"${missingItemName}","price":${isNaN(missingPrice) ? 0 : missingPrice},"img":""}]} ` +
    'and MUST NOT contain any other item name.';

  if (recipeRequestText) {
    directive +=
      ` The user's original recipe request in this same exchange was exactly: "${recipeRequestText}". ` +
      `You MUST also build the \`r\` array recipe from THIS exact text (its name, category, and items), ` +
      `using "${missingItemName}" as the ingredient that was missing. Include both \`s\` and \`r\` in the same JSON response — do not drop the recipe.`;
  }

  return { parts: [{ text: SYSTEM_INSTRUCTION.parts[0].text + directive }] };
}

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

  const systemInstructionForThisTurn = buildSystemInstructionForTurn(contents);

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conte
