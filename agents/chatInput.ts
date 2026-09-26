export type Message = {
    role: string,
    isFirst: boolean,
    input: string
}

export function createMessage(): Message {
    return {
        role: 'system',
        isFirst: false,
        input: 'theres alreay a file that chats with open ai and do all the context saving for keep chating memory. check if theres anything that we can use about into the rag-query',
    };
}

// wich nunmber i asked you to save?