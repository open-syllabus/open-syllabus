// NotebookLM-style document-only chat processor
import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/openai/embeddings';
import { queryVectors } from '@/lib/pinecone/utils';

const NOTEBOOK_LM_SYSTEM_PROMPT = `You are an intelligent educational assistant that provides thoughtful, nuanced responses based on your knowledge base.

CORE PRINCIPLES:
1. Base all factual claims on the provided document excerpts, using [number] citations
2. You can synthesize, analyze, and draw connections between different parts of the material
3. Be creative in how you explain concepts - use analogies, examples, and different perspectives
4. Understand the intent behind questions and provide helpful, relevant responses
5. If asked about something not in your knowledge base, acknowledge this naturally and guide the conversation to related topics you can discuss

RESPONSE STYLE:
- Be conversational, engaging, and pedagogically thoughtful
- Connect ideas across different parts of your knowledge base
- Provide context and explain the "why" behind concepts
- Use examples and analogies to clarify complex ideas
- Adapt your response style to the user's apparent level and needs
- Include citations [1] naturally when referencing specific facts

IMPORTANT:
- You can infer, explain, and elaborate based on the source material
- You can answer "how" and "why" questions by synthesizing information
- You can suggest related topics and make connections
- Stay grounded in the source material but be intellectually flexible`;

interface NotebookLMResponse {
  content: string;
  citations: Citation[];
  confidence: number;
  documentsUsed: string[];
}

interface Citation {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber?: number;
  text: string;
  score: number;
}

export async function processNotebookLMQuery(
  query: string,
  chatbotId: string,
  options: {
    minConfidence?: number;
    maxSources?: number;
    requireCitations?: boolean;
  } = {}
) {
  const { 
    minConfidence = 0.65, // Lowered to be more inclusive of related content
    maxSources = 8, // Increased to provide more context
    requireCitations = true 
  } = options;

  try {
    console.log(`[NotebookLM] Processing query: "${query}" for chatbot: ${chatbotId}`);
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search for relevant document chunks
    const searchResults = await queryVectors(
      queryEmbedding,
      chatbotId,
      maxSources * 3 // Get more results to have better coverage
    );
    
    console.log(`[NotebookLM] Found ${searchResults.length} search results`);
    console.log(`[NotebookLM] Min confidence required: ${minConfidence}`);
    
    // Log the scores of all results
    searchResults.forEach((match, i) => {
      console.log(`[NotebookLM] Result ${i}: score=${match.score}, id=${match.id}`);
    });
    
    // Filter by confidence score
    const relevantChunks = searchResults
      .filter(match => match.score !== undefined && match.score >= minConfidence)
      .slice(0, maxSources);
    
    console.log(`[NotebookLM] ${relevantChunks.length} chunks passed confidence filter`);
    
    // If no relevant documents found
    if (relevantChunks.length === 0) {
      // Get a sample of what IS in the knowledge base to suggest topics
      const sampleResults = searchResults.slice(0, 3);
      const topicHints = new Set<string>();
      
      sampleResults.forEach(result => {
        const text = String(result.metadata?.text || '').toLowerCase();
        // Extract key phrases or topics from the sample text
        if (text.includes('ways of knowing')) topicHints.add('ways of knowing');
        if (text.includes('knowledge questions')) topicHints.add('knowledge questions');
        if (text.includes('areas of knowledge')) topicHints.add('areas of knowledge');
        if (text.includes('tok')) topicHints.add('Theory of Knowledge concepts');
        if (text.includes('emotion') || text.includes('reason') || text.includes('language')) topicHints.add('specific ways of knowing like emotion, reason, or language');
        if (text.includes('ethics') || text.includes('natural sciences') || text.includes('mathematics')) topicHints.add('areas of knowledge like ethics, natural sciences, or mathematics');
      });
      
      const topics = Array.from(topicHints).slice(0, 3);
      
      // Use AI to generate helpful clarifying questions based on the search results
      const clarifyingPrompt = `The user asked: "${query}"

I have some related content in my knowledge base. Here are relevant excerpts:
${sampleResults.map(r => {
  const text = r.metadata?.text;
  if (typeof text === 'string') {
    return text.substring(0, 300);
  }
  return '';
}).join('\n\n')}

Generate a helpful response that:
1. Shows you understand what they're asking about
2. Explains what related information you DO have (based on the excerpts)
3. Offers to explore related angles or aspects of their question
4. Suggests 2-3 specific ways to approach their topic based on your available knowledge
5. Maintains an engaging, helpful tone

Be creative in finding connections between their question and your knowledge base.`;

      try {
        const clarifyingResponse = await generateNotebookLMResponse(clarifyingPrompt);
        return {
          content: clarifyingResponse,
          citations: [],
          confidence: 0,
          documentsUsed: []
        };
      } catch (error) {
        // Fallback to simple response if AI generation fails
        let response = `I'm not finding specific information about "${query}" in my current knowledge base. `;
        
        if (topics.length > 0) {
          response += `\n\nI do have information about:\n`;
          topics.forEach(topic => {
            response += `• ${topic}\n`;
          });
          response += `\nCould you rephrase your question or ask about one of these topics?`;
        } else {
          response += `\n\nCould you try rephrasing your question or asking about a specific aspect of the topic?`;
        }
        
        return {
          content: response,
          citations: [],
          confidence: 0,
          documentsUsed: []
        };
      }
    }
    
    // Build context with citations
    const citations: Citation[] = [];
    const contextParts: string[] = [];
    const documentsUsed = new Set<string>();
    
    relevantChunks.forEach((chunk, index) => {
      const citationId = `[${index + 1}]`;
      
      // Safely extract metadata values with type conversions
      const documentId = String(chunk.metadata?.documentId || '');
      const fileName = String(chunk.metadata?.fileName || 'Unknown Document');
      const text = String(chunk.metadata?.text || '');
      const pageNumber = chunk.metadata?.pageNumber ? Number(chunk.metadata.pageNumber) : undefined;
      
      const citation: Citation = {
        id: citationId,
        documentId: documentId,
        documentName: fileName,
        pageNumber: pageNumber,
        text: text,
        score: chunk.score || 0
      };
      
      citations.push(citation);
      documentsUsed.add(fileName);
      
      contextParts.push(
        `${citationId} From "${fileName}"${
          pageNumber ? ` (page ${pageNumber})` : ''
        } [confidence: ${((chunk.score || 0) * 100).toFixed(1)}%]:\n${text}`
      );
    });
    
    // Calculate overall confidence
    const avgConfidence = relevantChunks.reduce((sum, chunk) => sum + (chunk.score || 0), 0) / relevantChunks.length;
    
    // Build the prompt
    const prompt = `${NOTEBOOK_LM_SYSTEM_PROMPT}

Context information from your knowledge base:
${contextParts.join('\n\n---\n\n')}

User Question: ${query}

Instructions:
- Understand the nuance and intent of the question
- Synthesize information across the provided excerpts
- Be creative in your explanations while staying grounded in the facts
- Make connections between different concepts
- Use analogies or examples to clarify complex ideas
- Include [number] citations when referencing specific information
- If the question asks for analysis, comparison, or application, provide thoughtful insights based on the material
- Adapt your response to what would be most helpful for the user`;

    // Generate response using OpenRouter
    const response = await generateNotebookLMResponse(prompt);
    
    return {
      content: response,
      citations,
      confidence: avgConfidence,
      documentsUsed: Array.from(documentsUsed)
    };
    
  } catch (error) {
    console.error('NotebookLM processing error:', error);
    throw error;
  }
}

async function generateNotebookLMResponse(prompt: string): Promise<string> {
  const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Skolr NotebookLM'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-preview-05-20', // Using Gemini Flash 2.5 for 1M token context
      messages: [
        {
          role: 'system',
          content: NOTEBOOK_LM_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7, // Balanced temperature for creative yet grounded responses
      max_tokens: 8000 // Increased for more comprehensive responses with citations
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Unable to generate response';
}

// Helper function to extract citations from response
export function extractCitationsFromResponse(
  response: string,
  citations: Citation[]
): { text: string; citations: Citation[] }[] {
  const segments: { text: string; citations: Citation[] }[] = [];
  const citationRegex = /\[(\d+(?:,\s*\d+)*)\]/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = citationRegex.exec(response)) !== null) {
    // Add text before citation
    if (match.index > lastIndex) {
      segments.push({
        text: response.slice(lastIndex, match.index),
        citations: []
      });
    }
    
    // Parse citation numbers
    const citationNumbers = match[1].split(',').map(n => parseInt(n.trim()));
    const relevantCitations = citationNumbers
      .map(num => citations.find(c => c.id === `[${num}]`))
      .filter(Boolean) as Citation[];
    
    segments.push({
      text: match[0],
      citations: relevantCitations
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < response.length) {
    segments.push({
      text: response.slice(lastIndex),
      citations: []
    });
  }
  
  return segments;
}