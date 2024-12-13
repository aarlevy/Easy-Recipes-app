'use client';

import React, { createContext, useContext, useState } from 'react';

interface Recipe {
  title: string;
  cookingTime: string;
  difficulty: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    marketValue: number;
  }>;
  instructions: string[];
  totalValue: number;
  valuePerServing: number;
  servings: number;
}

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Recipe) => void;
  removeRecipe: (title: string) => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const addRecipe = (recipe: Recipe) => {
    setRecipes(prevRecipes => {
      // Check if recipe already exists
      const exists = prevRecipes.some(r => r.title === recipe.title);
      if (!exists) {
        return [...prevRecipes, recipe];
      }
      return prevRecipes;
    });
  };

  const removeRecipe = (title: string) => {
    setRecipes(prevRecipes => prevRecipes.filter(r => r.title !== title));
  };

  return (
    <RecipeContext.Provider value={{ recipes, addRecipe, removeRecipe }}>
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
} 