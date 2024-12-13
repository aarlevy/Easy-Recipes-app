'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type UserContextType = {
  recipesTried: number;
  moneySaved: number;
  location: string;
  notificationPreferences: {
    discountAlerts: boolean;
    weeklyDigest: boolean;
    radius: number; // in kilometers
    preferredStores?: string[];
    minPrice?: number;
    maxPrice?: number;
    preferredCategories?: string[];
  };
  incrementRecipesTried: () => void;
  addToMoneySaved: (amount: number) => void;
  updateLocation: (location: string) => void;
  updateNotificationPreferences: (prefs: Partial<{
    discountAlerts: boolean;
    weeklyDigest: boolean;
    radius: number;
    preferredStores?: string[];
    minPrice?: number;
    maxPrice?: number;
    preferredCategories?: string[];
  }>) => void;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [recipesTried, setRecipesTried] = useState(0);
  const [moneySaved, setMoneySaved] = useState(0);
  const [location, setLocation] = useState('');
  const [notificationPreferences, setNotificationPreferences] = useState({
    discountAlerts: true,
    weeklyDigest: true,
    radius: 5, // default 5km radius
    preferredStores: [],
    minPrice: 0,
    maxPrice: 100,
    preferredCategories: [],
  });

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('userData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setRecipesTried(data.recipesTried || 0);
      setMoneySaved(data.moneySaved || 0);
      setLocation(data.location || '');
      setNotificationPreferences(data.notificationPreferences || {
        discountAlerts: true,
        weeklyDigest: true,
        radius: 5,
        preferredStores: [],
        minPrice: 0,
        maxPrice: 100,
        preferredCategories: [],
      });
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userData', JSON.stringify({
      recipesTried,
      moneySaved,
      location,
      notificationPreferences,
    }));
  }, [recipesTried, moneySaved, location, notificationPreferences]);

  const incrementRecipesTried = () => {
    setRecipesTried(prev => prev + 1);
  };

  const addToMoneySaved = (amount: number) => {
    setMoneySaved(prev => prev + amount);
  };

  const updateLocation = (newLocation: string) => {
    setLocation(newLocation);
  };

  const updateNotificationPreferences = (prefs: Partial<{
    discountAlerts: boolean;
    weeklyDigest: boolean;
    radius: number;
    preferredStores?: string[];
    minPrice?: number;
    maxPrice?: number;
    preferredCategories?: string[];
  }>) => {
    setNotificationPreferences(prev => ({
      ...prev,
      ...prefs,
    }));
  };

  return (
    <UserContext.Provider value={{
      recipesTried,
      moneySaved,
      location,
      notificationPreferences,
      incrementRecipesTried,
      addToMoneySaved,
      updateLocation,
      updateNotificationPreferences,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 