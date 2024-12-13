import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function runScraper(location: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    // Log the current working directory and script path
    const scriptPath = path.join(process.cwd(), 'scripts', 'scrape_discounts.py');
    console.log('Current directory:', process.cwd());
    console.log('Script path:', scriptPath);
    console.log('Script exists:', fs.existsSync(scriptPath));

    // Check if Python is available
    const pythonVersion = spawn('python3', ['--version']);
    pythonVersion.stdout.on('data', (data) => {
      console.log('Python version:', data.toString());
    });
    pythonVersion.stderr.on('data', (data) => {
      console.error('Python version error:', data.toString());
    });

    const python = spawn('python3', [scriptPath, location]);
    let dataString = '';
    let errorString = '';
    
    python.stdout.on('data', (data) => {
      console.log('Python output:', data.toString());
      dataString += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      console.error('Python error:', data.toString());
      errorString += data.toString();
    });
    
    python.on('close', (code) => {
      console.log('Python process exited with code:', code);
      if (code !== 0) {
        reject(new Error(`Python process failed with code ${code}. Error: ${errorString}`));
        return;
      }
      
      try {
        // Try to parse the JSON output directly from stdout first
        try {
          const jsonStart = dataString.indexOf('[');
          const jsonEnd = dataString.lastIndexOf(']') + 1;
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const jsonStr = dataString.substring(jsonStart, jsonEnd);
            const discounts = JSON.parse(jsonStr);
            resolve(discounts);
            return;
          }
        } catch (e) {
          console.log('Could not parse JSON from stdout, trying file...');
        }

        // Fallback to reading from file
        const discountsPath = path.join(process.cwd(), 'discounts.json');
        console.log('Looking for discounts file at:', discountsPath);
        console.log('File exists:', fs.existsSync(discountsPath));
        
        if (!fs.existsSync(discountsPath)) {
          reject(new Error('Discounts file not found'));
          return;
        }

        const discountsData = fs.readFileSync(discountsPath, 'utf8');
        const discounts = JSON.parse(discountsData);
        resolve(discounts);
      } catch (error) {
        console.error('Error reading discounts:', error);
        reject(error);
      }
    });
  });
}

async function filterDiscountsWithGPT(
  discounts: any[],
  userPreferences: {
    categories: string[];
    dietaryPreferences?: string[];
    maxPrice?: number;
    minDiscount?: number;
  }
) {
  try {
    console.log('Filtering discounts with GPT. Input:', {
      discountsCount: discounts.length,
      preferences: userPreferences
    });

    // If no preferences are set, return all discounts
    if (
      userPreferences.categories.length === 0 &&
      !userPreferences.dietaryPreferences &&
      !userPreferences.maxPrice &&
      !userPreferences.minDiscount
    ) {
      console.log('No preferences set, returning all discounts');
      return discounts;
    }

    const prompt = `
      You are a helpful assistant that filters grocery discounts based on user preferences.
      Your task is to return a JSON object with a "discounts" array containing only the items that match the following criteria:

      ${userPreferences.categories.length > 0 ? `Categories of interest: ${userPreferences.categories.join(', ')}` : 'No category restrictions'}
      ${userPreferences.dietaryPreferences ? `Dietary preferences: ${userPreferences.dietaryPreferences.join(', ')}` : 'No dietary restrictions'}
      ${userPreferences.maxPrice ? `Maximum price: R${userPreferences.maxPrice}` : 'No maximum price'}
      ${userPreferences.minDiscount ? `Minimum discount percentage: ${userPreferences.minDiscount}%` : 'No minimum discount'}

      Rules for filtering:
      1. If no categories are specified, include all categories
      2. If no maximum price is set, include all prices
      3. If no minimum discount is set, include all discounts
      4. If dietary preferences are not specified, include all items

      Here are the discounts to filter:
      ${JSON.stringify(discounts, null, 2)}

      Please return a JSON object in this exact format:
      {
        "discounts": [
          // filtered discount objects here, maintaining their original structure
        ]
      }

      Include ALL fields from the original discount objects in your response.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    console.log('GPT response received');
    const content = completion.choices[0].message.content;
    const filtered = JSON.parse(content).discounts || [];
    console.log('Filtered discounts count:', filtered.length);
    return filtered;
  } catch (error) {
    console.error('Error in GPT filtering:', error);
    // If GPT filtering fails, return unfiltered discounts
    console.log('Falling back to unfiltered discounts');
    return discounts;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Discount API called');
    const searchParams = request.nextUrl.searchParams;
    const location = searchParams.get('location');
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const stores = searchParams.get('stores')?.split(',').filter(Boolean) || [];
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const radius = searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : undefined;

    console.log('Request parameters:', {
      location,
      categories,
      stores,
      maxPrice,
      minPrice,
      radius
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    // Run the Python scraper
    console.log('Starting Python scraper');
    const scrapedDiscounts = await runScraper(location);
    console.log('Scraper completed, found', scrapedDiscounts.length, 'discounts');

    // Filter discounts based on preferences
    let filteredDiscounts = scrapedDiscounts;

    // Filter by store if specified
    if (stores.length > 0) {
      filteredDiscounts = filteredDiscounts.filter(d => 
        stores.some(s => d.store.toLowerCase().includes(s.toLowerCase()))
      );
    }

    // Filter by category if specified
    if (categories.length > 0) {
      filteredDiscounts = filteredDiscounts.filter(d => 
        categories.some(c => d.category?.toLowerCase().includes(c.toLowerCase()))
      );
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      filteredDiscounts = filteredDiscounts.filter(d => {
        const price = parseFloat(d.price?.replace(/[£R]/g, '').trim());
        if (isNaN(price)) return false;
        if (minPrice !== undefined && price < minPrice) return false;
        if (maxPrice !== undefined && price > maxPrice) return false;
        return true;
      });
    }

    console.log('Filtering completed, returning', filteredDiscounts.length, 'discounts');
    return NextResponse.json({ discounts: filteredDiscounts });
  } catch (error: any) {
    console.error('Detailed error in discount API:', {
      error: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch discounts',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 