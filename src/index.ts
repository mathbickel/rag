import { addToCollection, getCollections } from "../database/collections";
import { dbConnect } from "../database/connect";
import { listAllColletions } from "../database/collections";
import { chat, reviewFiles,  } from "./llm/responses";


async function main(): Promise<any> {
   // return await chat();
   return await reviewFiles([
      './src/llm/responses.ts',
      './src/llm/contextStore.ts',
      './agents/chatInput.ts',
      './src/rag/rag-query.ts',
      './database/collections.ts'
   ])
      .then(console.log)
      .catch(console.error);
   // await addToCollection();
   // await getCollections();
   // await listAllColletions();
}

main();