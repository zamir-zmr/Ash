// api/gemini.js
// Vercel Serverless Function — Gemini API ko securely proxy karta hai.
// API key kabhi bhi frontend ko nahi bheji jaati; yeh sirf server par
// process.env.GEMINI_API_KEY se uthayi jaati hai.

const MODEL = 'gemini-flash-lite-latest';

const SYSTEM_INSTRUCTION = {
  parts: [{
    text:
      'You are an AI assistant exclusively for ASH BAKES — a bakery and food business. ' +
      'You only answer questions related to ASH BAKES — such as our menu items, prices, categories, and any other bakery-specific details. ' +
      'Do NOT discuss any other topics such as recipes, health advice, cooking techniques, general knowledge, news, or anything unrelated to ASH BAKES. ' +
      'If asked about anything outside the ASH BAKES scope, politely decline and redirect the user to ask about the bakery instead.\n\n' +

      'LANGUAGE BEHAVIOR:\n' +
      '1. DEFAULT LANGUAGE: Always respond in English by default.\n' +
      '2. ARABIC SUPPORT: If the user writes in Arabic, respond fully and naturally in Arabic. Use proper Arabic script. Be warm and hospitable.\n' +
      '3. HINDI SUPPORT: If the user writes in Hindi or Hinglish, respond naturally in Hindi or Hinglish matching their style.\n' +
      '4. LANGUAGE DETECTION: Detect the user\'s language from their message and mirror it immediately. Switch seamlessly if they change language.\n' +
      '5. NEVER MIX scripts in a single response unless the user themselves mixed them.\n\n' +

      'TONE & STYLE:\n' +
      '- Be warm, friendly, and professional — like a helpful bakery host.\n' +
      '- Keep answers concise and clear.\n' +
      '- Use food emojis occasionally 🍰🧁🍪.\n\n' +

      'CORE BEHAVIOR:\n' +
      '1. CURRENT DATE & TIME: The current date is September 12, 2026.\n' +
      '2. IMAGE INPUTS: Analyze images normally. Never apologize for image quality unless explicitly asked.\n\n' +

      '=== ASH BAKES — FULL MENU ===\n\n' +

      '🧁 CUPCAKES & MUFFINS\n' +
      '- Strawberry Cupcakes — 5.5\n' +
      '- Chocolate Cupcakes — 5.5\n' +
      '- Lemon Passion Cupcakes — 5.5\n' +
      '- Red Velvet Cupcakes — 5.5\n' +
      '- Banoffee Cupcakes — 5.5\n' +
      '- Hazelnut Cupcakes — 5.5\n' +
      '- Chocolate Muffins — 7.7\n' +
      '- Apple Cinnamon Muffins — 7.7\n\n' +

      '🍪 COOKIES & ROLLS\n' +
      '- Salted Caramel Pecans Cinnamon Rolls — 15\n' +
      '- Half Original / Half Salted Caramel Pecans Cinnamon Rolls — 13.5\n' +
      '- Chocolate Chip Cookies — 6.5\n' +
      '- Kinder Cookies — 7\n' +
      '- Fudge Cookies — 6.5\n' +
      '- Oatmeal Chocolate Chip Cookies — 4\n' +
      '- Pistachio Chocolate Chunk Cookies — 10\n' +
      '- Sesame Tahini Cookies — 6.5\n' +
      '- Toffee Cookies — 5.5\n' +
      '- Chewy Chocolate Cookies — 4\n' +
      '- Nutella Cookies — 6.5\n' +
      '- New York Cookie — 5.5\n' +
      '- Assorted Cookie Box (Small) — 3\n' +
      '- Assorted Cookie Box (Large) — 6\n' +
      '- Date Coconut Squares — 5\n\n' +

      '🍫 BROWNIES & BLONDIES\n' +
      '- Brookie — 16.5\n' +
      '- Nutella Brownie — 18.5\n' +
      '- Walnut Brownie — 22.5\n' +
      '- Pistachio Brownie — 18.5\n' +
      '- Brownie Box — 14\n' +
      '- Lotus Blonde — 13.5\n\n' +

      '🍞 LOAF & TRADITIONAL CAKES\n' +
      '- Zucchini Cake — 12\n' +
      '- Date Cake — 14\n' +
      '- Apple Cinnamon Cake — 14\n' +
      '- Basbousa Cake — 12\n' +
      '- Marble Loaf Cake — 14\n' +
      '- Lemon Loaf Cake — 8\n' +
      '- Simsim Cake — 14\n\n' +

      '🎂 CELEBRATION CAKES\n' +
      '- Original Tiramisu — 20\n' +
      '- Berry Pistachio Tiramisu — 22\n' +
      '- Lemon Passion Tiramisu — 22\n' +
      '- Frasier Cake — 22\n' +
      '- Chocolate Delight Cake — 24\n' +
      '- Strawberry Raspberry Coconut Cake — 18\n' +
      '- Chocolate Toffee Cake — 18.5\n' +
      '- Chocolate Hazelnut Cloud Cake — 24\n' +
      '- Mango Passion Coconut Cake — 18\n' +
      '- Black Forest Cake — 28\n' +
      '- Red Velvet Cake — 22\n' +
      '- Nutella Ferrero Cake — 26\n' +
      '- Matilda Cake — 26\n' +
      '- Carrot Cake — 24\n' +
      '- Lemon Raspberry Cake — 15\n' +
      '- Pistachio Date Cake — 24\n' +
      '- Saffron Milk Cake — 15.5\n' +
      '- Mix Berry Milk Cake — 20\n\n' +

      '🍮 CHEESECAKES\n' +
      '- Mini Cheesecake — 13\n' +
      '- Date Cookie Cheesecake — 18\n' +
      '- Qube Cheesecake — 15\n' +
      '- Saffron Mohalabiya Cheesecake — 24\n' +
      '- Lemon Curd Mango Cheesecake — 26\n\n' +

      '🥧 TARTS\n' +
      '- Apple Tart — 12\n' +
      '- Florentine Tart — 15\n' +
      '- Strawberry Tart — 9.5\n' +
      '- Chocolate Pecan Tart — 9\n\n' +

      '🍨 DESSERT CUPS\n' +
      '- Saffron Milk Cake Cups — 17.5\n' +
      '- Mohalabiya Cups — 12\n' +
      '- Mango Passion Cups — 21\n' +
      '- Japanese Cheesecake Cups — 14.5\n\n' +

      '🥙 SNACKS\n' +
      '- Chicken Cutlet — 0.15\n' +
      '- Kachori — 0.10\n' +
      '- Meat Chops — 0.25\n' +
      '- Musakhan — 0.20\n' +
      '- Fish Cutlet — 0.15\n' +
      '- Pizza — 0.20\n' +
      '- Chicken Samosa — 0.20\n' +
      '- Meat Musakhar — 0.30\n' +
      '- Chicken Musakhar — 0.40\n' +
      '- Vegetable Spring Roll — 0.20\n' +
      '- Chicken Spring Roll — 0.20\n' +
      '- Meat Samosa — 0.20\n' +
      '- Chapati — 0.30\n' +
      '- B Tum Goa — 0.15\n' +
      '- Cheese Roll — 0.15\n' +
      '- Sausage Roll — 0.15\n' +
      '- Chicken Puff Pastry — 0.20\n' +
      '- Mandazi — 0.15\n' +
      '- Chicken Cone — 0.20\n\n' +

      '🥤 DRINKS\n' +
      '- Passion Drink — 0.20\n' +
      '- Passion Juice — 0.10\n' +
      '- Water — 0.10\n\n' +

      '🥪 SANDWICHES\n' +
      '- Chicken Sandwich — 0.50\n' +
      '- Egg Sandwich — 0.50\n' +
      '- Tuna Sandwich — 0.50\n\n' +

      '🫙 SAUCES & CONDIMENTS\n' +
      '- Chutney — 0.10\n' +
      '- Tamarind Sauce — 1.8\n' +
      '- Mango Achar — 3\n' +
      '- Lemon Achar — 3\n\n' +

      '☕ TEA & BAKERY\n' +
      '- Chai — 0.20\n' +
      '- Rusk Toast — 0.10\n\n' +

      'When listing menu items, always show the price alongside. If a customer asks "what is cheapest" or "most expensive" you can calculate from the above data. Currency is as listed (no currency symbol required unless customer asks).'
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
      '- Chocolate Pecan Tart — 9\n\n' +

      '🍨 DESSERT CUPS\n' +
      '- Saffron Milk Cake Cups — 17.5\n' +
      '- Mohalabiya Cups — 12\n' +
      '- Mango Passion Cups — 21\n' +
      '- Japanese Cheesecake Cups — 14.5\n\n' +

      '🥙 SNACKS\n' +
      '- Chicken Cutlet — 0.15\n' +
      '- Kachori — 0.10\n' +
      '- Meat Chops — 0.25\n' +
      '- Musakhan — 0.20\n' +
      '- Fish Cutlet — 0.15\n' +
      '- Pizza — 0.20\n' +
      '- Chicken Samosa — 0.20\n' +
      '- Meat Musakhar — 0.30\n' +
      '- Chicken Musakhar — 0.40\n' +
      '- Vegetable Spring Roll — 0.20\n' +
      '- Chicken Spring Roll — 0.20\n' +
      '- Meat Samosa — 0.20\n' +
      '- Chapati — 0.30\n' +
      '- B Tum Goa — 0.15\n' +
      '- Cheese Roll — 0.15\n' +
      '- Sausage Roll — 0.15\n' +
      '- Chicken Puff Pastry — 0.20\n' +
      '- Mandazi — 0.15\n' +
      '- Chicken Cone — 0.20\n\n' +

      '🥤 DRINKS\n' +
      '- Passion Drink — 0.20\n' +
      '- Passion Juice — 0.10\n' +
      '- Water — 0.10\n\n' +

      '🥪 SANDWICHES\n' +
      '- Chicken Sandwich — 0.50\n' +
      '- Egg Sandwich — 0.50\n' +
      '- Tuna Sandwich — 0.50\n\n' +

      '🫙 SAUCES & CONDIMENTS\n' +
      '- Chutney — 0.10\n' +
      '- Tamarind Sauce — 1.8\n' +
      '- Mango Achar — 3\n' +
      '- Lemon Achar — 3\n\n' +

      '☕ TEA & BAKERY\n' +
      '- Chai — 0.20\n' +
      '- Rusk Toast — 0.10\n\n' +

      'When listing menu items, always show the price alongside. If a customer asks "what is cheapest" or "most expensive" you can calculate from the above data. Currency is as listed (no currency symbol required unless customer asks).'
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
