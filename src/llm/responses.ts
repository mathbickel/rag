import { openai } from "./connect";
import { firstOrNextMessage } from "../../agents/chatInput";

export async function chatResponse() {
    try {
        return await send(firstOrNextMessage());
    } catch (err: any) {
        console.log(err.message, 'ERROR 1');
    }
}

async function send(lastResponse?: string, newMessage?: string): Promise<string | undefined> {
    try {
        const inputs: string = `${lastResponse}\n${newMessage}`;
        const chatResponse = await openai.responses.create({
            model: process.env.MODEL as string,
            reasoning: {
                effort: "high"
            },
            temperature:1,
            instructions: "You are a agent that helps me",
            input: inputs,
        });

        if(newMessage != null) {
            send(chatResponse.output_text, newMessage);
            console.log(chatResponse.output_text, 'RESPONSE 1')
        }

        console.log(chatResponse.output_text, 'RESPONSE 2')
        return chatResponse.output_text;
    } catch (err: any) {
        console.log(err.message, 'ERROR 2')
    }
}

chatResponse();