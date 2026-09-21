import { openai } from "./connect";
import { message } from "../../agents/chatInput";
import { saveContextToFile } from "../csvParser";
import { Message } from "../../agents/chatInput";

export async function chat() {
    try {
        await send(message())
    } catch (err: any) {
        throw new Error('Chat error');
    }
}

async function send(data: Message, lastResponse?: string): Promise<string> {
    try {
        const message = formatMessage(data);
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

function formatMessage(data: Message, lastResponse?: string): string {
    return data.isFirst ? data.input : `${lastResponse}\n${data.input}`;
}

function storeContext(message: string, lastResponse?: string): void {
    const newLine = !lastResponse ? message : `${message}\n${lastResponse}\n`;
    saveContextToFile(newLine);
}