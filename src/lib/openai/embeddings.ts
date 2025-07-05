// src/lib/openai/embeddings.ts
import openai from './client';

/**
 * Generate embeddings for a text using OpenAI's embedding model
 * @param text The text to generate embeddings for
 * @returns An array of floating point numbers representing the embedding
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small", // This is already the fastest model
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Alternative: Use ada-002 model which is faster but slightly less accurate
 */
export async function generateEmbeddingFast(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002", // Faster, cheaper, but less accurate
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Generate embeddings for multiple texts in a batch
 * @param texts Array of texts to generate embeddings for
 * @returns Array of embedding arrays
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    console.log(`[EMBEDDINGS] Generating embeddings for ${texts.length} texts`);
    
    // Check if API key is present
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
      encoding_format: "float",
    });

    console.log(`[EMBEDDINGS] Successfully generated ${response.data.length} embeddings`);
    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('[EMBEDDINGS] Error generating embeddings:', error);
    console.error('[EMBEDDINGS] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}