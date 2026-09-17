import { addToCollection, getCollections } from "../database/collections";
import { dbConnect } from "../database/connect";
import { listAllColletions } from "../database/collections";
import { chat } from "./llm/responses";

async function main(): Promise<any> {
   return await chat();
   // await addToCollection();
   // await getCollections();
   // await listAllColletions();
}

main();