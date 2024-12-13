'use client';

import Layout from '../../components/layout';
import { MapPin, Calendar, RefreshCw } from 'lucide-react';
import { useUser } from '../store/UserContext';
import { useState, useEffect } from 'react';

interface Discount {
  store: string;
  item: string;
  discount: string;
  originalPrice?: number;
  discountedPrice?: number;
  location: string;
  validUntil?: string;
  category: string;
  url?: string;
  claimed?: boolean;
}

export default function Discounts() {
  const { addToMoneySaved, location, notificationPreferences } = useUser();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{message: string; details?: string} | null>(null);
  const [distance, setDistance] = useState(notificationPreferences.radius.toString());
  const [category, setCategory] = useState('');

  const fetchDiscounts = async () => {
    if (!location) {
      setError({message: 'Please set your location in the profile page to see local deals'});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        location,
        ...(category && { categories: category }),
        ...(notificationPreferences.preferredCategories && 
          notificationPreferences.preferredCategories.length > 0 && { 
            categories: notificationPreferences.preferredCategories.join(',') 
        }),
        ...(notificationPreferences.minPrice !== undefined && { 
          minPrice: notificationPreferences.minPrice.toString() 
        }),
        ...(notificationPreferences.maxPrice !== undefined && { 
          maxPrice: notificationPreferences.maxPrice.toString() 
        }),
        ...(notificationPreferences.preferredStores && 
          notificationPreferences.preferredStores.length > 0 && {
            stores: notificationPreferences.preferredStores.join(',')
        }),
        radius: notificationPreferences.radius.toString()
      });

      console.log('Fetching discounts with params:', params.toString());
      const response = await fetch(`/api/fetch-discounts?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to fetch discounts');
      }

      console.log('Received discounts:', data.discounts);
      setDiscounts(data.discounts.map((discount: Discount) => ({
        ...discount,
        claimed: false
      })));
    } catch (error: any) {
      console.error('Error fetching discounts:', error);
      setError({
        message: 'Failed to load discounts. Please try again.',
        details: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [location]);

  const handleClaimDiscount = (discount: Discount) => {
    if (discount.claimed) return;

    setDiscounts(prevDiscounts =>
      prevDiscounts.map(d => {
        if (d === discount) {
          // If we have original and discounted prices, calculate savings
          if (d.originalPrice && d.discountedPrice) {
            const savedAmount = d.originalPrice - d.discountedPrice;
            addToMoneySaved(savedAmount);
          } else {
            // If we don't have exact prices, estimate savings from the discount text
            const match = d.discount.match(/\$(\d+(\.\d{2})?)|(\d+)%/);
            if (match) {
              const amount = parseFloat(match[1] || match[3]);
              // If it's a percentage, estimate based on a $50 average purchase
              const savedAmount = match[3] ? (50 * amount / 100) : amount;
              addToMoneySaved(savedAmount);
            }
          }
          return { ...d, claimed: true };
        }
        return d;
      })
    );
  };

  return (
    <Layout>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Nearby Discounts</h1>
            <p className="text-gray-600">
              {location 
                ? `Finding deals near ${location}`
                : 'Set your location in profile to find nearby deals'}
            </p>
          </div>
          <button
            onClick={fetchDiscounts}
            className="p-2 text-green-600 hover:bg-green-50 rounded-full"
            disabled={loading}
          >
            <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            <p className="font-bold">{error.message}</p>
            {error.details && (
              <p className="mt-2 text-sm">{error.details}</p>
            )}
          </div>
        )}
        
        <div className="mb-4 space-x-2">
          <select 
            className="p-2 border rounded-md"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
          >
            <option value="">Distance</option>
            <option value="1">1 km</option>
            <option value="2">2 km</option>
            <option value="5">5 km</option>
            <option value="10">10 km</option>
          </select>
          <select 
            className="p-2 border rounded-md"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              fetchDiscounts();
            }}
          >
            <option value="">All Categories</option>
            <option value="meat">Meat</option>
            <option value="dairy">Dairy</option>
            <option value="produce">Produce</option>
            <option value="vegetables">Vegetables</option>
            <option value="fruits">Fruits</option>
            <option value="beverages">Beverages</option>
            <option value="snacks">Snacks</option>
            <option value="bakery">Bakery</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : discounts.length > 0 ? (
          <div className="space-y-4">
            {discounts.map((discount, index) => (
              <div key={index} className="border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{discount.store}</h3>
                  {discount.url && (
                    <a
                      href={discount.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:underline"
                    >
                      View Online
                    </a>
                  )}
                </div>
                <p className="text-lg font-medium text-green-600 mb-2">
                  {discount.discount}
                </p>
                <p className="mb-2">{discount.item}</p>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin size={16} className="mr-1" />
                  {discount.location}
                </div>
                {discount.validUntil && (
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Calendar size={16} className="mr-1" />
                    Valid until {discount.validUntil}
                  </div>
                )}
                <button 
                  onClick={() => handleClaimDiscount(discount)}
                  className={`w-full p-2 rounded-md ${
                    discount.claimed 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  disabled={discount.claimed}
                >
                  {discount.claimed ? 'Discount Claimed' : 'Claim Discount'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No discounts found. Try adjusting your filters or location.
          </div>
        )}
      </div>
    </Layout>
  );
}

