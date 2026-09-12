import { addToCollection, getCollections } from "../database/collections";
import { dbConnect } from "../database/connect";
import { listAllColletions } from "../database/collections";
import { chatResponse } from "./llm/responses";

async function main(): Promise<any> {
   await chatResponse();
   // await addToCollection();
   // await getCollections();
   // await listAllColletions();
}

main();