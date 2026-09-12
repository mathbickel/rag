import { Collection } from "chromadb";
import { dbConnect } from "./connect";
import { getDocuments } from "../src/csvParser";
import { ChromaClient } from "chromadb";

export async function createCollection():Promise<Collection> {
    const connection = await connect();
    return connection.createCollection({
        name: "mcu_collection",
    });
}

export async function addToCollection(): Promise<void> {
    const data = getDocuments();

    const addNewColl = await createCollection();
    return await addNewColl.add({ ids: data.ids, documents: data.documents})
}

export async function getCollections() {
    const connection = await connect()
    return await connection.getCollection({ name: "mcu_collection" });
}

export async function listAllColletions(): Promise<Collection[]> {
    const connection = await connect();
    return await connection.listCollections();
}

export async function saveChatResponseToContext() {
    const connection = await connect();
    const addContextCollection = await createCollection();
    // return await addContextCollection.add({})
}


async function connect(): Promise<ChromaClient> {
    return await dbConnect();
}