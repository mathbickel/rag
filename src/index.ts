import { addToCollection, getCollections } from "../database/collections";
import { dbConnect } from "../database/connect";
import { listAllColletions } from "../database/collections";
import { chat, reviewFiles } from "./llm/responses";
import path from 'path';


async function main(): Promise<any> {
   // return await chat();
   return await reviewFiles([
      path.join(__dirname, 'llm/responses.ts'),
      path.join(__dirname, 'llm/contextStore.ts'),
      path.join(__dirname, '../agents/chatInput.ts'),
      path.join(__dirname, 'rag/rag-query.ts'),
      path.join(__dirname, '../database/collections.ts'),
])
   // await addToCollection();
   // await getCollections();
   // await listAllColletions();
}

main();