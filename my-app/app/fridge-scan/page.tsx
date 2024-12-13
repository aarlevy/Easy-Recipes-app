"use client";

import { useState } from "react";
import { Camera, RefreshCw, ChevronRight, Clock, DollarSign, ThermometerSun, X, Search } from "lucide-react";
import { useUser } from '../store/UserContext';
import { useRecipes } from '../store/RecipeContext';

interface RecipePreferences {
  servings: string;
  dietaryPreference: string;
  cookingTime: string;
  cuisineType: string;
  skillLevel: string;
  recipeType: string;
}

export default function FridgeScan() {
  const [image, setImage] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);
  const [newIngredient, setNewIngredient] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [detailedInstructions, setDetailedInstructions] = useState<any>(null);
  const { incrementRecipesTried } = useUser();
  const { addRecipe } = useRecipes();
  const [preferences, setPreferences] = useState<RecipePreferences>({
    servings: '2',
    dietaryPreference: '',
    cookingTime: '30',
    cuisineType: '',
    skillLevel: 'beginner',
    recipeType: ''
  });

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB.');
      return;
    }

    try {
      // Create a preview URL for the captured image
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
      setIsAnalyzing(true);
      setError(null);
      setDebug(null);

      // Create form data for the image
      const formData = new FormData();
      formData.append('image', file);

      // Send image to analysis endpoint
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze image');
      }

      if (data.debug) {
        setDebug(data.debug);
      }

      setIngredients(data.ingredients);
      
      if (data.ingredients.length === 0) {
        setError('No ingredients were detected in the image. Please try a different image or angle.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze image. Please try again.');
      console.error('Error analyzing image:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRecipes = async () => {
    try {
      setIsGeneratingRecipes(true);
      setError(null);

      const response = await fetch('/api/generate-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ingredients,
          preferences 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate recipes');
      }

      setRecipes(data.recipes || []);
      
      if (data.recipes?.length === 0) {
        setError('No recipes could be generated. Please try with different ingredients or preferences.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate recipes. Please try again.');
      console.error('Error generating recipes:', err);
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  const getDetailedInstructions = async (recipe: any) => {
    try {
      setIsLoadingDetails(true);
      setError(null);
      setSelectedRecipe(recipe);

      const response = await fetch('/api/get-detailed-instructions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get detailed instructions');
      }

      setDetailedInstructions(data.detailedInstructions);
      incrementRecipesTried();
      
      // Add recipe to saved recipes
      addRecipe(recipe);
      
    } catch (err: any) {
      setError(err.message || 'Failed to get detailed instructions. Please try again.');
      console.error('Error getting detailed instructions:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Scan Your Fridge</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Camera/Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          {!image ? (
            <div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageCapture}
                />
                <div className="flex flex-col items-center space-y-4">
                  <Camera className="w-12 h-12 text-gray-400" />
                  <span className="text-gray-500">Tap to take a photo of your fridge contents</span>
                  <span className="text-sm text-gray-400">Supported formats: JPG, PNG, WebP (max 5MB)</span>
                </div>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img src={image} alt="Captured" className="max-w-full rounded-lg" />
              <button
                onClick={() => {
                  setImage(null);
                  setIngredients([]);
                  setRecipes([]);
                  setError(null);
                  setDebug(null);
                }}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Recipe Preferences */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Recipe Preferences</h2>
          <div className="space-y-4">
            {/* Dietary Preferences */}
            <div>
              <label className="block text-gray-600 mb-2">Dietary Preferences</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={preferences.dietaryPreference}
                onChange={(e) => setPreferences(prev => ({ ...prev, dietaryPreference: e.target.value }))}
              >
                <option value="">No restrictions</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="gluten-free">Gluten-Free</option>
                <option value="dairy-free">Dairy-Free</option>
                <option value="keto">Keto</option>
                <option value="paleo">Paleo</option>
              </select>
            </div>

            {/* Cooking Time */}
            <div>
              <label className="block text-gray-600 mb-2">Maximum Cooking Time</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={preferences.cookingTime}
                onChange={(e) => setPreferences(prev => ({ ...prev, cookingTime: e.target.value }))}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2+ hours</option>
              </select>
            </div>

            {/* Cuisine Type */}
            <div>
              <label className="block text-gray-600 mb-2">Cuisine Type</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={preferences.cuisineType}
                onChange={(e) => setPreferences(prev => ({ ...prev, cuisineType: e.target.value }))}
              >
                <option value="">Any Cuisine</option>
                <option value="italian">Italian</option>
                <option value="chinese">Chinese</option>
                <option value="indian">Indian</option>
                <option value="mexican">Mexican</option>
                <option value="japanese">Japanese</option>
                <option value="thai">Thai</option>
                <option value="mediterranean">Mediterranean</option>
              </select>
            </div>

            {/* Skill Level */}
            <div>
              <label className="block text-gray-600 mb-2">Cooking Skill Level</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={preferences.skillLevel}
                onChange={(e) => setPreferences(prev => ({ ...prev, skillLevel: e.target.value }))}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Recipe Type */}
            <div>
              <label className="block text-gray-600 mb-2">Recipe Type</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={preferences.recipeType}
                onChange={(e) => setPreferences(prev => ({ ...prev, recipeType: e.target.value }))}
              >
                <option value="">Any Type</option>
                <option value="main-course">Main Course</option>
                <option value="side-dish">Side Dish</option>
                <option value="soup">Soup</option>
                <option value="salad">Salad</option>
                <option value="breakfast">Breakfast</option>
                <option value="dessert">Dessert</option>
              </select>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {isAnalyzing && (
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
            <p className="mt-2">Analyzing your ingredients...</p>
          </div>
        )}

        {/* Detected Ingredients */}
        {ingredients.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Detected Ingredients:</h2>
            <ul className="grid grid-cols-2 gap-2">
              {ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="bg-white p-3 rounded-md shadow-sm"
                >
                  {ingredient}
                </li>
              ))}
            </ul>

            {/* Add ingredients section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-600 mb-3">Got it wrong? Add ingredients here:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter ingredient"
                  className="flex-1 p-2 border rounded-md"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newIngredient.trim()) {
                      setIngredients([...ingredients, newIngredient.trim()]);
                      setNewIngredient('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newIngredient.trim()) {
                      setIngredients([...ingredients, newIngredient.trim()]);
                      setNewIngredient('');
                    }
                  }}
                  className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Generate Button Row */}
            <div className="flex items-center space-x-4 mt-6">
              {/* Serving Size */}
              <div className="flex-1">
                <select 
                  className="w-full p-2 border rounded-md"
                  value={preferences.servings}
                  onChange={(e) => setPreferences(prev => ({ ...prev, servings: e.target.value }))}
                >
                  <option value="1">1 person</option>
                  <option value="2">2 people</option>
                  <option value="4">4 people</option>
                  <option value="6">6 people</option>
                  <option value="8">8 people</option>
                  <option value="10">10+ people</option>
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={getRecipes}
                disabled={isGeneratingRecipes}
                className="flex-1 bg-green-600 text-white p-3 rounded-md flex items-center justify-center hover:bg-green-700 disabled:bg-gray-400"
              >
                {isGeneratingRecipes ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Search className="w-5 h-5 mr-2" />
                    Generate Recipes
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Recipe Results */}
        {recipes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recipe Suggestions</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{recipe.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{recipe.cookingTime}</span>
                      <ThermometerSun className="w-4 h-4 ml-4 mr-1" />
                      <span>{recipe.difficulty}</span>
                    </div>
                    <button
                      onClick={() => getDetailedInstructions(recipe)}
                      disabled={isLoadingDetails && selectedRecipe?.title === recipe.title}
                      className="w-full bg-black text-white p-2 rounded flex items-center justify-center disabled:bg-gray-400"
                    >
                      {isLoadingDetails && selectedRecipe?.title === recipe.title ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          View Recipe
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Instructions Modal */}
        {selectedRecipe && detailedInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
              <button
                onClick={() => {
                  setSelectedRecipe(null);
                  setDetailedInstructions(null);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold mb-4">{selectedRecipe.title}</h2>

              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Prep Time</p>
                  <p>{detailedInstructions.prepTime}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Cook Time</p>
                  <p>{detailedInstructions.cookTime}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Total Time</p>
                  <p>{detailedInstructions.totalTime}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Ingredients</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {detailedInstructions.ingredients.map((ingredient: string, index: number) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Instructions</h3>
                  <ol className="list-decimal pl-5 space-y-2">
                    {detailedInstructions.steps.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>

                {detailedInstructions.tips && (
                  <div>
                    <h3 className="font-semibold mb-2">Tips</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {detailedInstructions.tips.map((tip: string, index: number) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 