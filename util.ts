/**
 * Grounding Demo with Data Masking
 *
 * This demonstrates a complete RAG pipeline with:
 * - Document grounding (knowledge base search)
 * - Data masking (PII protection)
 * - Groq LLM integration (OpenAI compatible - no wrapper needed!)
 * - Response unmasking
 */

import { join } from 'path';
import type { HttpDestination } from '@sap-cloud-sdk/connectivity';
import { createVectorStore } from './vector-store.js';
import { createGroundingPipeline } from './grounding-pipeline.js';

// Check for Groq API key
//Replace this with new Key of Gorq 
const GROQ_API_KEY = "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";

if (!GROQ_API_KEY) {
  console.error('\n❌ Error: GROQ_API_KEY environment variable is required');
  console.error('\nGet your API key from: https://console.groq.com/keys');
  console.error('\nUsage:');
  console.error('  export GROQ_API_KEY="your-key-here"');
  console.error('  npm run demo\n');
  process.exit(1);
}

// Groq destination (OpenAI compatible - no local server needed!)
export const llmAPIDestination: HttpDestination = {
  url: 'https://api.groq.com/openai/v1',
  headers: {
    Authorization: `Bearer ${GROQ_API_KEY}`
  }
};

/**
 * Check Groq API connectivity
 */
export async function checkGroqAPI(): Promise<boolean> {
  try {
    console.log('Checking Groq API connectivity...');

    // Simple test request to verify API key and connectivity
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      const response = `API returned ${response.status}: ${errorText}`;
      throw new Error(response);
    }

    const data = await response.json();
    console.log('✓ Groq API is accessible');
    console.log('✓ Available models:', data.data?.length || 'multiple');
    return true;
  } catch (error: any) {
    console.error('\n❌ Failed to connect to Groq API!');
    console.error('\nError:', error.message);
    console.error('\nPlease check:');
    console.error('  1. GROQ_API_KEY is set correctly');
    console.error('  2. API key is valid (get one at https://console.groq.com/keys)');
    console.error('  3. You have internet connectivity\n');
    return false;
  }
}

/**
 * Example 1: Basic grounding query
 */
export async function example1_basicQuery(pipeline: any, query: string, llmName: string) {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║   Example 1: Basic Grounding Query                   ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  const result = await pipeline.query(query,llmName);

  console.log('\n📋 RESULT:');
  console.log('─────────────────────────────────────');
  console.log('Query:', result.query);
  console.log('\nResponse:');
  console.log(result.response);
  console.log('\nCitations:', result.citations.join(', '));
  console.log('Processing time:', result.processingTime, 'ms');

  return result;
}

