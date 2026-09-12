import { ChromaClient } from "chromadb";

export async function dbConnect(): Promise<ChromaClient> {
    return new ChromaClient();
}

dbConnect();