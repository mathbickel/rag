import fs from 'fs';
import path from 'path';

export type Turn = { input: string; response: string };
export type Context = { summary: string; recent: Turn[] };

const FILE = path.join(__dirname, 'context.txt');
const SUMMARY_MARK = '<<<SUMMARY>>>';
const RECENT_MARK  = '<<<RECENT>>>';

export function loadContext(): Context {
    if (!fs.existsSync(FILE)) return { summary: '', recent: [] };

    const raw = fs.readFileSync(FILE, 'utf-8');
    const [summaryPart = '', recentPart = ''] = raw.split(RECENT_MARK);
    const summary = summaryPart.replace(SUMMARY_MARK, '').trim();

    return {
        summary,
        recent: parseRecent(recentPart),
    };
}

export function saveContext(ctx: Context): void {
    const body = [
        SUMMARY_MARK,
        ctx.summary.trim(),
        '',
        RECENT_MARK,
        ...ctx.recent.flatMap(t => [t.input, t.response, '']),
    ].join('\n');

    fs.writeFileSync(FILE, body, 'utf-8');
}

function parseRecent(chunk: string): Turn[] {
    const lines = chunk
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

    const turns: Turn[] = [];
    for (let i = 0; i < lines.length; i += 2) {
        const input = lines[i];
        const response = lines[i + 1];
        if (input && response) turns.push({ input, response });
    }
    return turns;
}