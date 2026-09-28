// gemini.js
import { CATEGORIES } from './category.js';
import { RECIPES_BY_CATEGORY } from './recipe.js';
import stockData from './Stock.json' assert { type: 'json' };

// Gemini API calling function
export async function askGemini(userPrompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // System instruction setup with Categories, Recipes, and Stock context
  const systemInstructionText = `
You are an AI assistant for the AshCostinApp bakery & cafe costing management system.
You have full knowledge of the available categories, recipes, and raw material stock items in the application.

CATEGORIES LIST (${CATEGORIES.length} Categories):
${JSON.stringify(CATEGORIES, null, 2)}

RECIPES BY CATEGORY:
${JSON.stringify(RECIPES_BY_CATEGORY, null, 2)}

STOCK / INGREDIENT ITEMS DATA:
${JSON.stringify(stockData, null, 2)}

Instructions:
1. Always use this exact recipe, category, and stock data when answering user queries about bakery items, costing, or raw materials.
2. If a user asks about ingredient prices, stock availability, or recipes inside a specific category, refer to this data accurately.
3. Respond clearly and politely in Hindi or Hinglish as requested by the user.
`;

  const requestBody = {
    system_instruction: {
      parts: [
        { text: systemInstructionText }
      ]
    },
    contents: [
      {
        parts: [
          { text: userPrompt }
        ]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
      }
