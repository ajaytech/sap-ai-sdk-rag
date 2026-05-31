
import { checkGroqAPI, example1_basicQuery, llmAPIDestination } from "./util.js";
import { createVectorStore } from './vector-store.js';
import { createGroundingPipeline } from './grounding-pipeline.js';
import { join } from 'path';


async function runDemo() {
  
  console.log('Step 1: Checking Groq API...\n');
  const apiReady = await checkGroqAPI();
  if (!apiReady) {
    process.exit(1);
  }

   console.log('\nStep 2: Loading Knowledge Base\n');

  const knowledgeBaseDir = join(process.cwd(), 'knowledge-base','courses.md');
  const vectorStore = new createVectorStore(knowledgeBaseDir);
  
  // // Load all markdown files from the knowledge-base directory
  // const fs = await import('fs');
  // const files = fs.readdirSync(knowledgeBaseDir);
  // for (const file of files) {
  //   if (file.endsWith('.md')) {
  //     vectorStore.loadFromMarkdown(join(knowledgeBaseDir, file));
  //   }
  // }


  const stats = vectorStore.getStats();
  console.log('\n📊 Knowledge Base Statistics:');
  console.log('   Total chunks:', stats.totalChunks);
  console.log('   Total words:', stats.totalWords);

  // Step 3: Initialize pipeline
  console.log('\nStep 3: Initializing Grounding Pipeline\n');

  const pipeline = createGroundingPipeline(vectorStore, llmAPIDestination, {
    topK: 3,
    temperature: 0.7,
    maxTokens: 1024,
    enableMasking: true,
    usePatternPreservation: true
  });

  // Step 4: Run examples
  console.log('\n' + '═'.repeat(60));
  console.log('\nStep 4: Running Examples\n');

  try {
    const query1 = 'I have to create a website with ReactJS tell me which course is best for me';
    
    await example1_basicQuery(pipeline,query1,"openai/gpt-oss-120b");
    
    // await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error: any) {
    console.error('\n❌ Error running examples:', error.message);
    throw error;
  }

  
}

// Run demo
runDemo().catch(error => {
  console.error('\n❌ Demo failed:', error);
  process.exit(1);
});