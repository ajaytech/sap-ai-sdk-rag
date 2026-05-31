# Quick Start - Grounding Example

Get the RAG pipeline running in **1 minute**! 🚀

## Prerequisites

- Node.js 18+
- Groq API key (free from https://console.groq.com/keys)

## Step 1: Set API Key & Run

```bash
# Navigate to grounding example
cd sample-grounding

# Set your Groq API key
export GROQ_API_KEY="your-groq-api-key-here"

# Install dependencies
npm install

# Run demo
npm run demo
```

**That's it!** No server needed - Groq API is OpenAI compatible!

## What You'll See

### Example Output

```
╔═══════════════════════════════════════════════════════╗
║   Grounding Pipeline with Data Masking - Demo        ║
║   Using Groq API (OpenAI Compatible)                 ║
╚═══════════════════════════════════════════════════════╝

📝 Step 1: Process User Query
─────────────────────────────────
Original query: How should I install 2 RAM modules?

🔍 Step 2: Search Knowledge Base
─────────────────────────────────
Retrieved 3 relevant chunks:
   1. chunk_mb_9901_002 (score: 0.845)
   2. chunk_mb_9901_001 (score: 0.723)
   3. chunk_mb_9901_003 (score: 0.612)

🤖 Step 4: Query LLM (Groq API)
─────────────────────────────────
✓ LLM responded in 1,234ms

📋 RESULT:
Response: According to chunk_mb_9901_002, when installing exactly
2 modules of RAM, they MUST be populated into slots A2 and B2 first...

Citations: chunk_mb_9901_002, chunk_mb_9901_001
```

## 6 Examples Demonstrated

1. **Basic Query** - Simple document search
2. **Query with PII** - Automatic masking demo
3. **Error Code** - Troubleshooting support
4. **Support Contact** - With PII masking
5. **Technical Query** - Complex questions
6. **No Answer** - Out-of-scope handling

## Try Your Own Query

Create a file `test-query.ts`:

```typescript
import { join } from 'path';
import { createVectorStore } from './vector-store.js';
import { createGroundingPipeline } from './grounding-pipeline.js';

const vectorStore = createVectorStore(
  join(process.cwd(), 'knowledge-base', 'motherboard-docs.md')
);

const pipeline = createGroundingPipeline(vectorStore, {
  url: 'https://api.groq.com/openai/v1',
  headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
});

const result = await pipeline.query('YOUR QUESTION HERE');

console.log('Response:', result.response);
console.log('Citations:', result.citations);
```

Run it:
```bash
tsx test-query.ts
```

## Test Individual Components

### Test Vector Store Only

```bash
npm run test:vector-store
```

### Test Masking Only

```bash
cd ../custom-llm-wrapper
npm run test:masking
```

## Common Issues

### "GROQ_API_KEY environment variable is required"

```bash
# Check if set
echo $GROQ_API_KEY

# Set it
export GROQ_API_KEY="your-key-here"

# Get your key from
# https://console.groq.com/keys
```

### "Failed to connect to Groq API"

```bash
# Check API key is valid
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"

# Should return list of models
```

### Cannot find module

```bash
# Make sure you're in the right directory
pwd
# Should show: .../sample-grounding

# Install dependencies
npm install

# If still fails, go to parent and install everything
cd ..
pnpm install
```

## What's Next?

### 1. Customize the Knowledge Base

Edit `knowledge-base/motherboard-docs.md` or add new files:

```markdown
## chunk_custom_001
**Component:** Your Product
**Category:** Your Category
**Content:**
Your documentation here...
```

### 2. Try Different Questions

```typescript
await pipeline.query('Your custom question?');
```

### 3. Adjust Configuration

```typescript
const pipeline = createGroundingPipeline(vectorStore, destination, {
  topK: 5,              // More chunks
  temperature: 0.3,     // More focused
  enableMasking: true   // Keep masking on
});
```

### 4. Add Custom Masking Rules

In `../custom-llm-wrapper/data-masking-layer.ts`:

```typescript
{
  type: 'custom',
  pattern: /YOUR-PATTERN/g,
  maskWith: '[YOUR_TYPE]'
}
```

## Quick Reference

### File Locations

- **Knowledge Base**: `knowledge-base/motherboard-docs.md`
- **Vector Store**: `vector-store.ts`
- **Pipeline**: `grounding-pipeline.ts`
- **Demo**: `demo.ts`

### Key Concepts

- **Grounding**: Connect LLM to your documents
- **RAG**: Retrieval Augmented Generation
- **Masking**: Hide PII before LLM
- **Citation**: Track which docs were used

### Typical Flow

```
Query → Mask → Search → Context → LLM → Unmask → Response
```

## Need Help?

- Read full docs: [README.md](README.md)
- Check main project: [../README.md](../README.md)
- Groq docs: [https://console.groq.com/docs](https://console.groq.com/docs)

## Why Groq?

- ✅ **OpenAI Compatible** - No wrapper server needed!
- ✅ **Ultra Fast** - 1-3 second responses
- ✅ **Free Tier** - Great for testing
- ✅ **Multiple Models** - Choose what fits your needs

---

**That's it! You're now running RAG with data masking using Groq! 🚀**
