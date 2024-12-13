import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    console.log('Starting image analysis with API key:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
    
    // Get the image data from the request
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      console.error('No image file provided');
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Log file details
    console.log('Processing file:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)}KB`
    });

    try {
      // Convert the file to base64
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString('base64');

      // Verify base64 image
      if (base64Image.length === 0) {
        console.error('Failed to convert image to base64');
        throw new Error('Failed to convert image to base64');
      }

      console.log('Image converted to base64, length:', base64Image.length);
      console.log('Making OpenAI API call...');

      try {
        // Make the API call
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "List all the food items and ingredients visible in this image. Respond with ONLY a comma-separated list of items, nothing else."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${file.type || 'image/jpeg'};base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300,
          temperature: 0.1
        });

        console.log('OpenAI API response received:', response);

        if (!response.choices?.[0]?.message?.content) {
          console.error('No content in OpenAI response:', response);
          throw new Error('No content in OpenAI response');
        }

        const content = response.choices[0].message.content.trim();
        console.log('Raw response:', content);

        // Parse ingredients from the response
        const ingredients = content
          .split(',')
          .map(item => item.trim())
          .filter(item => item && item.length > 0);

        if (ingredients.length === 0) {
          console.log('No ingredients detected in the response');
          return NextResponse.json({
            error: 'No ingredients detected in the image',
            debug: { content }
          }, { status: 400 });
        }

        return NextResponse.json({ 
          ingredients,
          debug: {
            content,
            fileInfo: {
              type: file.type,
              size: file.size,
              name: file.name
            }
          }
        });

      } catch (apiError: any) {
        console.error('OpenAI API Error:', {
          message: apiError.message,
          type: apiError.type,
          status: apiError.status,
          response: apiError.response?.data
        });
        throw apiError;
      }

    } catch (conversionError: any) {
      console.error('Image Conversion Error:', conversionError);
      return NextResponse.json({
        error: 'Failed to process image',
        details: conversionError.message
      }, { status: 500 });
    }

  } catch (error: any) {
    // Log the full error for debugging
    console.error('Full error:', {
      message: error.message,
      name: error.name,
      status: error.status,
      response: error.response?.data,
      stack: error.stack
    });

    // Check if it's an API key issue
    if (error.message?.includes('API key')) {
      return NextResponse.json({
        error: 'Invalid or missing API key. Please check your OpenAI API key configuration.',
        details: error.message
      }, { status: 401 });
    }

    // Check if it's a rate limit issue
    if (error.message?.includes('rate limit') || error.status === 429) {
      return NextResponse.json({
        error: 'Rate limit exceeded. Please try again later.',
        details: error.message
      }, { status: 429 });
    }

    // Check if it's a billing issue
    if (error.message?.includes('billing') || error.message?.includes('quota')) {
      return NextResponse.json({
        error: 'Account limit reached. Please check your OpenAI account.',
        details: error.message
      }, { status: 402 });
    }

    // Generic error response
    return NextResponse.json({
      error: 'Failed to analyze image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      debug: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        type: error.type,
        status: error.status,
        stack: error.stack
      } : undefined
    }, { status: 500 });
  }
} 