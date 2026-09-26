import { createMessage, Message } from '../../agents/chatInput';
import { openai } from './connect';
import { loadContext, saveContext, Turn, Context } from './contextStore';
import fs from 'fs';
import path from 'path';

const MAX_RECENT_TURNS = 6;

export async function chat(): Promise<string> {
    try {
        const ctx = loadContext();
        const message = createMessage();
        return await send(message, ctx);
    } catch (err) {
        throw new Error('Chat error');
    }
}

async function ask(input: string, instructions: string): Promise<string> {
    const response = await openai.responses.create({
        model: process.env.MODEL as string,
        reasoning: { effort: 'low' },
        temperature: 1,
        instructions,
        input,
    });
    return response.output_text;
}

export async function send(message: Message, ctx: Context): Promise<string> {
    const prompt = buildPrompt(message, ctx);

    const response = await openai.responses.create({
        model: process.env.MODEL as string,
        reasoning: { effort: 'low' },
        temperature: 1,
        instructions: 'You are an assistant that helps me',
        input: prompt,
    });

    const newTurn: Turn = { input: message.input, response: response.output_text };
    let { summary, recent } = ctx;
    recent = [...recent, newTurn];

    if (recent.length > MAX_RECENT_TURNS) {
        const evicted = recent.slice(0, recent.length - MAX_RECENT_TURNS);
        recent = recent.slice(-MAX_RECENT_TURNS);
        summary = await compact(summary, evicted);
    }

    saveContext({ summary, recent });
    return response.output_text;
}

function buildPrompt(message: Message, ctx: Context): string {
    const parts: string[] = [];
    if (ctx.summary) parts.push(`Summary of earlier conversation:\n${ctx.summary}`);
    if (ctx.recent.length) {
        const transcript = ctx.recent
            .map(t => `User: ${t.input}\nAssistant: ${t.response}`)
            .join('\n\n');
        parts.push(`Recent conversation:\n${transcript}`);
    }
    parts.push(`User: ${message.input}`);
    return parts.join('\n\n');
}

async function compact(previousSummary: string, evicted: Turn[]): Promise<string> {
    const transcript = evicted
        .map(t => `User: ${t.input}\nAssistant: ${t.response}`)
        .join('\n\n');

    const response = await openai.responses.create({
        model: process.env.MODEL as string,
        reasoning: { effort: 'low' },
        temperature: 0,
        instructions:
            'You maintain a running summary of a conversation. Merge the new turns ' +
            'into the previous summary, preserving facts, names, numbers, decisions, ' +
            'and user preferences. Be concise. Output only the updated summary.',
        input: [
            previousSummary ? `Previous summary:\n${previousSummary}` : '',
            `New turns to merge:\n${transcript}`,
        ].filter(Boolean).join('\n\n'),
    });

    return response.output_text.trim();
}

export async function reviewFiles(filePaths: string[]): Promise<string> {
    const blocks = filePaths.map(filePath => {
        const code = fs.readFileSync(filePath, 'utf-8');
        const name = path.basename(filePath);
        return [
            `### File: ${name}`,
            '',
            '```ts',
            code,
            '```',
        ].join('\n');
    });

    const prompt = [
        'Review the following files together. Consider how they interact.',
        'i need to build a RAG that works to catch the data from chromadb and anwser the user questions.', +
        'It all needs to work togheter, reusing the methods that already exists and add some more if need.', +
        'you can give me the all files writen.',
        ...blocks,
    ].join('\n\n');

    return ask(prompt, 'You are a senior developer, needs to help to write code.');
}