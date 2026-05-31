/**
 * Simple Vector Store for Document Grounding
 *
 * This implements a basic in-memory vector store for RAG (Retrieval Augmented Generation).
 * Uses simple TF-IDF-like scoring for similarity search.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface DocumentChunk {
  id: string;
  component: string;
  category: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  rank: number;
}

/**
 * Parse markdown document into chunks
 */
export function parseMarkdownToChunks(filePath: string): DocumentChunk[] {
  const content = readFileSync(filePath, 'utf-8');
  const chunks: DocumentChunk[] = [];

  // Split by ## headers (each chunk starts with ##)
  const sections = content.split(/(?=^## chunk_)/m);

  for (const section of sections) {
    if (!section.trim() || !section.includes('chunk_')) continue;

    // Extract chunk ID
    const idMatch = section.match(/## (chunk_\w+)/);
    if (!idMatch) continue;

    const id = idMatch[1];

    // Extract component
    const componentMatch = section.match(/\*\*Component:\*\* (.+)/);
    const component = componentMatch ? componentMatch[1].trim() : 'Unknown';

    // Extract category
    const categoryMatch = section.match(/\*\*Category:\*\* (.+)/);
    const category = categoryMatch ? categoryMatch[1].trim() : 'General';

    // Extract content (everything after **Content:** until next section or ---)<br/>    
    const contentMatch = section.match(/\*\*Content:\*\*\s+([\s\S]+?)(?=\n---|\n##|$)/);
    const chunkContent = contentMatch ? contentMatch[1].trim() : section;

    // Extract metadata (any other fields)
    const metadata: Record<string, any> = {};

    // Extract contact info if present
    const emailMatches = chunkContent.match(/[\w.-]+@[\w.-]+\.\w+/g);
    const phoneMatches = chunkContent.match(/\d{1}-\d{3}-\d{3}-\d{4}/g);
    const customerIdMatch = chunkContent.match(/Customer ID: ([\w-]+)/);
    const serialMatch = chunkContent.match(/Serial Number.*?: ([\w-]+)/);

    if (emailMatches) metadata.emails = emailMatches;
    if (phoneMatches) metadata.phones = phoneMatches;
    if (customerIdMatch) metadata.customerId = customerIdMatch[1];
    if (serialMatch) metadata.serialNumber = serialMatch[1];

    chunks.push({
      id,
      component,
      category,
      content: chunkContent,
      metadata
    });
  }

  return chunks;
}

/**
 * Simple tokenizer for text
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2); // Remove very short words
}

/**
 * Calculate simple TF-IDF style similarity score
 */
function calculateSimilarity(query: string, document: string): number {
  const queryTokens = tokenize(query);
  const docTokens = tokenize(document);

  if (queryTokens.length === 0 || docTokens.length === 0) return 0;

  // Count matching tokens
  let matches = 0;
  const docTokenSet = new Set(docTokens);

  for (const token of queryTokens) {
    if (docTokenSet.has(token)) {
      matches++;
    }
  }

  // Boost score for exact phrase matches
  const queryLower = query.toLowerCase();
  const docLower = document.toLowerCase();

  if (docLower.includes(queryLower)) {
    matches += queryTokens.length * 2; // Double bonus for exact match
  }

  // Calculate similarity (Jaccard-like coefficient)
  const union = new Set([...queryTokens, ...docTokens]).size;
  const basicScore = matches / Math.sqrt(queryTokens.length * docTokens.length);

  // Boost for category/component matches
  let boost = 1.0;
  if (queryLower.includes('ram') && docLower.includes('ram')) boost += 0.3;
  if (queryLower.includes('error') && docLower.includes('error')) boost += 0.3;
  if (queryLower.includes('boot') && docLower.includes('boot')) boost += 0.3;

  return basicScore * boost;
}

/**
 * In-Memory Vector Store
 */
export class VectorStore {
  private chunks: DocumentChunk[] = [];

  constructor() {}

  /**
   * Load documents from markdown file
   */
  loadFromMarkdown(filePath: string): void {
    console.log(`📚 Loading documents from: ${filePath}`);
    const newChunks = parseMarkdownToChunks(filePath);
    this.chunks.push(...newChunks);
    console.log(`✓ Loaded ${newChunks.length} chunks (Total: ${this.chunks.length})`);
  }

  /**
   * Add a single chunk
   */
  addChunk(chunk: DocumentChunk): void {
    this.chunks.push(chunk);
  }

  /**
   * Search for relevant chunks
   */
  search(query: string, topK: number = 3): SearchResult[] {
    console.log(`\n🔍 Searching for: "${query}"`);
    console.log(`   Searching through ${this.chunks.length} chunks...`);

    // Calculate similarity scores
    const results = this.chunks.map(chunk => ({
      chunk,
      score: calculateSimilarity(query, chunk.content + ' ' + chunk.component + ' ' + chunk.category)
    }));

    // Sort by score (descending) and take top K
    const topResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((result, index) => ({
        ...result,
        rank: index + 1
      }));

    console.log(`✓ Found ${topResults.length} relevant chunks`);
    topResults.forEach(result => {
      console.log(`   ${result.rank}. ${result.chunk.id} (score: ${result.score.toFixed(3)})`);
    });

    return topResults;
  }

  /**
   * Get chunk by ID
   */
  getChunkById(id: string): DocumentChunk | undefined {
    return this.chunks.find(chunk => chunk.id === id);
  }

  /**
   * Get all chunks
   */
  getAllChunks(): DocumentChunk[] {
    return this.chunks;
  }

  /**
   * Get statistics
   */
  getStats() {
    const categories = new Set(this.chunks.map(c => c.category));
    const totalWords = this.chunks.reduce((sum, c) => sum + c.content.split(' ').length, 0);

    return {
      totalChunks: this.chunks.length,
      categories: Array.from(categories),
      totalWords,
      averageWordsPerChunk: Math.round(totalWords / this.chunks.length)
    };
  }
}

/**
 * Create and initialize vector store
 */
export function createVectorStore(knowledgeBasePath: string): VectorStore {
  const store = new VectorStore();
  store.loadFromMarkdown(knowledgeBasePath);
  return store;
}
