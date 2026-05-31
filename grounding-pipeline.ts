/**
 * Grounding Pipeline with Data Masking
 *
 * This implements a complete RAG (Retrieval Augmented Generation) pipeline:
 * 1. User query → Mask PII
 * 2. Search knowledge base (vector store)
 * 3. Retrieve relevant chunks
 * 4. Build context prompt
 * 5. Send to LLM (Gemini Flash/Other API)
 * 6. Get response
 * 7. Unmask any references
 * 8. Return to user
 */

import { OpenApiRequestBuilder, executeRequest } from '@sap-ai-sdk/core';
import type { HttpDestination } from '@sap-cloud-sdk/connectivity';
import { VectorStore, type SearchResult } from './vector-store.js';
import { AzureOpenAiChatCompletionResponse } from '@sap-ai-sdk/foundation-models';

// Import masking functions from custom wrapper
import {
  maskText,
  unmaskText,
  maskWithPatternPreservation,
  type MaskingResult
} from './data-masking-layer.js';

export interface GroundingConfig {
  topK?: number;              // Number of chunks to retrieve
  temperature?: number;       // LLM temperature
  maxTokens?: number;         // Max response tokens
  enableMasking?: boolean;    // Enable PII masking
  usePatternPreservation?: boolean; // Use pattern-preserving masking
}

export interface GroundingResult {
  query: string;
  maskedQuery: string;
  response: string;
  retrievedChunks: SearchResult[];
  maskedEntities: MaskingResult['entities'];
  tokenUsage?: any;
  processingTime: number;
  citations: string[];
}

/**
 * Grounding Pipeline Client
 */
export class GroundingPipeline {
  private vectorStore: VectorStore;
  private destination: HttpDestination;
  private config: Required<GroundingConfig>;

  constructor(
    vectorStore: VectorStore,
    llmDestination: HttpDestination,
    config: GroundingConfig = {}
  ) {
    this.vectorStore = vectorStore;
    this.destination = llmDestination;

    this.config = {
      topK: config.topK ?? 3,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 1024,
      enableMasking: config.enableMasking ?? true,
      usePatternPreservation: config.usePatternPreservation ?? true
    };

    console.log('🚀 Grounding Pipeline initialized');
    console.log('   Configuration:', this.config);
  }

  /**
   * Process a query with grounding and masking
   */
  async query(userQuery: string, llmModel: string): Promise<GroundingResult> {
    const startTime = Date.now();

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║       Grounding Pipeline with Data Masking           ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    // Step 1: Mask PII in user query
    console.log('📝 Step 1: Process User Query');
    console.log('─────────────────────────────────');
    console.log('Original query:', userQuery);

    let maskedQuery = userQuery;
    let maskingResult: MaskingResult = { maskedText: userQuery, entities: [] };

    if (this.config.enableMasking) {
      maskingResult = this.config.usePatternPreservation
        ? maskWithPatternPreservation(userQuery)
        : maskText(userQuery);

      maskedQuery = maskingResult.maskedText;

      if (maskingResult.entities.length > 0) {
        const msg = `\n Found ${maskingResult.entities.length} sensitive entities:`;
        console.log(msg);
        maskingResult.entities.forEach(entity => {
          console.log(`   • ${entity.type}: "${entity.original}" → "${entity.masked}"`);
        });
        console.log('\nMasked query:', maskedQuery);
      } else {
        console.log('✓ No PII detected in query');
      }
    } else {
      console.log('⚠️  Masking disabled');
    }

    // Step 2: Search knowledge base
    console.log('\n🔍 Step 2: Search Knowledge Base');
    console.log('─────────────────────────────────');
    const searchResults = this.vectorStore.search(maskedQuery, this.config.topK);

    console.log(`\nRetrieved ${searchResults.length} relevant chunks:`);
    searchResults.forEach(result => {
      console.log(`   ${result.rank}. ${result.chunk.id}`);
      console.log(`      Category: ${result.chunk.category}`);
      console.log(`      Score: ${result.score.toFixed(3)}`);
      console.log(`      Preview: ${result.chunk.content.substring(0, 80)}...`);
    });

    // Step 3: Build context prompt
    console.log('\n📄 Step 3: Build Context Prompt');
    console.log('─────────────────────────────────');

    const context = this.buildContext(searchResults);
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(maskedQuery, context);

    console.log('System prompt length:', systemPrompt.length, 'chars');
    console.log('Context length:', context.length, 'chars');
    console.log('User prompt length:', userPrompt.length, 'chars');

    // Step 4: Query LLM
    console.log('\n🤖 Step 4: Query LLM (Gemini Flash)');
    console.log('─────────────────────────────────');
    console.log('Sending request to Gemini Flash...');

    const llmStartTime = Date.now();

    // Use OpenApiRequestBuilder directly!
    const requestBuilder = new OpenApiRequestBuilder<any>(
      'post',
      '/chat/completions'  // Standard OpenAI format
    );

// const requestConfig = function (){
    
//       return {
//       body: {  
//         model: 'openai/gpt-oss-120b',
//         messages: [
//           { role: 'system', content: systemPrompt },
//           { role: 'user', content: userPrompt }
//         ],
//         temperature: this.config.temperature,
//         max_tokens: this.config.maxTokens
//       }
//     };
// }

// const llmResponse = await this.llmClient.run(
const request = {
      model: llmModel,
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt }
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens
    };

    // const llmResponse = await requestBuilder.executeRaw(this.destination,);

    const llmResponseRaw = await executeRequest({
            /*Changes the URL pattern here*/
            url: `/chat/completions`,
            apiVersion: '2024-10-21',
             deploymentId: 'v1' 
        }, request,this.config,this.destination);

   
    const llmResponse =  new AzureOpenAiChatCompletionResponse(llmResponseRaw);
    const responseContent = llmResponse.getContent() || '';
    

     console.log("==============");
    console.log({responseContent});

    console.log("==============");

    console.log('Response preview:', responseContent.substring(0, 150) + '...');


    console.log(JSON.stringify(llmResponse?.data?.choices));
    console.log("==============");


    // const llmResponse = await requestBuilder.execute(this.destination);

    const llmDuration = Date.now() - llmStartTime;
    console.log(`✓ LLM responded in ${llmDuration}ms`);
    console.log({llmResponse});
    // const responseContent = llmResponse.choices[0]?.message?.content || '';
    console.log('Response preview:', responseContent.substring(0, 150) + '...');

    // Step 5: Extract citations
    console.log('\n📚 Step 5: Extract Citations');
    console.log('─────────────────────────────────');
    const citations = this.extractCitations(searchResults);
    console.log('Citations:', citations.join(', '));

    // Step 6: Unmask response (if needed)
    console.log('\n🔓 Step 6: Unmask Response');
    console.log('─────────────────────────────────');

    let finalResponse = responseContent;
    if (this.config.enableMasking && maskingResult.entities.length > 0) {
      // Note: In practice, responses rarely contain the original masked data
      // This is more for demonstration
      console.log('Checking for masked references in response...');
      const hasReferences = maskingResult.entities.some(entity =>
        finalResponse.includes(entity.masked)
      );

      if (hasReferences) {
        finalResponse = unmaskText(finalResponse, maskingResult.entities);
        console.log('✓ Unmasked references in response');
      } else {
        console.log('✓ No masked references found in response');
      }
    } else {
      console.log('✓ No unmasking needed');
    }

    // Step 7: Return result
    const totalDuration = Date.now() - startTime;

    console.log('\n✅ Step 7: Pipeline Complete');
    console.log('─────────────────────────────────');
    console.log('Total processing time:', totalDuration, 'ms');
    console.log('Chunks retrieved:', searchResults.length);
    console.log('Entities masked:', maskingResult.entities.length);
    console.log('Token usage:', llmResponse.usage);

    return {
      query: userQuery,
      maskedQuery,
      response: finalResponse,
      retrievedChunks: searchResults,
      maskedEntities: maskingResult.entities,
      tokenUsage: llmResponse.usage,
      processingTime: totalDuration,
      citations
    };
  }

  /**
   * Build context from search results
   */
  private buildContext(searchResults: SearchResult[]): string {
    return searchResults
      .map(result => {
        return `[Source: ${result.chunk.id}]\n${result.chunk.content}\n`;
      })
      .join('\n---\n\n');
  }

  /**
   * Build system prompt
   */
  private buildSystemPrompt(): string {
    return `You are an academic advisor and course assistant. Your role is to help students with questions about course curriculum, specific topics covered in courses, learning objectives, and prerequisites.

IMPORTANT INSTRUCTIONS:
1. Answer questions ONLY based on the provided course documents
2. If the answer is not in the context, say "I don't have information about that course or topic in my curriculum database"
3. Always cite the source chunk ID when providing information (e.g., "According to chunk_course_cs101...")
4. Be clear, encouraging, and informative
5. If a student asks about a topic, relate it back to the course it belongs to
6. Mention prerequisites if the student asks about taking a specific course

Do not make up information. Only use the facts from the provided context.`;
  }

  /**
   * Build user prompt with context
   */
  private buildUserPrompt(query: string, context: string): string {
    return `Context Documents:
${context}

---

User Question: ${query}

Please answer the question based on the context documents above. Cite sources using chunk IDs.`;
  }

  /**
   * Extract citation chunk IDs
   */
  private extractCitations(searchResults: SearchResult[]): string[] {
    return searchResults.map(result => result.chunk.id);
  }

  /**
   * Get vector store statistics
   */
  getStats() {
    return {
      vectorStore: this.vectorStore.getStats(),
      config: this.config
    };
  }
}

/**
 * Create and initialize grounding pipeline
 */
export function createGroundingPipeline(
  vectorStore: VectorStore,
  llmDestination: HttpDestination,
  config?: GroundingConfig
): GroundingPipeline {
  return new GroundingPipeline(vectorStore, llmDestination, config);
}
