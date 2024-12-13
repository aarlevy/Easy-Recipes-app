import Layout from '../../components/layout'
import { Camera, Search } from 'lucide-react'

export default function ConvertLeftovers() {
  return (
    <Layout>
      <div className="p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-center">What's in Your Kitchen?</h1>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter ingredients here..."
            className="w-full p-2 border rounded-md"
          />
          <button className="w-full bg-gray-200 text-gray-800 p-2 rounded-md flex items-center justify-center">
            <Camera className="mr-2" size={20} />
            Scan Your Fridge
          </button>
          <div className="space-y-2">
            <select className="w-full p-2 border rounded-md">
              <option value="">Dietary Preferences</option>
              <option value="vegan">Vegan</option>
              <option value="gluten-free">Gluten-Free</option>
            </select>
            <select className="w-full p-2 border rounded-md">
              <option value="">Cooking Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select className="w-full p-2 border rounded-md">
              <option value="">Preparation Time</option>
              <option value="15">{'< 15 min'}</option>
              <option value="30">15-30 min</option>
              <option value="45">30-45 min</option>
            </select>
          </div>
          <button className="w-full bg-green-600 text-white p-3 rounded-md flex items-center justify-center">
            <Search className="mr-2" size={20} />
            Generate Recipes
          </button>
        </div>
      </div>
    </Layout>
  )
}

