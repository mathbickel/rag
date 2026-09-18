export type Message = {
    role: string,
    isFirst: boolean,
    input: string
}

export function message(): Message {

    return {
        role: 'system',
        isFirst: true,
        input: "save the number 1 please"
    }
}