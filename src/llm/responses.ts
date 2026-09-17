import { openai } from "./connect";
import { message } from "../../agents/chatInput";
import { saveContextToFile } from "../csvParser";

export async function chat() {
    try {
        if(!message().isFirst) {
            const nextMessage = message().input
            await send(nextMessage);
        }

        const firstMessage = message().input;
        await send(firstMessage);
        
    } catch (err: any) {
        throw new Error('Chat error');
    }
}

async function send(firstMessage?: string, nextMessage?: string, lastResponse?: string): Promise<string> {
    try {
        const message: string = firstMessage ?? `${lastResponse}\n${nextMessage}`;
        const chatResponse = await openai.responses.create({
            model: process.env.MODEL as string,
            reasoning: {
                effort: "low"
            },
            temperature: 1,
            instructions: "You are a assitant that helps me",
            input: message,
        });

        storeContext(message, chatResponse.output_text);
        return chatResponse.output_text;
    } catch (err: any) {
        throw new Error('Error in send message');
    }
}

function storeContext(message: string, lastResponse?: string) {
    const newLine = !lastResponse ? message : `${message}\n${lastResponse}\n`;
    checkIfContextIsEmpty(lastResponse ?? null);
    console.log(newLine, 'CTX')
    saveContextToFile(newLine);
    return newLine;
}

function checkIfContextIsEmpty(response: string | null) {
    !response ? true : false
}