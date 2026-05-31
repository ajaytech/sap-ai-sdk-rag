
import { checkGroqAPI, example1_basicQuery, llmAPIDestination } from "./util.js";

import { createVectorStore } from './vector-store.js';
import { createGroundingPipeline } from './grounding-pipeline.js';
import { join } from 'path';


const checkConnection = await checkGroqAPI();
if(!checkConnection){
	process.exit(1);
}


const vectorStrore  = new createVectorStore(join(process.cwd(),"knowledge-base","courses.md"));

console.log(vectorStrore.getStats());

const setting = {
  topK: 3,              // Number of chunks to retrieve
  temperature: 0.7,       // LLM temperature
  maxTokens: 1024,         // Max response tokens
  enableMasking: true,    // Enable PII masking
  usePatternPreservation: true // Use pattern-preserving masking
}

const groundPipeline = new createGroundingPipeline(vectorStrore,llmAPIDestination,setting);

// const query = "I have to create website with ReactJS what course to pick for that";
const query = 'I have to create a website with ReactJS tell me which course is best for me my email is abc.xyz@gmail.com';

const result = await groundPipeline.query(query,"openai/gpt-oss-120b");

console.log(result.response);
