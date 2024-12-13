import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testAPI() {
  try {
    console.log('Testing API connection...');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say hello world!"
        }
      ]
    });
    console.log('API Response:', response.choices[0].message.content);
    console.log('API Key is working correctly!');
  } catch (error) {
    console.error('API Error:', {
      message: error.message,
      type: error.type,
      status: error.status,
      details: error.response?.data
    });
  }
}

testAPI(); 