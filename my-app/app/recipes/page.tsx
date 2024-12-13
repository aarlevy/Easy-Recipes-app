'use client';

import Layout from '../../components/layout'
import { Clock, ThermometerSun, ChevronRight, X, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRecipes } from '../store/RecipeContext'
import { useState } from 'react';

export default function RecipeSuggestions() {
  const { recipes, removeRecipe } = useRecipes();
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  return (
    <Layout>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Your Recipes</h1>
        </div>
        <p className="text-gray-600 mb-4">Recipes you've discovered from your ingredients.</p>
        
        {recipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No recipes saved yet.</p>
            <Link href="/fridge-scan" className="text-green-600 hover:underline mt-2 inline-block">
              Scan your fridge to discover recipes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedRecipe(recipe)}
                      className="flex-1 bg-black text-white p-2 rounded flex items-center justify-center"
                    >
                      View Recipe
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                    <button
                      onClick={() => removeRecipe(recipe.title)}
                      className="bg-red-500 text-white p-2 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recipe Details Modal */}
        {selectedRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold mb-4">{selectedRecipe.title}</h2>

              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Cooking Time</p>
                  <p>{selectedRecipe.cookingTime}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Difficulty</p>
                  <p>{selectedRecipe.difficulty}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Servings</p>
                  <p>{selectedRecipe.servings}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Ingredients</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {selectedRecipe.ingredients.map((ingredient: any, index: number) => (
                      <li key={index}>{`${ingredient.quantity} ${ingredient.name}`}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Instructions</h3>
                  <ol className="list-decimal pl-5 space-y-2">
                    {selectedRecipe.instructions.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

