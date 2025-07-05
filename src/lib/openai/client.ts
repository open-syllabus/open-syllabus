// src/lib/openai/client.ts
import { OpenAI } from 'openai';

// Initialize the OpenAI client with API key from environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('[OpenAI Client] OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing-api-key',
});

export default openai;