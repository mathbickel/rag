import { openai } from "./connect";

export async function chatResponse() {
    const response = await openai.responses.create({
        model: "deepseek-v4-pro",
        reasoning: {
            effort: "high"
        },
        temperature:1,
        instructions: "You are a agent that helps me",
        input: "I need you to create an agent to write unitary and end2end tests for all the system features. as example, now we have the llm connection, the chroma db connection, and csv parser. you must to be pragmatic, do not write unnecessary tests. theres already a paste called agent and a file called testAgent that you should use to write the agent",
  });

  console.log(response.output_text, 'CHAT RESPONSE');
}

async function saveChatResponse(response: {output_text: string}) {
    const chatResponse = response.output_text;
    
}

chatResponse();