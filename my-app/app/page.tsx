import Link from "next/link";
import { Camera, Book, BookmarkCheck, Settings, User } from "lucide-react";

const features = [
  {
    title: "Scan Fridge",
    description: "Get recipe suggestions from your available ingredients",
    icon: <Camera className="w-6 h-6" />,
    href: "/fridge-scan",
    color: "bg-blue-500"
  },
  {
    title: "Recipes",
    description: "Browse our collection of recipes",
    icon: <Book className="w-6 h-6" />,
    href: "/recipes",
    color: "bg-green-500"
  },
  {
    title: "Profile",
    description: "Manage your preferences",
    icon: <User className="w-6 h-6" />,
    href: "/profile",
    color: "bg-red-500"
  },
  {
    title: "Settings",
    description: "Configure app settings",
    icon: <Settings className="w-6 h-6" />,
    href: "/settings",
    color: "bg-gray-500"
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section - More compact for mobile */}
      <div className="bg-white px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-3">
          Smart Recipe Assistant
        </h1>
        <p className="text-gray-600 text-center text-sm max-w-md mx-auto">
          Take a photo of your fridge or pantry and get instant recipe suggestions. 
          Save money and reduce food waste with AI-powered recommendations.
        </p>
      </div>

      {/* All Features in Vertical List */}
      <div className="px-4 py-6 space-y-4">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className="block w-full"
          >
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center space-x-4">
              <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
