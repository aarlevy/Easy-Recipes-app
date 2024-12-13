import Layout from '../../components/layout'
import { Trash2 } from 'lucide-react'
import Link from 'next/link'

const savedRecipes = [
  { id: 1, title: 'Leftover Chicken Stir Fry', image: '/placeholder.svg' },
  { id: 2, title: 'Vegetable Frittata', image: '/placeholder.svg' },
  { id: 3, title: 'Quick Pasta Salad', image: '/placeholder.svg' },
]

export default function SavedRecipes() {
  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4">Saved Recipes</h1>
        {savedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedRecipes.map((recipe) => (
              <div key={recipe.id} className="border rounded-lg overflow-hidden shadow-sm">
                <img src={recipe.image} alt={recipe.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{recipe.title}</h3>
                  <button className="w-full bg-red-500 text-white p-2 rounded-md flex items-center justify-center mt-2">
                    <Trash2 size={16} className="mr-2" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">
            No saved recipes yet. Find recipes to save from the Home Screen.
          </p>
        )}
        <Link href="/" className="block text-center mt-6 text-green-600">
          Back to Home
        </Link>
      </div>
    </Layout>
  )
}

