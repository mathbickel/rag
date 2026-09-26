import { createMessage, Message } from '../../agents/chatInput';
import { openai } from './connect';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Turn = { input: string; response: string };
export type Context = { summary: string; recent: Turn[] };

type StreamConfig = {
    fileName: string;
    instructions: string;
    maxRecentTurns: number;
};

// ---------------------------------------------------------------------------
// Stream definitions
// ---------------------------------------------------------------------------

const CHAT_STREAM: StreamConfig = {
    fileName: 'chat.context.txt',
    instructions: 'You are an assistant that helps me',
    maxRecentTurns: 6,
};

const REVIEW_STREAM: StreamConfig = {
    fileName: 'review.context.txt',
    instructions: 'You are a senior code reviewer. Be concise and specific.',
    maxRecentTurns: 4,
};

// ---------------------------------------------------------------------------
// Context persistence (inlined from contextStore.ts)
// ---------------------------------------------------------------------------

const SUMMARY_MARK = '<<<SUMMARY>>>';
const RECENT_MARK = '<<<RECENT>>>';

function loadContext(fileName: string): Context {
    const filePath = path.join(__dirname, fileName);
    if (!fs.existsSync(filePath)) return { summary: '', recent: [] };

    const raw = fs.readFileSync(filePath, 'utf-8');
    const [summaryPart = '', recentPart = ''] = raw.split(RECENT_MARK);
    const summary = summaryPart.replace(SUMMARY_MARK, '').trim();

    return { summary, recent: parseRecent(recentPart) };
}

function saveContext(fileName: string, ctx: Context): void {
    const filePath = path.join(__dirname, fileName);
    const body = [
        SUMMARY_MARK,
        ctx.summary.trim(),
        '',
        RECENT_MARK,
        ...ctx.recent.flatMap(t => [t.input, t.response, '']),
    ].join('\n');

    fs.writeFileSync(filePath, body, 'utf-8');
}

function parseRecent(chunk: string): Turn[] {
    const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);
    const turns: Turn[] = [];
    for (let i = 0; i < lines.length; i += 2) {
        const input = lines[i];
        const response = lines[i + 1];
        if (input && response) turns.push({ input, response });
    }
    return turns;
}

// ---------------------------------------------------------------------------
// Raw model call
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Prompt building
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Compaction
// ---------------------------------------------------------------------------

async function compact(
    previousSummary: string,
    evicted: Turn[],
    baseInstructions: string,
): Promise<string> {
    const transcript = evicted
        .map(t => `User: ${t.input}\nAssistant: ${t.response}`)
        .join('\n\n');

    const summary = await ask(
        [
            previousSummary ? `Previous summary:\n${previousSummary}` : '',
            `New turns to merge:\n${transcript}`,
        ].filter(Boolean).join('\n\n'),
        `${baseInstructions}\n\n` +
        'You maintain a running summary of this conversation. Merge the new turns ' +
        'into the previous summary, preserving facts, names, numbers, decisions, ' +
        'and user preferences. Be concise. Output only the updated summary.',
    );

    return summary.trim();
}

// ---------------------------------------------------------------------------
// Generic turn runner (shared by chat and review)
// ---------------------------------------------------------------------------

async function send(
    message: Message,
    ctx: Context,
    config: StreamConfig,
): Promise<string> {
    const prompt = buildPrompt(message, ctx);
    const response = await ask(prompt, config.instructions);

    const newTurn: Turn = { input: message.input, response };
    let { summary, recent } = ctx;
    recent = [...recent, newTurn];

    if (recent.length > config.maxRecentTurns) {
        const evicted = recent.slice(0, recent.length - config.maxRecentTurns);
        recent = recent.slice(-config.maxRecentTurns);
        summary = await compact(summary, evicted, config.instructions);
    }

    saveContext(config.fileName, { summary, recent });
    return response;
}

// ---------------------------------------------------------------------------
// Public entry points
// ---------------------------------------------------------------------------

export async function chat(): Promise<string> {
    try {
        const ctx = loadContext(CHAT_STREAM.fileName);
        const message = createMessage();
        return await send(message, ctx, CHAT_STREAM);
    } catch (err) {
        throw new Error('Chat error');
    }
}

export async function reviewFiles(filePaths: string[]): Promise<string> {
    const ctx = loadContext(REVIEW_STREAM.fileName);

    const blocks = filePaths.map(filePath => {
        const code = fs.readFileSync(filePath, 'utf-8');
        const name = path.basename(filePath);
        return [`### File: ${name}`, '', '```ts', code, '```'].join('\n');
    });

    const prompt = [
        'Review the following files together. Consider how they interact.',
        'i need to build a RAG that works to catch the data from chromadb and anwser the user questions.', +
        'It all needs to work togheter, reusing the methods that already exists and add some more if need.', +
        'you can give me the all files writen.',
        '',
        ...blocks,
    ].join('\n\n');

    const message: Message = {
        role: 'user',
        input: prompt,
    };

    return send(message, ctx, REVIEW_STREAM);
}