# SAP AI SDK - RAG with Data Masking Example

[![SAP AI SDK](https://img.shields.io/badge/SAP-AI%20SDK-blue)](https://github.com/SAP/sap-ai-sdk)
[![Tutorial Video](https://img.shields.io/badge/YouTube-Tutorial-red)](https://www.youtube.com/watch?v=kz7gPoF9Shw&)

This project demonstrates a Document Grounding (RAG) pipeline with built-in Data Masking using the SAP AI SDK and Groq API (OpenAI compatible).

## 📺 Video Tutorial
Watch the step-by-step tutorial on YouTube:

[![Watch the video](https://img.youtube.com/vi/kz7gPoF9Shw/0.jpg)](https://www.youtube.com/watch?v=kz7gPoF9Shw&)

[Watch Tutorial on YouTube](https://www.youtube.com/watch?v=kz7gPoF9Shw&)

---

## 🎓 Full Course: Learn AI Development for SAP Developers
Accelerate your career by mastering AI development in the SAP ecosystem.

[![AI Development Course](https://s3.amazonaws.com/thinkific-import/17035%2FN3oShrOSBi0FNVPjYYjq_AI%20Development%20Course%20Image.png)](https://www.ui5cn.com/courses/learn-ai-development-for-sap-developers?coupon=LEARNSAPAI99)

[**Enroll in the Course Here (Special Discount Included)**](https://www.ui5cn.com/courses/learn-ai-development-for-sap-developers?coupon=LEARNSAPAI99)

---

## Quick Start

Get the RAG pipeline running in **1 minute**! 🚀

### Prerequisites

- Node.js 18+
- Groq API key (free from [https://console.groq.com/keys](https://console.groq.com/keys))

### Step 1: Set API Key & Run

```bash
# Set your Groq API key
export GROQ_API_KEY="your-groq-api-key-here"

# Install dependencies
npm install

# Run demo
npm run start1
```

*(Note: `npm run start1` executes `start_demo.ts`)*

## Features

- **Grounding (RAG)**: Connect your LLM to local documentation for accurate, context-aware answers.
- **Data Masking**: Automatically identify and mask PII (Emails, Names, IDs) before sending data to the LLM.
- **SAP AI SDK**: Built using the foundational capabilities of the SAP AI SDK.
- **Groq Integration**: Leverages Groq's ultra-fast, OpenAI-compatible API.

## Project Structure

- **`knowledge-base/`**: Contains the source documents (`courses.md`) used for grounding.
- **`vector-store.ts`**: Simple vector-based retrieval logic.
- **`data-masking-layer.ts`**: Logic for protecting sensitive data.
- **`grounding-pipeline.ts`**: Orchestrates the flow between masking, retrieval, and the LLM.
- **`start_demo.ts`**: The main entry point to see everything in action.

## Customizing the Knowledge Base

You can add or modify content in `knowledge-base/courses.md`. Use the following format for chunks:

```markdown
## chunk_id_001
**Component:** Subject Name
**Category:** Category Name
**Content:**
Your detailed documentation content here...
```

## Need Help?

- [SAP AI SDK Documentation](https://github.com/SAP/sap-ai-sdk)
- [Groq API Documentation](https://console.groq.com/docs)
- [UI5CN Course Support](https://www.ui5cn.com)

---

**Built with ❤️ for the SAP Developer Community.**
