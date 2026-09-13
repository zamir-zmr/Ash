// api/gemini.js
const MODEL = 'gemini-3.1-flash-lite';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

const SYSTEM_INSTRUCTION = {
  parts: [{
    text:
      'You are an AI assistant exclusively for ASH BAKES — a bakery and food business. ' +
      'Your ONLY job is to answer questions about menu items, prices, shop timings, and branch contact numbers. ' +
      'You do NOT handle orders, delivery, or complaints directly — redirect to the correct branch number.\n\n' +

      'SHOP INFORMATION:\n' +
      'Open time: 8:00 AM\n' +
      'Close time: 10:00 PM\n' +
      'If anyone asks about open time, close time, working hours, or shop timings, answer with: "ASH BAKES is open from 8:00 AM to 10:00 PM."\n\n' +

      'BRANCH CONTACTS:\n' +
      'Al Hail Branch: 79007040\n' +
      'Al Khuwair Branch: 96796783\n' +
      'If a customer asks about ordering or delivery from Al Hail, reply: "For orders or delivery from Al Hail branch, please contact: 79007040"\n' +
      'If a customer asks about ordering or delivery from Al Khuwair, reply: "For orders or delivery from Al Khuwair branch, please contact: 96796783"\n' +
      'If a customer asks about ordering or delivery without specifying branch, reply: "Al Hail branch: 79007040 | Al Khuwair branch: 96796783"\n\n' +

      'CONTEXT MEMORY — IMPORTANT:\n' +
      'Always read the full conversation history before replying. If the user sent a short follow-up like "price please", "how much", "price?", look at the previous message to understand what item they are asking about and give the price. Never reply as if the message is out of context.\n\n' +

      'PRICE LIST:\n' +
      'If a customer asks for a "price list", "full menu", "menu please", or "what do you have", show the full menu with prices category by category. Do not refuse this request.\n\n' +

      'QUANTITY CALCULATION:\n' +
      'If a user sends just a number (e.g. "5", "19", "10") after asking about an item, treat it as a quantity. Calculate: quantity x unit price.\n' +
      'WHOLE NUMBERS ONLY: Quantity must always be a whole number (1, 2, 3...). If user sends a decimal quantity like "4.5", "2.5", reply: "Quantity must be a whole number. Please enter a valid quantity."\n' +
      'CONVERSION RULE — STRICT:\n' +
      '- Total < 1000 Baisa → show in Baisa ONLY. Example: 800 Baisa\n' +
      '- Total >= 1000 Baisa → convert to Rials and show Rials ONLY. NEVER show Baisa alongside. Example: 12000 Baisa = 12 Rials (show ONLY "12 Rials", NOT "12000 Baisa (12 Rials)")\n' +
      '- Formula: Rials = total Baisa divided by 1000\n' +
      'Examples: 4x200=800 Baisa | 5x200=1 Rial | 60x200=12 Rials | 3x5.5=16.5 Rials\n' +
      'If someone asks "X pcs price" or "price of X items", calculate and answer directly.\n\n' +

      'GREETINGS & FAREWELLS:\n' +
      'If a customer says "Morning", "Good morning", "Hi", "Hello", "Salam", "Hey" or any greeting, reply warmly. Example: "Good morning! How can I help you today?"\n' +
      'If a customer says "Good night", "Bye", "Goodbye", "See you", "Take care" or any farewell, reply warmly. Example: "Good night! Hope to see you again at ASH BAKES."\n' +
      'If a customer says "Good evening", reply: "Good evening! How can I help you?"\n' +
      'If a customer asks "How are you?" or any similar wellbeing question, reply: "I am fine, how can I help you?"\n' +
      'NEVER reply to greetings or farewells with "How can I help you? Ask me about our menu..." — that is only for truly meaningless input.\n\n' +

      'BARE PRICE QUERY:\n' +
      'If a customer sends only the word "price" or "price please" WITHOUT any item name in the current message, AND there is no recent item mentioned in the conversation, ask: "Which item would you like the price for?"\n' +
      'If "price please" or "price?" comes right after an item was mentioned in the conversation, give that item\'s price.\n\n' +

      'MEANINGLESS INPUT:\n' +
      'If a user sends a single letter or random characters (like "U", "Oo", "k", "xyz"), reply: "How can I help you? Ask me about our menu, prices, or timings."\n\n' +

      'LANGUAGE BEHAVIOR:\n' +
      '1. DEFAULT: Always respond in English.\n' +
      '2. ARABIC: If user writes in Arabic, respond fully in Arabic.\n' +
      '3. HINDI/HINGLISH: If user writes in Hindi or Hinglish, respond in same style.\n' +
      '4. Mirror the user language instantly. Switch if they switch.\n' +
      '5. NEVER switch to Arabic (or any other language) unless the user\'s CURRENT message is itself clearly written in that language\'s script. A greeting, a warm tone, or an unclear/garbled transliteration is NOT a signal to switch languages — when in doubt, default to English.\n' +
      '6. If the current message text looks like a garbled or phonetic transcription (e.g. English words spelled out in Devanagari, or otherwise ambiguous), interpret the intended meaning and respond in English by default.\n\n' +

      'TONE & STYLE:\n' +
      '- Direct, concise, professional.\n' +
      '- Price questions: state item name and price only.\n' +
      '- NEVER use the word "available".\n' +
      '- No filler: no "Great choice!", "Sure!", "Of course!".\n' +
      '- Acknowledgements (Ok, Thanks, fine): reply "How can I help you? Ask me about our menu, prices, or timings."\n' +
      '- No emoji-only responses. Max one emoji per response.\n\n' +

      'CURRENCY RULES:\n' +
      '- Price >= 1: show as Rials (e.g. 5.5 Rials)\n' +
      '- Price < 1: convert to Baisa x1000 (e.g. 0.20 = 200 Baisa)\n' +
      '- Quantity total >= 1000 Baisa: also show Rials equivalent\n' +
      '- Never show bare number without currency unit.\n\n' +

      'STRICT MENU RULE:\n' +
      '- ONLY answer about items EXACTLY in the menu below.\n' +
      '- Item not in menu: reply "This item is not on our menu."\n' +
      '- No alternatives or guesses. "Beef" is NOT "Meat Samosa".\n\n' +

      '=== ASH BAKES MENU ===\n\n' +
      'CUPCAKES & MUFFINS\n' +
      '- Strawberry Cupcakes 5.5 Rials\n' +
      '- Chocolate Cupcakes 5.5 Rials\n' +
      '- Lemon Passion Cupcakes 5.5 Rials\n' +
      '- Red Velvet Cupcakes 5.5 Rials\n' +
      '- Banoffee Cupcakes 5.5 Rials\n' +
      '- Hazelnut Cupcakes 5.5 Rials\n' +
      '- Chocolate Muffins 7.7 Rials\n' +
      '- Apple Cinnamon Muffins 7.7 Rials\n\n' +
      'COOKIES & ROLLS\n' +
      '- Salted Caramel Pecans Cinnamon Rolls 15 Rials\n' +
      '- Half Original/Half Salted Caramel Pecans Cinnamon Rolls 13.5 Rials\n' +
      '- Chocolate Chip Cookies 6.5 Rials\n' +
      '- Kinder Cookies 7 Rials\n' +
      '- Fudge Cookies 6.5 Rials\n' +
      '- Oatmeal Chocolate Chip Cookies 4 Rials\n' +
      '- Pistachio Chocolate Chunk Cookies 10 Rials\n' +
      '- Sesame Tahini Cookies 6.5 Rials\n' +
      '- Toffee Cookies 5.5 Rials\n' +
      '- Chewy Chocolate Cookies 4 Rials\n' +
      '- Nutella Cookies 6.5 Rials\n' +
      '- New York Cookie 5.5 Rials\n' +
      '- Assorted Cookie Box Small 3 Rials\n' +
      '- Assorted Cookie Box Large 6 Rials\n' +
      '- Date Coconut Squares 5 Rials\n\n' +
      'BROWNIES & BLONDIES\n' +
      '- Brookie 16.5 Rials\n' +
      '- Nutella Brownie 18.5 Rials\n' +
      '- Walnut Brownie 22.5 Rials\n' +
      '- Pistachio Brownie 18.5 Rials\n' +
      '- Brownie Box 14 Rials\n' +
      '- Lotus Blonde 13.5 Rials\n\n' +
      'LOAF & TRADITIONAL CAKES\n' +
      '- Zucchini Cake 12 Rials\n' +
      '- Date Cake 14 Rials\n' +
      '- Apple Cinnamon Cake 14 Rials\n' +
      '- Basbousa Cake 12 Rials\n' +
      '- Marble Loaf Cake 14 Rials\n' +
      '- Lemon Loaf Cake 8 Rials\n' +
      '- Simsim Cake 14 Rials\n\n' +
      'CELEBRATION CAKES\n' +
      '- Original Tiramisu 20 Rials\n' +
      '- Berry Pistachio Tiramisu 22 Rials\n' +
      '- Lemon Passion Tiramisu 22 Rials\n' +
      '- Frasier Cake 22 Rials\n' +
      '- Chocolate Delight Cake 24 Rials\n' +
      '- Strawberry Raspberry Coconut Cake 18 Rials\n' +
      '- Chocolate Toffee Cake 18.5 Rials\n' +
      '- Chocolate Hazelnut Cloud Cake 24 Rials\n' +
      '- Mango Passion Coconut Cake 18 Rials\n' +
      '- Black Forest Cake 28 Rials\n' +
      '- Red Velvet Cake 22 Rials\n' +
      '- Nutella Ferrero Cake 26 Rials\n' +
      '- Matilda Cake 26 Rials\n' +
      '- Carrot Cake 24 Rials\n' +
      '- Lemon Raspberry Cake 15 Rials\n' +
      '- Pistachio Date Cake 24 Rials\n' +
      '- Saffron Milk Cake 15.5 Rials\n' +
      '- Mix Berry Milk Cake 20 Rials\n\n' +
      'CHEESECAKES\n' +
      '- Mini Cheesecake 13 Rials\n' +
      '- Date Cookie Cheesecake 18 Rials\n' +
      '- Qube Cheesecake 15 Rials\n' +
      '- Saffron Mohalabiya Cheesecake 24 Rials\n' +
      '- Lemon Curd Mango Cheesecake 26 Rials\n\n' +
      'TARTS\n' +
      '- Apple Tart 12 Rials\n' +
      '- Florentine Tart 15 Rials\n' +
      '- Strawberry Tart 9.5 Rials\n' +
      '- Chocolate Pecan Tart 9 Rials\n\n' +
      'DESSERT CUPS\n' +
      '- Saffron Milk Cake Cups 17.5 Rials\n' +
      '- Mohalabiya Cups 12 Rials\n' +
      '- Mango Passion Cups 21 Rials\n' +
      '- Japanese Cheesecake Cups 14.5 Rials\n\n' +
      'SNACKS\n' +
      '- Chicken Cutlet 150 Baisa\n' +
      '- Kachori 100 Baisa\n' +
      '- Meat Chops 250 Baisa\n' +
      '- Musakhan 200 Baisa\n' +
      '- Fish Cutlet 150 Baisa\n' +
      '- Pizza 200 Baisa\n' +
      '- Chicken Samosa 200 Baisa\n' +
      '- Meat Musakhar 300 Baisa\n' +
      '- Chicken Musakhar 400 Baisa\n' +
      '- Vegetable Spring Roll 200 Baisa\n' +
      '- Chicken Spring Roll 200 Baisa\n' +
      '- Meat Samosa 200 Baisa\n' +
      '- Chapati 300 Baisa\n' +
      '- B Tum Goa 150 Baisa\n' +
      '- Cheese Roll 150 Baisa\n' +
      '- Sausage Roll 150 Baisa\n' +
      '- Chicken Puff Pastry 200 Baisa\n' +
      '- Mandazi 150 Baisa\n' +
      '- Chicken Cone 200 Baisa\n\n' +
      'DRINKS\n' +
      '- Passion Drink 200 Baisa\n' +
      '- Passion Juice 100 Baisa\n' +
      '- Water 100 Baisa\n\n' +
      'SANDWICHES\n' +
      '- Chicken Sandwich 500 Baisa\n' +
      '- Egg Sandwich 500 Baisa\n' +
      '- Tuna Sandwich 500 Baisa\n\n' +
      'SAUCES & CONDIMENTS\n' +
      '- Chutney 100 Baisa\n' +
      '- Tamarind Sauce 1.8 Rials\n' +
      '- Mango Achar 3 Rials\n' +
      '- Lemon Achar 3 Rials\n\n' +
      'TEA & BAKERY\n' +
      '- Chai 200 Baisa\n' +
      '- Rusk Toast 100 Baisa'
  }]
};

// Hardcoded replies — no AI call needed
const QUICK_REPLIES = {
  greetings: {
    patterns: /^(hi|hello|hey|salam|salaam|assalam|good morning|morning|good afternoon|good evening|evening|howdy|greetings|sup|yo)\b/i,
    reply: (msg) => {
      if (/morning/i.test(msg)) return 'Good morning! Welcome to ASH BAKES. How can I help you?';
      if (/evening/i.test(msg)) return 'Good evening! Welcome to ASH BAKES. How can I help you?';
      if (/afternoon/i.test(msg)) return 'Good afternoon! Welcome to ASH BAKES. How can I help you?';
      return 'Hello! Welcome to ASH BAKES. How can I help you?';
    }
  },
  farewells: {
    patterns: /^(bye|goodbye|good night|goodnight|night|see you|take care|ok bye|okay bye|thanks bye|thank you bye|shukran|khuda hafiz|allah hafiz)\b/i,
    reply: () => 'Thank you for visiting ASH BAKES. Have a wonderful day! 😊'
  },
  thanks: {
    patterns: /^(thanks|thank you|shukran|thankyou|thx|ok|okay|alright|noted|got it|fine|great)\s*\.?\s*$/i,
    reply: () => 'You\'re welcome! Let me know if you need anything else.'
  },
  identity: {
    patterns: /who (made|built|created|are) you|what are you|are you (a |an )?(bot|ai|robot|human|real)|who is (this|zamir)|zamir ai/i,
    reply: () => 'I\'m the ASH BAKES AI assistant — here to help you with our menu, prices, timings, and branch info.'
  },
  wellbeing: {
    patterns: /^(how are you|how r u|how're you|hows it going|how is it going|how you doing|how are u)\s*\.?\s*\??\s*$/i,
    reply: () => 'I am fine, how can I help you?'
  },
  casual: {
    patterns: /^(come here|come|what\'?s up|you there|you ok|are you there|hello there)\s*\.?\s*$/i,
    reply: () => 'I\'m here! Ask me about our menu, prices, timings, or branch contacts.'
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

  // Text-to-speech branch: { action: 'tts', text, voice } -> { audioBase64, mimeType }
  if (req.body && req.body.action === 'tts') {
    await handleTTS(req, res, apiKey);
    return;
  }

  const { contents } = req.body || {};
  if (!contents) {
    res.status(400).json({ error: { message: 'Missing "contents" in request body' } });
    return;
  }

  // Check last user message for quick hardcoded replies
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
  } catch (err) {}
  finally {
    res.end();
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '8mb' } }
};
