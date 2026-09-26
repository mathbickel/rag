import { ChromaClient } from "chromadb";
import OpenAI from "openai";
import "dotenv/config";

const COLLECTION_NAME = "mcu_data";          // Change to your collection name
const CHROMA_PATH = "./chroma_db";           // Path to your Chroma persistent storage
const EMBEDDING_MODEL = "all-MiniLM-L6-v2"; // The model used during ingestion (default for Chroma)
const N_RESULTS = 5;                         // Number of context chunks to retrieve
const DEEPSEEK_MODEL = "deepseek-chat";      // or "deepseek-reasoner"
const TEMPERATURE = 0.2;
const MAX_TOKENS = 500;



const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,   // Store in .env: DEEPSEEK_API_KEY=sk-...
  baseURL: "https://api.deepseek.com",
});

// ========== CHROMA CLIENT ==========
const chroma = new ChromaClient({ path: CHROMA_PATH });

// ========== MAIN FUNCTION ==========
/**
 * Ask a question and get an answer based on your Chroma vector store.
 * @param question - The user's question.
 * @returns The answer from DeepSeek.
 */
async function askMCU(question: string): Promise<string> {
  try {
    // 1. Connect to the collection (embedding function is automatically loaded)
    const collection = await chroma.getCollection({
      name: COLLECTION_NAME,
      // If you used a custom embedding function during ingestion, you must pass it here.
      // embeddingFunction: myCustomEmbeddingFunction,
    });

    // 2. Retrieve relevant chunks
    const results = await collection.query({
      queryTexts: [question],
      nResults: N_RESULTS,
      // include: ["documents", "metadatas", "distances"], // optional extra info
    });

    if (!results.documents || results.documents.length === 0 || !results.documents[0].length) {
      return "No relevant information found in the knowledge base.";
    }

    const context = results.documents[0].join("\n\n");

    // 3. Build the prompt with retrieved context
    const prompt = `You are a helpful assistant that answers questions about the Marvel Cinematic Universe (MCU).

Use only the following context to answer the question. If the answer is not in the context, say you don't know.

Context:
${context}

Question: ${question}

Answer:`;

    // 4. Call DeepSeek
    const response = await openai.chat.completions.create({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: "You are an MCU expert." },
        { role: "user", content: prompt },
      ],
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
    });

    return response.choices[0].message.content ?? "No answer generated.";
  } catch (error) {
    console.error("Error in askMCU:", error);
    throw error;
  }
}

// ========== USAGE ==========
// If the file is run directly (e.g., using tsx or ts-node):
//   npx tsx rag-query.ts "Who is Iron Man?"
if (import.meta.url === `file://${process.argv[1]}`) {
  const question = process.argv.slice(2).join(" ") || "Who is the strongest Avenger?";

  askMCU(question)
    .then((answer) => {
      console.log("\nAnswer:\n", answer);
    })
    .catch((err) => {
      console.error("Failed to answer:", err);
    });
}

export { askMCU };