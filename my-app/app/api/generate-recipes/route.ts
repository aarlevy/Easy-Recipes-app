import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    console.log('Starting recipe generation...');
    const { ingredients, preferences } = await request.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Invalid ingredients list' },
        { status: 400 }
      );
    }

    console.log('Ingredients received:', ingredients);
    console.log('Preferences received:', preferences);

    // Helper function to get cooking time description
    const getCookingTimeDescription = (minutes: string) => {
      const mins = parseInt(minutes);
      if (mins <= 30) return "a quick recipe";
      if (mins <= 60) return "a medium-length recipe";
      return "a longer, more elaborate recipe";
    };

    // Helper function to get skill level description
    const getSkillLevelDescription = (level: string) => {
      switch (level.toLowerCase()) {
        case 'beginner': return "simple techniques and basic cooking methods";
        case 'intermediate': return "moderate cooking techniques and some multitasking";
        case 'advanced': return "complex techniques and precise timing";
        default: return "simple to moderate cooking techniques";
      }
    };

    const prompt = `Generate ${preferences.servings} serving recipes using ONLY these available ingredients: ${ingredients.join(', ')}.

    USER PREFERENCES (THESE ARE MANDATORY):
    1. Servings: Exactly ${preferences.servings} ${parseInt(preferences.servings) === 1 ? 'person' : 'people'}
    2. Cooking Time: ${getCookingTimeDescription(preferences.cookingTime)} (up to ${preferences.cookingTime} minutes)
    3. Skill Level: ${getSkillLevelDescription(preferences.skillLevel)}
    ${preferences.dietaryPreference ? `4. Dietary Requirement: Must be ${preferences.dietaryPreference}` : ''}
    ${preferences.cuisineType ? `5. Cuisine Style: Should follow ${preferences.cuisineType} cooking traditions` : ''}
    ${preferences.recipeType ? `6. Type of Dish: Must be a ${preferences.recipeType}` : ''}

    CORE REQUIREMENTS:
    - ONLY use ingredients from the provided list
    - NO additional ingredients can be suggested
    - Total recipe value MUST be under $20
    - Assume basic pantry items are available (salt, pepper, water)
    - Prioritize using multiple ingredients from the list
    - Cooking methods should match the specified skill level
    - Cooking time MUST be within the specified ${preferences.cookingTime} minutes limit

    For each recipe, provide:
    1. Title (make it descriptive of the dish)
    2. List of ingredients with:
       - Exact quantities needed for ${preferences.servings} ${parseInt(preferences.servings) === 1 ? 'person' : 'people'}
       - Estimated market value of the ingredient amount used (be realistic with prices)
       - Note: All ingredients must be from the user's list
    3. Value breakdown:
       - Total recipe value MUST be under $20 (sum of market prices for all ingredients used)
       - Value per serving
       - Number of servings (must be exactly ${preferences.servings})
    4. Step-by-step instructions appropriate for the specified skill level
    5. Cooking time (MUST be under ${preferences.cookingTime} minutes)
    6. Difficulty level (MUST match ${preferences.skillLevel})

    Format the response as JSON with this structure:
    {
      "recipes": [
        {
          "title": "Recipe Name",
          "servings": ${preferences.servings},
          "ingredients": [
            {
              "name": "Ingredient 1",
              "quantity": "1 cup",
              "marketValue": 2.50
            }
          ],
          "totalValue": 12.50,
          "valuePerServing": 3.13,
          "cookingTime": "${preferences.cookingTime} minutes",
          "difficulty": "${preferences.skillLevel}",
          "instructions": ["Step 1", "Step 2"]
        }
      ]
    }

    IMPORTANT RULES:
    1. ONLY use ingredients from the provided list
    2. Total recipe value must ALWAYS be under $20
    3. Be realistic with ingredient market values
    4. Format all monetary values with 2 decimal places
    5. All recipes MUST serve exactly ${preferences.servings} ${parseInt(preferences.servings) === 1 ? 'person' : 'people'}
    6. Cooking time MUST NOT exceed ${preferences.cookingTime} minutes
    7. Difficulty level MUST match ${preferences.skillLevel}`;

    console.log('Making OpenAI API call...');
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 3000,
      temperature: 0.7
    });

    console.log('OpenAI API response received');
    const content = completion.choices[0].message.content;
    let data;
    
    try {
      // Try to fix common JSON truncation issues
      let fixedContent = content;
      if (!content.endsWith('}')) {
        // If the content is truncated, try to find the last complete recipe
        const lastCompleteRecipe = content.lastIndexOf('},');
        if (lastCompleteRecipe !== -1) {
          fixedContent = content.substring(0, lastCompleteRecipe + 1) + ']}';
        }
      }
      
      data = JSON.parse(fixedContent);
      console.log('Successfully parsed recipes data');
      
      // Validate the recipes
      if (!data.recipes || !Array.isArray(data.recipes)) {
        throw new Error('Invalid recipe format');
      }
      
      // Filter out any incomplete recipes and validate preferences
      data.recipes = data.recipes.filter(recipe => {
        // Check for required fields
        if (!recipe || 
            !recipe.title || 
            !recipe.servings || 
            !recipe.ingredients || 
            !recipe.instructions ||
            !recipe.cookingTime ||
            !recipe.difficulty) {
          return false;
        }

        // Validate preferences
        const cookingTimeMatch = recipe.cookingTime.match(/\d+/);
        const cookingMinutes = cookingTimeMatch ? parseInt(cookingTimeMatch[0]) : 0;
        
        return (
          recipe.servings === parseInt(preferences.servings) &&
          cookingMinutes <= parseInt(preferences.cookingTime) &&
          recipe.difficulty.toLowerCase() === preferences.skillLevel.toLowerCase()
        );
      });
      
    } catch (parseError) {
      console.error('Error parsing recipes:', parseError);
      console.error('Raw content:', content);
      return NextResponse.json({
        error: 'Failed to generate valid recipes',
        details: process.env.NODE_ENV === 'development' ? parseError.message : undefined
      }, { status: 500 });
    }
    
    if (!data.recipes || data.recipes.length === 0) {
      console.log('No valid recipes generated');
      return NextResponse.json({
        error: 'No recipes could be generated from the provided ingredients',
        debug: { content }
      }, { status: 400 });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error generating recipes:', error);
    
    // Check for specific OpenAI API errors
    if (error?.response?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your OpenAI API key configuration.' },
        { status: 401 }
      );
    }
    
    if (error?.response?.status === 429) {
      return NextResponse.json(
        { error: 'API rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    if (error.message?.includes('billing') || error.message?.includes('quota')) {
      return NextResponse.json(
        { error: 'Account limit reached. Please check your OpenAI account.' },
        { status: 402 }
      );
    }

    // Log the full error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error:', JSON.stringify(error, null, 2));
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate recipes. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 