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
      '   - IF YES: output the complete stock list JSON exactly as defined in the DEFAULT APP STOCK INVENTORY section below.\n' +
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
      'DEFAULT APP STOCK INVENTORY (FOR GEMINI INTERNAL KNOWLEDGE BASE ONLY - DO NOT OUTPUT TO USER UNLESS STRICT TRIGGER MATCHED):\n' +
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
    res.status(502).json({ error: { message: 'Failed to reach Gemini TTS API', detail: err.mes
