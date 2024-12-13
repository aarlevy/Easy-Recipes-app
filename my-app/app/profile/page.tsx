'use client';

import { useState } from 'react';
import { Edit2, Save, MapPin } from 'lucide-react';
import { useUser } from '../store/UserContext';

export default function UserProfile() {
  const {
    recipesTried,
    moneySaved,
    location,
    updateLocation,
  } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [tempLocation, setTempLocation] = useState(location);

  const handleSave = () => {
    updateLocation(tempLocation);
    setIsEditing(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Your Profile</h1>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="flex items-center text-blue-600"
        >
          {isEditing ? (
            <>
              <Save size={20} className="mr-1" />
              Save
            </>
          ) : (
            <>
              <Edit2 size={20} className="mr-1" />
              Edit
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Activity Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3">Activity Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-600">Recipes Tried</p>
              <p className="text-2xl font-bold text-blue-700">{recipesTried}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-600">Money Saved</p>
              <p className="text-2xl font-bold text-green-700">${moneySaved.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Location Settings */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center mb-3">
            <MapPin className="w-5 h-5 mr-2 text-gray-500" />
            <h2 className="text-lg font-semibold">Location</h2>
          </div>
          {isEditing ? (
            <select
              value={tempLocation}
              onChange={(e) => setTempLocation(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select your location</option>
              <option value="London">London</option>
              <option value="Cape Town">Cape Town</option>
            </select>
          ) : (
            <p className="text-gray-600">
              {location || 'No location set'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

