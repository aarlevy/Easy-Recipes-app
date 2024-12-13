import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { recipe } = await request.json();

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe information is required' },
        { status: 400 }
      );
    }

    const prompt = `Please provide detailed cooking instructions for this recipe: "${recipe.title}"
    using these ingredients: ${recipe.ingredients.map(ing => `${ing.quantity} ${ing.name}`).join(', ')}

    REQUIREMENTS:
    - Break down each step into clear, detailed sub-steps
    - Include cooking temperatures where relevant
    - Use exactly the same cooking time as provided: ${recipe.cookingTime}
    - Add helpful tips for success
    - Include any safety precautions
    - Mention what the end result should look like

    Format the response as JSON with this structure:
    {
      "detailedInstructions": {
        "prepTime": "X minutes",
        "cookTime": "${recipe.cookingTime}",
        "totalTime": "${recipe.cookingTime}",
        "ingredients": [
          "Exact quantity and ingredient 1",
          "Exact quantity and ingredient 2"
        ],
        "steps": [
          "Detailed step 1",
          "Detailed step 2"
        ],
        "tips": [
          "Helpful tip 1",
          "Helpful tip 2"
        ]
      }
    }

    Make sure:
    1. Each step is clear and detailed
    2. Include exact measurements and temperatures
    3. Include timing for each major step
    4. Format ingredients with exact quantities
    5. Add at least 2-3 helpful tips
    6. The total cooking time MUST match ${recipe.cookingTime}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.3
    });

    const content = completion.choices[0].message.content;
    let data;
    
    try {
      data = JSON.parse(content);
      console.log('Successfully parsed detailed instructions');

      // Ensure cooking times match the original recipe
      if (data.detailedInstructions) {
        data.detailedInstructions.cookTime = recipe.cookingTime;
        data.detailedInstructions.totalTime = recipe.cookingTime;
      }

    } catch (parseError) {
      console.error('Error parsing detailed instructions:', parseError);
      throw new Error('Failed to parse recipe instructions');
    }

    if (!data.detailedInstructions) {
      throw new Error('Invalid response format from AI');
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error getting detailed instructions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get detailed instructions',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 